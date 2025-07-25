// lib/i18n.ts
// Este archivo contiene los prompts para la IA y las traducciones de texto de la UI.

// *** CAMBIO CRÍTICO AQUÍ: Ajustar la ruta a types.ts a '../types' ***
import { SummaryType, PresentationStyle, Language, Slide } from '../types'; 

interface Prompts {
  textExtraction: string;
  summary: (type: SummaryType, text: string) => string | null;
  presentation: (style: PresentationStyle, summary: string, language: Language) => {
    systemInstruction: string;
    userPrompt: string;
    responseSchema: any;
  };
  ui: {
    generateContentBtn: string;
    summaryShortLabel: string;
    summaryDetailedLabel: string; 
    summaryPointsLabel: string;   
    presentationExtensiveLabel: string;
    presentationInformativeLabel: string;
    presentationForKidsLabel: string;
    uploadFilePlaceholder: string;
    dragAndDropHint: string;
    pdfOrImageHint: string;
    selectedFilePrefix: string;
    contentGeneratedTitle: string;
    downloadHtmlBtn: string;
    processingMessage: string;
    selectFileError: string;
    fileTypeError: string;
    pdfJsNotAvailable: string;
    pdfJsLoadError: string;
    ocrMissingText: string;
    invalidOption: string;
    apiCallFailed: string;
    invalidSlidesFormat: string;
    downloadNoContent: string;
  };
}

const prompts_es: Prompts = {
  textExtraction: "Extrae todo el texto visible de esta imagen. No incluyas comentarios ni explicaciones adicionales, solo el texto puro.",
  summary: (type, text) => {
    switch (type) {
      case SummaryType.Short: return `Resume este texto en 3-5 oraciones, de forma concisa y directa. Resumen: ${text}`;
      case SummaryType.Long: return `Genera un resumen detallado y exhaustivo de este texto, cubriendo todos los puntos importantes en 10-15 oraciones. Resumen: ${text}`;
      case SummaryType.Bullets: return `Extrae los 5 a 10 puntos clave o ideas principales de este texto y preséntalos como una lista numerada o con viñetas. Puntos clave: ${text}`;
      default: return null;
    }
  },
  presentation: (style, summary) => {
    const responseSchema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          emoji: { type: "STRING", description: "Un emoji relevante para el título." },
          sections: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                heading: { type: "STRING" },
                content: { type: "STRING" }
              }
            }
          }
        },
        required: ["title", "sections"]
      }
    };

    const baseUserPrompt = `A partir del siguiente contenido: "${summary}". Genera un array de objetos JSON, donde cada objeto representa una diapositiva (slide). Cada slide debe tener un 'title' (título de la diapositiva) y un 'emoji' relevante para el título. Dentro de cada slide, debe haber un array 'sections', donde cada sección tiene un 'heading' (encabezado de sección) y 'content' (contenido de la sección). Asegúrate de que la salida sea un JSON válido y esté envuelta en un bloque de código markdown JSON si es necesario.`;

    let systemInstruction = '';
    let userPrompt = '';

    switch (style) {
      case PresentationStyle.Extensive:
        systemInstruction = `Eres un experto en la creación de presentaciones detalladas y exhaustivas. Genera un contenido rico en información, con múltiples secciones por diapositiva si es necesario, proporcionando explicaciones completas para cada punto. Asegúrate de que las secciones son lo suficientemente largas para ser extensas.`;
        userPrompt = `${baseUserPrompt} Para cada sección, proporciona un 'heading' y un 'content' que sea un párrafo detallado y completo. La presentación debe ser extensa y cubrir el tema a fondo.`;
        break;
      case PresentationStyle.Informative:
        systemInstruction = `Eres un presentador conciso y experto en transmitir información clave de forma directa. Genera diapositivas informativas, destacando los puntos más importantes de forma clara y directa.`;
        userPrompt = `${baseUserPrompt} Para cada sección, proporciona un 'heading' y un 'content' que sea un párrafo más corto y enfocado en los puntos esenciales. La presentación debe ser concisa pero informativa.`;
        break;
      case PresentationStyle.ForKids:
        systemInstruction = `Eres un narrador para niños, especializado en hacer temas complejos fáciles de entender y divertidos. Genera diapositivas con lenguaje muy simple, claro, frases cortas y muchos emojis integrados directamente en el texto del contenido para hacerlo visualmente atractivo y fácil de seguir para los niños.`;
        userPrompt = `${baseUserPrompt} Usa un lenguaje muy simple y amigable para niños. Cada sección debe ser un párrafo corto y entretenido con muchos emojis. Explica los conceptos de forma que un niño de 8-10 años pueda entender.`;
        break;
      default:
        throw new Error('Estilo de presentación no válido.');
    }
    return { systemInstruction, userPrompt, responseSchema };
  },
  ui: {
    generateContentBtn: "Generar Contenido",
    summaryShortLabel: "Resumen Corto",
    summaryDetailedLabel: "Resumen Detallado",
    summaryPointsLabel: "Puntos Clave",
    presentationExtensiveLabel: "Presentación Extensa",
    presentationInformativeLabel: "Presentación Info",
    presentationForKidsLabel: "Presentación Niños",
    uploadFilePlaceholder: "Haz clic para subir un archivo o arrástralo aquí",
    dragAndDropHint: "Sube un PDF o una Imagen (JPEG, PNG)",
    pdfOrImageHint: "Sube un PDF o una Imagen (JPEG, PNG)",
    selectedFilePrefix: "Archivo seleccionado:",
    contentGeneratedTitle: "Contenido Generado:",
    downloadHtmlBtn: "Descargar Presentación HTML",
    processingMessage: "Procesando el documento...",
    selectFileError: "Por favor, selecciona un archivo (PDF o Imagen) primero.",
    fileTypeError: "Tipo de archivo no soportado. Por favor, sube un PDF o una imagen (JPEG, PNG).",
    pdfJsNotAvailable: "El procesamiento de PDF requiere un entorno de navegador. Por favor, intente después de que la aplicación se cargue completamente.",
    pdfJsLoadError: "La librería PDF.js no se pudo cargar o inicializar correctamente.",
    ocrMissingText: "No se pudo extraer texto de la imagen. Asegúrate de que contiene texto claro.",
    invalidOption: "Opción de contenido no válida seleccionada.",
    apiCallFailed: "Falló la llamada a la función de IA.",
    invalidSlidesFormat: "La IA no devolvió un formato de slides válido para la presentación.",
    downloadNoContent: "No hay contenido HTML para descargar.",
  }
};

