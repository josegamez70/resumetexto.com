// netlify/functions/gemini-api.ts
// Este archivo contiene la lógica de backend para interactuar con la API de Google Gemini.
// Todas las llamadas a Gemini se hacen aquí de forma segura, usando la API Key del lado del servidor.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Handler } from '@netlify/functions';

// *** CAMBIO CRÍTICO AQUÍ: Ajustar la ruta a types.ts a '../../types' ***
// *** Y la ruta a i18n.ts a '../../lib/i18n' ***
import { SummaryType, PresentationStyle, Slide, Language } from '../../types'; 
import { getPrompts } from '../../lib/i18n'; 

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set for Netlify Function.");
}

const ai = new GoogleGenerativeAI(apiKey || 'DUMMY_API_KEY'); 
const textModel = 'gemini-2.5-flash'; 

// --- Funciones auxiliares para encapsular la lógica de tu geminiService.ts original ---

async function extractTextFromImage(base64Image: string, language: Language): Promise<string> {
    const prompts = getPrompts(language);
    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg', 
            data: base64Image,
        },
    };
    const textPart = {
        text: prompts.textExtraction,
    };

    const response = await ai.models.generateContent({
        model: textModel,
        contents: [imagePart, textPart],
    });

    return response.text;
}

async function generateTextSummary(text: string, type: SummaryType, language: Language): Promise<string> {
    const prompts = getPrompts(language);
    const prompt = prompts.summary(type, text);

    if (!prompt) {
        throw new Error('Invalid summary type or prompt not found for summary generation.');
    }

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt
    });

    return response.text;
}

async function generatePresentationSlides(summary: string, style: PresentationStyle, language: Language): Promise<Slide[]> {
    const prompts = getPrompts(language);
    const { systemInstruction, userPrompt, responseSchema } = prompts.presentation(style, summary, language);

    const response = await ai.models.generateContent({
        model: textModel,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema
        }
    });

    const jsonText = response.text;
    try {
        const cleanedJson = jsonText.replace(/^```json\s*|```\s*$/g, '');
        const slides = JSON.parse(cleanedJson) as Slide[];
        return slides;
    } catch (e) {
        console.error("Failed to parse presentation JSON:", jsonText, e);
        throw new Error("The AI returned an invalid format for the presentation. Please try again. Raw: " + jsonText);
    }
}

// --- Handler principal de la función Netlify ---
export const handler: Handler = async (event, context) => {
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server API Key is not configured. Please check Netlify environment variables.' }),
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let parsedBody;
    try {
        parsedBody = JSON.parse(event.body || '{}');
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON in request body.' }) };
    }

    const { operation, payload } = parsedBody;

    if (!operation || !payload) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing "operation" or "payload" in request body.' }) };
    }

    try {
        let result: any;
        switch (operation) {
            case 'extractTextFromImage':
                if (!payload.base64Image || !payload.language) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Missing base64Image or language for text extraction.' }) };
                }
                result = await extractTextFromImage(payload.base64Image, payload.language);
                return { statusCode: 200, body: JSON.stringify({ text: result }) };

            case 'generateSummary':
                if (!payload.text || !payload.type || !payload.language) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Missing text, type, or language for summary generation.' }) };
                }
                if (!(Object.values(SummaryType) as string[]).includes(payload.type)) {
                  return { statusCode: 400, body: JSON.stringify({ error: `Invalid summary type: ${payload.type}` }) };
                }
                result = await generateTextSummary(payload.text, payload.type, payload.language);
                return { statusCode: 200, body: JSON.stringify({ summary: result }) };

            case 'generatePresentation':
                if (!payload.summary || !payload.style || !payload.language) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Missing summary, style, or language for presentation generation.' }) };
                }
                if (!(Object.values(PresentationStyle) as string[]).includes(payload.style)) {
                  return { statusCode: 400, body: JSON.stringify({ error: `Invalid presentation style: ${payload.style}` }) };
                }
                result = await generatePresentationSlides(payload.summary, payload.style, payload.language);
                return { statusCode: 200, body: JSON.stringify({ slides: result }) };

            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Unknown operation specified.' }) };
        }
    } catch (error) {
        console.error('Error in gemini-api function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error processing Gemini request.', details: (error as Error).message }),
        };
    }
};