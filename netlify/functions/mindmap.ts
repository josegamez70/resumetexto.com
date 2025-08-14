// netlify/functions/mindmap.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta API Key (GOOGLE_AI_API_KEY / VITE_API_KEY)" }) };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Body vacío. Envía { text }" }) };
    }

    const { text } = JSON.parse(event.body);
    if (!text || typeof text !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { text: string }." }) };
    }

    const MAX = 10000;
    const safeText = text.length > MAX ? text.slice(0, MAX) : text;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Eres un generador de mapas mentales. A partir del TEXTO, crea un árbol jerárquico (máx. 5 niveles).
Devuelve EXCLUSIVAMENTE JSON válido (sin \`\`\`, sin comentarios), con este esquema:

{
  "root": {
    "id": "root",
    "label": "TÍTULO PRINCIPAL",
    "children": [
      { "id": "n1", "label": "Subtema", "note": "opcional", "children": [
        { "id": "n1a", "label": "Idea", "note": "opcional" }
      ]}
    ]
  }
}

TEXTO:
${safeText}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6 },
    });

    let raw = (await result.response.text()).trim();
    raw = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

    let data;
    try { data = JSON.parse(raw); }
    catch { return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió JSON válido", raw }) }; }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mindmap: data }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en mindmap" }) };
  }
};
