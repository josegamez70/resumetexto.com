import { GoogleGenAI } from "@google/genai"; // Eliminado 'Type'
import { SummaryType, PresentationStyle, Slide } from '../types';
import { getPrompts } from '../lib/i18n';
import type { Language } from '../context/LanguageContext';

// **¡Importante!** Asegúrate de haber ejecutado: npm install --save-dev @types/node
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const textModel = 'gemini-2.5-flash';

export async function getTextFromImage(base64Image: string, language: Language): Promise<string> {
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
        contents: { parts: [imagePart, textPart] },
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
    });

    // Manejo de 'undefined' para response.text
    if (response.text === undefined) {
        throw new Error("API did not return text content for image extraction.");
    }
    return response.text;
}

export async function generateSummary(text: string, type: SummaryType, language: Language): Promise<string> {
    const prompts = getPrompts(language);
    const prompt = prompts.summary(type, text);

    if (!prompt) {
        throw new Error('Invalid summary type');
    }

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt
    });

    // Manejo de 'undefined' para response.text
    if (response.text === undefined) {
        throw new Error("API did not return text content for summary generation.");
    }
    return response.text;
}

export async function generatePresentation(
    summary: string, 
    style: PresentationStyle, 
    language: Language
): Promise<Slide[]> {
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
    // Manejo de 'undefined' para jsonText
    if (jsonText === undefined) {
        throw new Error("API did not return JSON content for presentation generation.");
    }

    try {
        // The AI can sometimes return markdown ```json ... ```, so we extract it.
        const cleanedJson = jsonText.replace(/^```json\s*|```\s*$/g, '');
        const slides = JSON.parse(cleanedJson) as Slide[];
        return slides;
    } catch (e) {
        console.error("Failed to parse presentation JSON:", jsonText);
        throw new Error("The AI returned an invalid format for the presentation. Please try again.");
    }
}