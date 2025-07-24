
import { SummaryType, PresentationStyle } from '../types';
import type { Language } from '../context/LanguageContext';
import { Type } from "@google/genai";

const en = {
    // Header
    headerTitle: 'Summarize it!',
    headerSubtitle: 'Your AI-powered document assistant',
    poweredBy: 'Powered by Gemini',

    // Language Switcher
    switchToSpanish: 'Cambiar a español',
    switchToEnglish: 'Switch to English',

    // File Upload
    uploadTitle: '1. Upload Document',
    uploadPrompt: 'Click to upload',
    uploadDragDrop: 'or drag and drop',
    uploadFileType: 'PDF or Image (PNG, JPG)',

    // Summary Controls
    summaryTitle: '2. Choose Summary Style',
    summaryTypeShort: 'Short',
    summaryTypeLong: 'Long',
    summaryTypeBullets: 'Bullets',
    generateSummaryBtn: 'Generate Summary',

    // Summary Output
    outputTitle: '3. View Result',
    generatedSummaryTitle: 'Generated Summary',
    saveBtn: 'Save',
    outputPlaceholder: 'Your summary will appear here. Start by uploading a file.',
    outputReady: 'File processed successfully. Ready to summarize.',

    // Presentation Generator
    presentationTitle: '4. Create Presentation',
    styleExtensive: 'Extensive',
    styleInformative: 'Informative',
    styleForKids: 'For Kids',
    generatePresentationBtn: 'Generate Presentation',

    // Saved Summaries
    savedSummariesTitle: 'Saved Summaries',
    loadSummaryAction: 'Load Summary',
    deleteSummaryAction: 'Delete Summary',

    // Presentation Modal
    modalTitle: 'Presentation Preview',
    exportHtmlBtn: 'Export HTML',
    exportFileName: 'Presentation',
    presentationTitleExport: 'Presentation',
    document: 'document',

    // App Status Messages
    loadingProcessFile: 'Processing file...',
    loadingExtractText: 'Extracting text from image...',
    loadingSummary: 'Generating summary...',
    loadingPresentation: 'Generating presentation...',
    loadingPresentationExtensive: 'Generating extensive presentation... This may take a few minutes.',
    errorFileProcess: (message: string) => `File processing failed: ${message}`,
    errorSummarization: (message: string) => `Summarization failed: ${message}`,
    errorPresentation: (message: string) => `Presentation generation failed: ${message}`,
    errorNoText: 'No text to summarize. Please upload a file first.',
    errorNoSummary: 'No summary available to generate a presentation. Please create a summary first.',
    errorUnknown: 'An unknown error occurred.',
    errorInvalidAIResponse: 'The AI returned an invalid format. Please try again.',
};

const es = {
    // Header
    headerTitle: 'Resúmelo!',
    headerSubtitle: 'Tu asistente de documentos con IA',
    poweredBy: 'Con la tecnología de Gemini',

    // Language Switcher
    switchToSpanish: 'Cambiar a español',
    switchToEnglish: 'Switch to English',

    // File Upload
    uploadTitle: '1. Sube tu Documento',
    uploadPrompt: 'Haz clic para subir',
    uploadDragDrop: 'o arrastra y suelta',
    uploadFileType: 'PDF o Imagen (PNG, JPG)',

    // Summary Controls
    summaryTitle: '2. Elige el Estilo de Resumen',
    summaryTypeShort: 'Corto',
    summaryTypeLong: 'Largo',
    summaryTypeBullets: 'Puntos',
    generateSummaryBtn: 'Generar Resumen',

    // Summary Output
    outputTitle: '3. Visualiza el Resultado',
    generatedSummaryTitle: 'Resumen Generado',
    saveBtn: 'Guardar',
    outputPlaceholder: 'Tu resumen aparecerá aquí. Empieza subiendo un archivo.',
    outputReady: 'Archivo procesado con éxito. Listo para resumir.',

    // Presentation Generator
    presentationTitle: '4. Crea una Presentación',
    styleExtensive: 'Extensa',
    styleInformative: 'Informativa',
    styleForKids: 'Para Niños',
    generatePresentationBtn: 'Generar Presentación',

    // Saved Summaries
    savedSummariesTitle: 'Resúmenes Guardados',
    loadSummaryAction: 'Cargar Resumen',
    deleteSummaryAction: 'Eliminar Resumen',

    // Presentation Modal
    modalTitle: 'Vista Previa de la Presentación',
    exportHtmlBtn: 'Exportar HTML',
    exportFileName: 'Resumen',
    presentationTitleExport: 'Presentación',
    document: 'documento',

    // App Status Messages
    loadingProcessFile: 'Procesando archivo...',
    loadingExtractText: 'Extrayendo texto de la imagen...',
    loadingSummary: 'Generando resumen...',
    loadingPresentation: 'Generando presentación...',
    loadingPresentationExtensive: 'Generando presentación extensa... Esto puede tardar unos minutos.',
    errorFileProcess: (message: string) => `Error al procesar el archivo: ${message}`,
    errorSummarization: (message: string) => `Error en la sumarización: ${message}`,
    errorPresentation: (message: string) => `Error en la generación de la presentación: ${message}`,
    errorNoText: 'No hay texto que resumir. Por favor, sube un archivo primero.',
    errorNoSummary: 'No hay resumen disponible para generar una presentación. Crea un resumen primero.',
    errorUnknown: 'Ocurrió un error desconocido.',
    errorInvalidAIResponse: 'La IA devolvió un formato no válido. Por favor, inténtalo de nuevo.',
};

