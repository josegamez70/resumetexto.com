// netlify/functions/flashcards.js
// Ahora usa gemini-2.5-flash por defecto y fuerza salida JSON.

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY" }) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  let summaryText, preferModel;
  try {
    const body = JSON.parse(event.body || "{}");
    summaryText = body.summaryText;
    preferModel = body.preferModel || "gemini-2.5-flash";
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  if (!summaryText || typeof summaryText !== "string" || !summaryText.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "summaryText es obligatorio" }) };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: String(preferModel) });

    const prompt = `A partir del siguiente resumen, genera entre 10 y 20 flashcards.
Cada flashcard debe tener "question" (pregunta directa) y "answer" (respuesta concisa).
Devuelve EXCLUSIVAMENTE un array JSON válido, sin texto extra.

Ejemplo:
[
  { "question": "¿Quién fue el líder de la Alemania nazi?", "answer": "Adolf Hitler" },
  { "question": "¿Cuándo empezó la Segunda Guerra Mundial?", "answer": "1 de septiembre de 1939" }
]

Resumen:
${summaryText}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    });

    let text = result?.response?.text?.() || "[]";
    text = text.replace(/```json\n?|\n?```/g, "").trim();

    let flashcards = [];
    try { flashcards = JSON.parse(text); }
    catch {
      const a = text.indexOf("["), b = text.lastIndexOf("]");
      if (a !== -1 && b > a) flashcards = JSON.parse(text.slice(a, b + 1));
    }

    if (!Array.isArray(flashcards)) {
      return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió un array JSON." }) };
    }

    const valid = flashcards.filter(
      (f) => f && typeof f === "object" && String(f.question || "").trim() && String(f.answer || "").trim()
    );

    if (!valid.length) {
      return { statusCode: 500, body: JSON.stringify({ error: "AI generó 0 flashcards válidas." }) };
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flashcards: valid }) };
  } catch (error) {
    console.error("flashcards error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Internal error" }) };
  }
};
