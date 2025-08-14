// netlify/functions/summarize.js
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
      return { statusCode: 400, body: JSON.stringify({ error: "Body vacío. Envía { text, summaryType }" }) };
    }

    const { text, summaryType } = JSON.parse(event.body);
    if (!text || typeof text !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta 'text' (string)." }) };
    }

    const MAX = 10000;
    const safeText = text.length > MAX ? text.slice(0, MAX) : text;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-pro-exp-02-05" });

    const prompt = `Resume en español con estilo ${summaryType || "Short"} de forma clara y fiel:
${safeText}`;

    const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const summary = (await res.response.text()).trim();

    const titlePrompt = `Título breve (≤10 palabras) para este contenido en español:\n${safeText}`;
    const titleRes = await model.generateContent({ contents: [{ role: "user", parts: [{ text: titlePrompt }] }] });
    const title = (await titleRes.response.text()).replace(/[\n\r]+/g, " ").trim();

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ summary, title }) };
  } catch (err) {
    return { statusCode
