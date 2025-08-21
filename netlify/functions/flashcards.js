// netlify/functions/flashcards.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Asume que tu clave de API está configurada como GOOGGLE_AI_API_KEY en las variables de entorno de Netlify
const genAI = new GoogleGenerativeAI(process.env.GOOGGLE_AI_API_KEY); // Confirmado: este nombre está bien
// CAMBIA AQUÍ EL MODELO:
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // <-- ¡USA ESTE MODELO! (O "gemini-2.0-flash")

// La función handler para Netlify Functions
exports.handler = async (event, context) => {
  // Asegúrate de que solo se acepten solicitudes POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: { "Content-Type": "application/json" }
    };
  }

  let summaryText;
  try {
    // El cuerpo de la solicitud (JSON) está en event.body
    const body = JSON.parse(event.body);
    summaryText = body.summaryText;
  } catch (parseError) {
    console.error("Error parsing request body:", parseError);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
      headers: { "Content-Type": "application/json" }
    };
  }

  if (!summaryText || typeof summaryText !== 'string' || summaryText.trim().length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "summaryText is required and must be a non-empty string" }),
      headers: { "Content-Type": "application/json" }
    };
  }

  const prompt = `A partir del siguiente resumen, genera entre 10 y 15 flashcards. Cada flashcard debe tener una "pregunta" basada en una idea principal y una "respuesta" concisa. Formatea la salida estrictamente como un array JSON de objetos, donde cada objeto tenga las propiedades "question" y "answer".
  
  Ejemplo de formato:
  [
    { "question": "Pregunta sobre el concepto A", "answer": "Definición o explicación del concepto A" },
    { "question": "¿Cuál es la capital de Francia?", "answer": "París" }
  ]
  
  Resumen:\n${summaryText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpiar la salida si la IA incluye markdown (ej. ```json ... ```)
    text = text.replace(/```json\n?|\n?```/g, "").trim();

    let flashcards;
    try {
      flashcards = JSON.parse(text);
      // Validar que es un array y que sus elementos tienen la estructura esperada
      if (!Array.isArray(flashcards) || !flashcards.every(f => typeof f === 'object' && f !== null && 'question' in f && 'answer' in f)) {
        console.error("AI returned invalid flashcards structure:", flashcards);
        throw new Error("AI returned invalid flashcards structure.");
      }
    } catch (parseAndValidateError) {
      console.error("Error parsing or validating AI response JSON:", parseAndValidateError);
      console.error("Raw AI response:", text); // Log the raw response for debugging
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to parse AI response for flashcards." }),
        headers: { "Content-Type": "application/json" }
      };
    }

    // Filtrar flashcards que puedan haber quedado vacías si la IA no generó bien
    const validFlashcards = flashcards.filter(card => 
      String(card.question || '').trim().length > 0 && 
      String(card.answer || '').trim().length > 0
    );

    if (validFlashcards.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI generated no valid flashcards. Please try a more detailed summary." }),
        headers: { "Content-Type": "application/json" }
      };
    }

    // Si todo va bien, devuelve el array de flashcards
    return {
      statusCode: 200,
      body: JSON.stringify({ flashcards: validFlashcards }),
      headers: { "Content-Type": "application/json" }
    };

  } catch (error) {
    console.error("Error during flashcard generation process:", error);
    // Captura cualquier otro error durante la llamada a Gemini o procesamiento
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate flashcards. Please check function logs." }),
      headers: { "Content-Type": "application/json" }
    };
  }
};