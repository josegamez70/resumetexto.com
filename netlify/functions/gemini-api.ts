// netlify/functions/gemini-api.ts
// Este archivo contiene la lógica de backend para interactuar con la API de Google Gemini.
// Todas las llamadas a Gemini se hacen aquí de forma segura, usando la API Key del lado del servidor.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Handler } from '@netlify/functions';

// Asegúrate de que las rutas a tus tipos y prompts son correctas desde esta ubicación
// netlify/functions/gemini-api.ts -> TU_PROYECTO_RAIZ/types.ts (necesita ../../types)
// netlify/functions/gemini-api.ts -> TU_PROYECTO_RAIZ/lib/i18n.ts (necesita ../../lib/i18n)
import { SummaryType, PresentationStyle, Slide, Language } from '../../types'; // Ajusta la ruta si es necesario
import { getPrompts } from '../../lib/i18n'; // Ajusta la ruta si es necesario

const apiKey = process.env.GEMINI_API_KEY;

// Instancia global de GoogleGenerativeAI y del modelo
// Se inicializarán una vez cuando la función se "caliente" (cold start)
let aiInstance: GoogleGenerativeAI | undefined;
let generativeModel: any | undefined; // Usamos 'any' para flexibilidad con el tipo de modelo

// Función auxiliar para obtener el modelo, asegurando que se inicializa solo una vez
function getGeminiModel() {
    if (!apiKey) { // Si por alguna razón la API Key no está, lanzamos un error claro
        throw new Error('GEMINI_API_KEY environment variable is not set for Netlify Function.');
    }
    if (!aiInstance) { // Si la instancia de la IA no existe, la creamos
        aiInstance = new GoogleGenerativeAI(apiKey);
    }
    if (!generativeModel) { // Si el modelo específico no existe, lo obtenemos
        // Aquí especificamos el modelo que usas ('gemini-2.5-flash')
        generativeModel = aiInstance.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
    return generativeModel; // Retornamos la instancia del modelo
}

// --- Funciones auxiliares para encapsular la lógica de tu geminiService.ts original ---

async function extractTextFromImage(base64Image: string, language: Language): Promise<string> {
    const model = getGeminiModel(); // Obtiene la instancia del modelo ya inicializada
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

    // ¡CAMBIO CLAVE AQUÍ! Llamamos a generateContent directamente en la instancia del modelo
    const response = await model.generateContent({ 
        contents: [imagePart, textPart],
    });

    return response.text;
}

async function generateTextSummary(text: string, type: SummaryType, language: Language): Promise<string> {
    const model = getGeminiModel(); // Obtiene la instancia del modelo
    const prompts = getPrompts(language);
    const prompt = prompts.summary(type, text);

    if (!prompt) {
        throw new Error('Invalid summary type or prompt not found for summary generation.');
    }

    // ¡CAMBIO CLAVE AQUÍ! Llamamos a generateContent directamente en la instancia del modelo
    const response = await model.generateContent({ 
        contents: prompt // prompt es una cadena de texto, lo cual es válido para 'contents'
    });

    return response.text;
}

async function generatePresentationSlides(summary: string, style: PresentationStyle, language: Language): Promise<Slide[]> {
    const model = getGeminiModel(); // Obtiene la instancia del modelo
    const prompts = getPrompts(language);
    const { systemInstruction, userPrompt, responseSchema } = prompts.presentation(style, summary, language);

    // ¡CAMBIO CLAVE AQUÍ! Llamamos a generateContent directamente en la instancia del modelo
    const response = await model.generateContent({ 
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
    try {
        // Aseguramos que el modelo esté inicializado (y que la API Key exista) antes de cualquier operación
        getGeminiModel(); 

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
        // Manejo de errores más específico
        if ((error as Error).message.includes('API Key is not set')) {
             return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server API Key is not configured for Gemini. Check Netlify environment variables.', details: (error as Error).message }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error processing Gemini request.', details: (error as Error).message }),
        };
    }
};