// netlify/functions/mindmap.js
// Genera un mapa mental (resumido) a partir de { text } y devuelve { mindmap }
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

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Body vacío. Envía { text }" }) };
    }

    let payload;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) };
    }

    const { text } = payload;
    if (!text || typeof text !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { text: string }." }) };
    }

    const MAX = 10000;
    const safeText = text.length > MAX ? text.slice(0, MAX) : text;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Eres un generador de mapas mentales. A partir del TEXTO, crea un árbol jerárquico (máx. 5 niveles),
con títulos cortos y claros. No inventes datos. Agrupa por temas.

Devuelve **EXCLUSIVAMENTE** un JSON válido (sin comentarios, sin explicaciones, sin prefijos/sufijos ni bloques \`\`\`).
Tu **primer carácter** debe ser '{' y tu **último carácter** debe ser '}'.

Esquema esperado (ejemplo de formato, no inventes campos nuevos):
{
  "root": {
    "id": "root",
    "label": "TÍTULO PRINCIPAL",
    "children": [
      {
        "id": "n1",
        "label": "Subtema",
        "note": "opcional",
        "children": [
          { "id": "n1a", "label": "Idea", "note": "opcional" }
        ]
      }
    ]
  }
}

TEXTO:
${safeText}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4 }, // ← sin responseMimeType
    });

    let raw = result.response.text().trim();

    // ---- Parse robusto ----
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      try {
        data = JSON.parse(cleaned);
      } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          const slice = cleaned.slice(start, end + 1);
          try {
            data = JSON.parse(slice);
          } catch {
            console.error("[mindmap] JSON inválido. raw:", raw);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: "La IA no devolvió JSON válido.", raw: raw.slice(0, 5000) }),
            };
          }
        } else {
          console.error("[mindmap] No se encontró bloque JSON. raw:", raw);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: "La IA no devolvió JSON válido.", raw: raw.slice(0, 5000) }),
          };
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mindmap: data }),
    };
  } catch (err) {
    console.error("[mindmap] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en mindmap" }) };
  }
};