const prompts_en: Prompts = {
  textExtraction: "Extract all visible text from this image. Do not include comments or additional explanations, just the pure text.",
  summary: (type, text) => {
    switch (type) {
      case SummaryType.Short: return `Summarize this text in 3-5 sentences, concisely and directly. Summary: ${text}`;
      case SummaryType.Long: return `Generate a detailed and comprehensive summary of this text, covering all important points in 10-15 sentences. Summary: ${text}`;
      case SummaryType.Bullets: return `Extract 5-10 key points or main ideas from this text and present them as a numbered or bulleted list. Key points: ${text}`;
      default: return null;
    }
  },
  presentation: (style, summary) => {
    const responseSchema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          emoji: { type: "STRING", description: "A relevant emoji for the title." },
          sections: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                heading: { type: "STRING" },
                content: { type: "STRING" }
              }
            }
          }
        },
        required: ["title", "sections"]
      }
    };
    
    const baseUserPrompt = `From the following content: "${summary}". Generate an array of JSON objects, where each object represents a slide. Each slide should have a 'title' (slide title) and a relevant 'emoji' for the title. Inside each slide, there should be a 'sections' array, where each section has a 'heading' (section heading) and 'content' (section content). Ensure the output is valid JSON and is wrapped in a JSON markdown code block if necessary.`;

    let systemInstruction = '';
    let userPrompt = '';

    switch (style) {
      case PresentationStyle.Extensive:
        systemInstruction = `You are an expert in creating detailed and comprehensive presentations. Generate rich content, with multiple sections per slide if necessary, providing full explanations for each point. Ensure sections are long enough to be extensive.`;
        userPrompt = `${baseUserPrompt} For each section, provide a 'heading' and 'content' that is a detailed and complete paragraph. The presentation should be extensive and cover the topic thoroughly.`;
        break;
      case PresentationStyle.Informative:
        systemInstruction = `You are a concise and expert presenter in conveying key information directly. Generate informative slides, highlighting the most important points clearly and directly.`;
        userPrompt = `${baseUserPrompt} For each section, provide a 'heading' and shorter 'content', focusing on essential points. The presentation should be concise but informative.`;
        break;
      case PresentationStyle.ForKids:
        systemInstruction = `You are a storyteller for children, specialized in making complex topics easy to understand and fun. Generate simple and fun slides with easy-to-understand language, short sentences, and many emojis integrated directly into the content text to make it visually appealing and easy for children to follow.`;
        userPrompt = `${baseUserPrompt} Use very simple and child-friendly language. Each section should be a short, entertaining paragraph with many emojis. Explain concepts in a way an 8-10 year old can understand.`;
        break;
      default:
        throw new Error('Invalid presentation style.');
    }
    return { systemInstruction, userPrompt, responseSchema };
  },
  ui: {
    generateContentBtn: "Generate Content",
    summaryShortLabel: "Short Summary",
    summaryDetailedLabel: "Detailed Summary",
    summaryPointsLabel: "Key Points",
    presentationExtensiveLabel: "Extensive Presentation",
    presentationInformativeLabel: "Informative Presentation",
    presentationForKidsLabel: "Kids Presentation",
    uploadFilePlaceholder: "Click to upload file or drag & drop here",
    dragAndDropHint: "Upload a PDF or an Image (JPEG, PNG)",
    pdfOrImageHint: "Upload a PDF or an Image (JPEG, PNG)",
    selectedFilePrefix: "Selected file:",
    contentGeneratedTitle: "Generated Content:",
    downloadHtmlBtn: "Download HTML Presentation",
    processingMessage: "Processing document...",
    selectFileError: "Please select a file (PDF or Image) first.",
    fileTypeError: "Unsupported file type. Please upload a PDF or an image.",
    pdfJsNotAvailable: "PDF processing requires a browser environment. Please try after the app loads fully.",
    pdfJsLoadError: "PDF.js library could not be loaded or initialized correctly.",
    ocrMissingText: "Could not extract text from the image. Ensure it contains clear text.",
    invalidOption: "Invalid content option selected.",
    apiCallFailed: "AI function call failed.",
    invalidSlidesFormat: "AI did not return a valid slides format for the presentation.",
    downloadNoContent: "No HTML content to download.",
  }
};


export function getPrompts(language: string): Prompts {
  if (language === 'en') {
    return prompts_en;
  }
  return prompts_es; // Default to Spanish
}