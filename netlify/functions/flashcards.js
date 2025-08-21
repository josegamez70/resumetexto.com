// server/api/flashcards.js (o donde manejes tus rutas de API)
import { GoogleGenerativeAI } from "@google/generative-ai"; // Asegúrate de importar esto

// Asume que tu clave de API está configurada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // O "gemini-1.5-pro", etc.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { summaryText } = req.body;

  if (!summaryText) {
    return res.status(400).json({ error: "summaryText is required" });
  }

  const prompt = `A partir del siguiente resumen, genera entre 10 y 15 flashcards. Cada flashcard debe tener una "pregunta" basada en una idea principal y una "respuesta" concisa. Formatea la salida estrictamente como un array JSON de objetos, donde cada objeto tenga las propiedades "question" y "answer".\n\nEjemplo de formato: [{ "question": "Pregunta 1", "answer": "Respuesta 1" }, { "question": "Pregunta 2", "answer": "Respuesta 2" }]\n\nResumen:\n${summaryText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpiar la salida si la IA incluye markdown (ej. ```json ... ```)
    text = text.replace(/```json\n?|\n?```/g, "").trim();

    const flashcards = JSON.parse(text);

    // Opcional: Validar la estructura de las flashcards si quieres ser muy estricto
    if (!Array.isArray(flashcards) || !flashcards.every(f => typeof f.question === 'string' && typeof f.answer === 'string')) {
        throw new Error("Formato de flashcards inválido recibido de la IA.");
    }

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error("Error generating flashcards from Gemini:", error);
    res.status(500).json({ error: "Failed to generate flashcards." });
  }
}