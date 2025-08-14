// netlify/functions/summarize.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    // Carga ESM en CommonJS para evitar ERR_REQUIRE_ESM
    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    // Acepta varios nombres de variable (pon al menos una en Netlify)
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
            "Falta la API Key. Configura GOOGLE_AI_API_KEY (o VITE_API_KEY / GEMINI_API_KEY) en Netlify → Site settings → Environment.",
        }),
      };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Body vacío. Envía { text, summaryType }." }) };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) };
    }

    const { text, summaryType } = body;
    if (!text || typeof text !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta 'text' (string) en el body." }) };
    }

    const MAX = 10000; // límite de seguridad
    const safeText = text.length > MAX ? text.slice(0, MAX) : text;

    const genAI = new GoogleGenerativeAI(apiKey);
    // Modelo estable y disponible
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Eres un asistente que resume textos en español.
Objetivo: crear un resumen ${summaryType || "Short"} claro y fiel al original.
Devuelve SOLO el resumen, sin bloques de código ni comentarios.
Texto:
${safeText}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const summary = result.response.text().trim();

    // Título breve (6–10 palabras)
    const titlePrompt = `Escribe un título breve (máx. 10 palabras) en español para este contenido:\n${safeText}`;
    const titleRes = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: titlePrompt }] }],
    });
    const title = titleRes.response.text().replace(/[\r\n]+/g, " ").trim();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, title }),
    };
  } catch (err) {
    console.error("[summarize] error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err?.message || "Error al resumir" }),
    };
  }
};
