const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      console.error("[summarize] ERROR: GOOGLE_AI_API_KEY no está configurada en el servidor.");
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Falta GOOGLE_AI_API_KEY en las variables de entorno del servidor.",
        }),
      };
    }

    const { fileParts, summaryType } = JSON.parse(event.body || "{}");

    if (!fileParts || !Array.isArray(fileParts) || fileParts.length === 0) {
      console.error("[summarize] ERROR: No se recibieron fileParts válidos.");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No se recibieron fileParts válidos." }),
      };
    }

    console.log(`[summarize] Resumen solicitado con ${fileParts.length} partes, tipo: ${summaryType}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Genera un resumen en español del siguiente contenido. Tipo de resumen: ${summaryType}`;
    const result = await model.generateContent([prompt, ...fileParts]);
    const text = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ summary: text }),
    };
  } catch (error) {
    console.error("[summarize] ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Error interno en summarize" }),
    };
  }
};
