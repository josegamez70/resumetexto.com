// netlify/functions/flashcards.js
// Usar require() para GoogleGenerativeAI es más consistente con tus otras funciones de Netlify
const { GoogleGenerativeAI } = require("@google/generative-ai");

// La función handler para Netlify Functions
exports.handler = async (event, context) => {
  const apiKey = process.env.GOOGLE_AI_API_KEY; // ¡Asegúrate de que este nombre sea correcto en Netlify!

  console.log('Flashcards function started.');
  if (apiKey) {
    console.log('API Key successfully loaded (length:', apiKey.length, ', starts with:', apiKey.substring(0, 5), '...).');
  } else {
    console.error('CRITICAL ERROR: API Key is NOT available in environment variable GOOGLE_AI_API_KEY.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration Error: API Key is missing for flashcards function." }),
      headers: { "Content-Type": "application/json" }
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
      headers: { "Content-Type": "application/json" }
    };
  }

  let summaryText;
  try {
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

  let genAIInstance;
  try {
    genAIInstance = new GoogleGenerativeAI(apiKey);
  } catch (initError) {
    console.error("Error initializing GoogleGenerativeAI instance:", initError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to initialize AI model instance. Check API Key validity and Google Cloud project setup." }),
      headers: { "Content-Type": "application/json" }
    };
  }

  const model = genAIInstance.getGenerativeModel({ model: "gemini-1.5-pro" });

  // --- CAMBIO AQUÍ PARA PEDIR 10-20 FLASHCARDS ---
  const prompt = `A partir del siguiente resumen, genera entre 10 y 20 flashcards. Cada flashcard debe tener una "pregunta" basada en una idea principal y una "respuesta" concisa y directa. Asegúrate de que la pregunta y la respuesta sean claras y distintas.
  Formatea la salida estrictamente como un array JSON de objetos, donde cada objeto tenga las propiedades "question" y "answer".

  Ejemplo de formato:
  [
    { "question": "¿Quién fue el líder de la Alemania nazi?", "answer": "Adolf Hitler" },
    { "question": "¿Cuándo empezó la Segunda Guerra Mundial?", "answer": "El 1 de septiembre de 1939" }
  ]

  Resumen:\n${summaryText}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 }, // Reducir temperatura para menos creatividad y más fidelidad
    });

    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json\n?|\n?```/g, "").trim();

    let flashcards;
    try {
      flashcards = JSON.parse(text);
      if (!Array.isArray(flashcards) || !flashcards.every(f => typeof f === 'object' && f !== null && 'question' in f && 'answer' in f)) {
        console.error("AI returned invalid flashcards structure:", flashcards);
        throw new Error("AI returned invalid flashcards structure.");
      }
    } catch (parseAndValidateError) {
      console.error("Error parsing or validating AI response JSON:", parseAndValidateError);
      console.error("Raw AI response:", text);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to parse AI response for flashcards. Raw response logged." }),
        headers: { "Content-Type": "application/json" }
      };
    }

    const validFlashcards = flashcards.filter(card => 
      String(card.question || '').trim().length > 0 && 
      String(card.answer || '').trim().length > 0
    );

    if (validFlashcards.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI generated no valid flashcards. Please try a more detailed summary or adjust AI prompt." }),
        headers: { "Content-Type": "application/json" }
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ flashcards: validFlashcards }),
      headers: { "Content-Type": "application/json" }
    };

  } catch (error) {
    console.error("Error during flashcard generation process:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message || "Internal error in flashcards function" }),
      headers: { "Content-Type": "application/json" }
    };
  }
};