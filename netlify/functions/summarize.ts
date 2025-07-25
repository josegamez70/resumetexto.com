// netlify/functions/summarize.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const apiKey = process.env.GEMINI_API_KEY; 
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API Key for Gemini is not configured in Netlify environment variables.' }),
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { textToSummarize } = JSON.parse(event.body || '{}');

    if (!textToSummarize || typeof textToSummarize !== 'string') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid textToSummarize in request body.' }),
      };
    }

    // El prompt que se envía a Gemini con el texto extraído del PDF
    const prompt = `Resume el siguiente texto de manera concisa y clara:\n\n${textToSummarize}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to summarize text.', details: (error as Error).message }),
    };
  }
};