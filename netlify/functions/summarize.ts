// netlify/functions/summarize.ts
// Importa las librerías necesarias
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Handler } from '@netlify/functions'; // Tipo de handler para Netlify Functions

// Exporta el handler, que es la función principal de la función Netlify
export const handler: Handler = async (event, context) => {
  // Obtiene la API Key de las variables de entorno de Netlify.
  // ¡El nombre 'GEMINI_API_KEY' debe coincidir con el configurado en Netlify!
  const apiKey = process.env.GEMINI_API_KEY; 

  // Si la API Key no está configurada, devuelve un error 500
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API Key for Gemini is not configured in Netlify environment variables.' }),
    };
  }

  // Inicializa el modelo de Gemini con la API Key segura
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Solo acepta solicitudes POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parsea el cuerpo de la solicitud (que debería contener el texto a resumir)
    const { textToSummarize } = JSON.parse(event.body || '{}');

    // Valida que el texto para resumir esté presente
    if (!textToSummarize) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing textToSummarize in request body.' }),
      };
    }

    // Construye el prompt para Gemini
    const prompt = `Resume el siguiente texto de manera concisa:\n\n${textToSummarize}`;
    
    // Llama a la API de Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text(); // Extrae el texto del resumen

    // Devuelve el resumen con un estado 200 (OK)
    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (error) {
    // Captura y registra cualquier error durante el proceso y devuelve un error 500
    console.error('Error calling Gemini API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to summarize text.', details: (error as Error).message }),
    };
  }
};