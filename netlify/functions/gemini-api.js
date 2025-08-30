// netlify/functions/gemini-api.js
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
      return { statusCode: 400, body: JSON.stringify({ error: "Body vacío. Envía { imageBase64, mimeType }" }) };
    }

    const { imageBase64, mimeType } = JSON.parse(event.body);
    if (!imageBase64 || !mimeType) {
      return { statusCode: 400, body: JSON.stringify({ error: "Faltan 'imageBase64' y/o 'mimeType'." }) };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: "Extrae todo el texto legible de la imagen, en español, sin comentarios." },
          ],
        },
      ],
    });

    const text = (await result.response.text()).trim();
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en OCR" }) };
  }
};