export const translations = { en, es };

export type Translation = typeof en;

export const getPrompts = (lang: Language) => ({
    textExtraction: lang === 'es'
        ? 'Extrae todo el texto de esta imagen. Devuelve solo el texto en bruto, sin ningún formato ni comentario adicional.'
        : 'Extract all text from this image. Output only the raw text, without any formatting or additional comments.',
    summary: (type: SummaryType, text: string) => {
        switch (type) {
            case SummaryType.Short:
                return lang === 'es'
                    ? `Genera un resumen conciso de un párrafo del siguiente texto:\n\n---\n\n${text}`
                    : `Generate a concise, one-paragraph summary of the following text:\n\n---\n\n${text}`;
            case SummaryType.Long:
                return lang === 'es'
                    ? `Genera un resumen detallado y completo del siguiente texto, capturando todos los puntos clave y matices:\n\n---\n\n${text}`
                    : `Generate a detailed and comprehensive summary of the following text, capturing all key points and nuances:\n\n---\n\n${text}`;
            case SummaryType.Bullets:
                return lang === 'es'
                    ? `Resume el siguiente texto en una lista de puntos clave. Cada punto debe ser claro y conciso. Empieza cada punto con un guion (-).\n\n---\n\n${text}`
                    : `Summarize the following text into a list of key bullet points. Each point should be clear and concise. Start each bullet point with a hyphen (-).\n\n---\n\n${text}`;
            default:
                return '';
        }
    },
    presentation: (style: PresentationStyle, summary: string, language: Language) => {
        const systemInstructions = {
            [PresentationStyle.Extensive]: language === 'es' ? "Eres un asistente de IA que crea presentaciones excepcionalmente detalladas y extensas con múltiples secciones interactivas por diapositiva. Incorpora emojis relevantes para mejorar el atractivo visual. Deben ser aproximadamente el doble de largas que una presentación estándar. Céntrate en proporcionar una visión integral y exhaustiva." : "You are an AI assistant creating exceptionally detailed and extensive presentations with multiple interactive sections per slide. Incorporate relevant emojis to enhance visual appeal. They should be roughly twice as long as a standard presentation. Focus on providing a comprehensive, exhaustive overview.",
            [PresentationStyle.Informative]: language === 'es' ? "Eres un asistente de IA que crea presentaciones detalladas y educativas con múltiples secciones interactivas por diapositiva. Incorpora emojis relevantes para mejorar el atractivo visual. Tu objetivo es explicar los temas de forma clara y exhaustiva." : "You are an AI assistant creating detailed and educational presentations with multiple interactive sections per slide. Incorporate relevant emojis to enhance visual appeal. Your goal is to explain topics clearly and thoroughly.",
            [PresentationStyle.ForKids]: language === 'es' ? "Eres un asistente de IA que crea presentaciones divertidas, sencillas y atractivas para niños. Usa un lenguaje sencillo, emojis relevantes (como 🥳 o 🚀) en todos los textos y múltiples secciones interactivas y breves por diapositiva. ¡Hazlo muy visual y divertido!" : "You are an AI assistant creating fun, simple, and engaging presentations for children. Use simple language, relevant emojis (like 🥳 or 🚀) in all text, and multiple short, interactive sections per slide. Make it very visual and fun!",
        };

        const langClause = language === 'es' ? 'español' : 'English';
        
        const lengthInstruction = style === PresentationStyle.Extensive
            ? (language === 'es' ? 'INSTRUCCIÓN ESPECIAL: Esta presentación debe ser EXTENSA, aproximadamente el doble de larga que una estándar. Genera significativamente más diapositivas y contenido más profundo. ' : 'SPECIAL INSTRUCTION: This presentation must be EXTENSIVE, roughly double the length of a standard one. Generate significantly more slides and deeper content. ')
            : '';

        let userPrompt = `Based on the provided summary, generate a set of slides for an INTERACTIVE presentation.
Return the result as a JSON array of objects. Each object must have "title" and "interactiveContent".
- "title": A short, catchy title for the slide.
- "interactiveContent": An array of objects, each with "summary" (a short, visible sentence) and "details" (a longer explanation revealed on click). Generate multiple interactive items per slide.
All text values MUST be in ${langClause}.
IMPORTANT: Include relevant emojis in "title", "summary", and "details" to make the content more engaging.`;
        
        userPrompt += `\n\n${lengthInstruction}Style: ${style}\nSummary:\n${summary}`;
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Slide title with emojis" },
                    interactiveContent: {
                        type: Type.ARRAY,
                        description: "Array of content for interactive accordions",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                summary: { type: Type.STRING, description: "The visible summary text with emojis" },
                                details: { type: Type.STRING, description: "The hidden detailed text with emojis" }
                            },
                            required: ['summary', 'details']
                        }
                    },
                },
                required: ["title", "interactiveContent"],
            }
        };

        return {
            systemInstruction: systemInstructions[style],
            userPrompt,
            responseSchema,
        }
    },
});
