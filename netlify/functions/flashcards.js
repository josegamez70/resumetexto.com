// netlify/functions/flashcards.js
// Genera flashcards y parsea robusto arrays JSON.

const { GoogleGenerativeAI } = require("@google/generative-ai");

function safeJsonParseArray(s) {
  const cleaned = String(s || "").replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { const arr = JSON.parse(cleaned); if (Array.isArray(arr)) return arr; } catch {}
  const a = cleaned.indexOf("["), b = cleaned.lastIndexOf("]");
  if (a !== -1 && b > a) { try { return JSON.parse(cleaned.slice(a, b + 1)); } catch {} }
  throw new Error("La IA no devolvió un array JSON válido.");
}

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY" }) };
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };

    let summaryText, preferModel;
    try {
      const body = JSON.parse(event.body || "{}");
      summaryText = String(body.summaryText || "");
      preferModel = String(body.preferModel || "gemini-2.5-flash");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    if (!summaryText.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "summaryText es obligatorio" }) };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: preferModel });

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

    const raw = String(result?.response?.text?.() || "");
    let flashcards = safeJsonParseArray(raw);

    const valid = flashcards.filter(
      (f) => f && typeof f === "object" && String(f.question || "").trim() && String(f.answer || "").trim()
    );

    if (!valid.length) {
      return { statusCode: 500, body: JSON.stringify({ error: "AI generó 0 flashcards válidas." }) };
    }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flashcards: valid }) };
  } catch (error) {
    console.error("[flashcards] ERROR:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Internal error" }) };
  }
};
