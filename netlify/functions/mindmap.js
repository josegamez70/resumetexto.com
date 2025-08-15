// netlify/functions/mindmap.js
// Genera un Mapa Mental a partir de texto. Acepta { text } o { summaryText } o { content }.

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.VITE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error:
            "Falta la API Key (GOOGLE_AI_API_KEY / VITE_API_KEY / GEMINI_API_KEY). Configúrala en Netlify → Site settings → Environment.",
        }),
      };
    }

    let payload = {};
    try { payload = JSON.parse(event.body || "{}"); }
    catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) };
    }

    const rawText =
      (typeof payload.text === "string" && payload.text) ||
      (typeof payload.summaryText === "string" && payload.summaryText) ||
      (typeof payload.content === "string" && payload.content) ||
      "";

    const text = rawText.trim();
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta 'text' (string) en el body." }) };
    }

    // recortamos por si viene enorme
    const MAX = 12000;
    const safe = text.length > MAX ? text.slice(0, MAX) : text;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Genera un MAPA MENTAL en ESPAÑOL a partir del TEXTO. Devuelve EXCLUSIVAMENTE JSON válido sin comentarios ni bloque de código.

Estructura:
{
  "mindmap": {
    "root": {
      "id": "string",
      "label": "Tema principal",
      "note": "opcional, muy breve",
      "children": [
        {
          "id": "string",
          "label": "rama 1",
          "note": "opcional",
          "children": [
            { "id": "string", "label": "subrama", "note": "opcional" }
          ]
        }
      ]
    }
  }
}

Criterios:
- Raíz = tema principal. 5–8 ramas máximas. 1–3 niveles de profundidad.
- Etiquetas cortas (2–6 palabras), "note" concisa.
- Nada de texto fuera del JSON.

TEXTO:
${safe}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 },
    });

    let raw = result.response.text().trim();

    // Parse robusto del JSON
    let out;
    try { out = JSON.parse(raw); }
    catch {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      try { out = JSON.parse(cleaned); }
      catch {
        const s = cleaned.indexOf("{"); const e = cleaned.lastIndexOf("}");
        if (s !== -1 && e !== -1 && e > s) {
          try { out = JSON.parse(cleaned.slice(s, e + 1)); }
          catch {
            console.error("[mindmap] JSON inválido:", raw);
            return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió JSON válido." }) };
          }
        } else {
          console.error("[mindmap] Sin bloque JSON:", raw);
          return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió JSON válido." }) };
        }
      }
    }

    if (!out || !out.mindmap) {
      return { statusCode: 500, body: JSON.stringify({ error: "Respuesta sin 'mindmap'." }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(out),
    };
  } catch (err) {
    console.error("[mindmap] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en mindmap" }) };
  }
};
