// netlify/functions/summarize.js
// Acepta: { text, summaryType }  o  { summaryType, file: { name, mimeType, base64 } }
// - Para imágenes/PDF: usa inlineData (visión) con gemini-1.5-pro
// - Para texto: usa prompt normal

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("[summarize] Falta GOOGLE_AI_API_KEY");
      return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY en entorno." }) };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) }; }

    const { text, summaryType, file } = body;
    if (!summaryType) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta summaryType" }) };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const systemGuide = `
Eres un asistente que resume documentos en ESPAÑOL. Prioriza claridad, brevedad y estructura en viñetas cuando sea útil.
Adecúa el tono al tipo de resumen (${summaryType}).
- Si el material es una IMAGEN/PDF con imágenes: primero deduce el texto (OCR implícito) y luego resume.
- Si hay fórmulas/tablas, explica el contenido de forma legible.
- No inventes contenido que no esté en el material.
`;

    let parts = [{ text: systemGuide }];

    if (file && file.base64 && file.mimeType) {
      // Visión: imagen o PDF (escaneado o con gráficos)
      parts.push({ inlineData: { mimeType: file.mimeType, data: file.base64 } });
    } else if (typeof text === "string" && text.trim()) {
      // Texto plano
      parts.push({ text: text.trim() });
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta 'text' o 'file'." }) };
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.4 },
    });

    const out = (result && result.response && result.response.text && result.response.text()) || "";
    const summary = String(out || "").trim();

    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (error) {
    console.error("[summarize] ERROR:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Error interno en summarize" }) };
  }
};
