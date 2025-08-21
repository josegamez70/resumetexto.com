// netlify/functions/flashcards.js
// Usar require() para GoogleGenerativeAI es más consistente con tus otras funciones de Netlify
const { GoogleGenerativeAI } = require("@google/generative-ai");

// NOTA: No declaramos apiKey aquí. Se obtendrá DENTRO del handler.

// La función handler para Netlify Functions
exports.handler = async (event, context) => {
  // --- AHORA OBTENEMOS LA CLAVE AQUÍ, DENTRO DEL CONTEXTO DE LA FUNCIÓN ---
  const apiKey = process.env.GOOGLE_AI_API_KEY; // ¡Una sola 'G' ahora!

  console.log('Flashcards function started.');
  if (apiKey) {
    console.log('API Key successfully loaded (length:', apiKey.length, ', starts with:', apiKey.substring(0, 5), '...).');
  } else {
    // Este error indica que la variable de entorno NO está configurada en Netlify.
    // Si estás viendo esto, tienes que ir a Netlify Site Settings -> Environment Variables.
    console.error('CRITICAL ERROR: API Key is NOT available in environment variable GOOGGLE_AI_API_KEY.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Configuration Error: API Key is missing for flashcards function." }),
      headers: { "Content-Type": "application/json" }
    };
  }
  // --- FIN LOG Y VERIFICACIÓN ---

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

  // --- Inicialización del modelo, ahora dentro del handler ---
  let genAIInstance;
  try {
    genAIInstance = new GoogleGenerativeAI(apiKey); // Usar la clave obtenida dentro del handler
  } catch (initError) {
    console.error("Error initializing GoogleGenerativeAI instance:", initError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to initialize AI model instance. Check API Key validity and Google Cloud project setup." }),
      headers: { "Content-Type": "application/json" }
    };
  }

  const model = genAIInstance.getGenerativeModel({ model: "gemini-1.5-pro" }); // Usando el modelo que ya funciona


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
      body: JSON.stringify({ error: error?.message || "Error interno en flashcards function" }),
      headers: { "Content-Type": "application/json" }
    };
  }
};