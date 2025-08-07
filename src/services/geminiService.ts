import { SummaryType, PresentationType, PresentationData } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

export const summarizeContent = async (file: File, summaryType: SummaryType): Promise<string> => {
  const content = await extractTextFromFile(file);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Resume el siguiente texto en formato ${summaryType === "bullets" ? "por puntos" : summaryType === "short" ? "corto" : "largo"}:

Texto:
"""
${content}
"""
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};

export const generateTitle = async (summary: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Genera un título breve (máximo 8 palabras) que resuma este texto:

"""
${summary}
"""

Solo devuelve el título. Sin comillas ni introducciones.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};

export const createPresentation = async (summary: string, type: PresentationType): Promise<PresentationData> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Genera una presentación estilo mapa mental a partir del siguiente resumen.

Tipo de presentación: ${type}

Resumen:
"""
${summary}
"""

Devuélvelo en formato JSON estructurado con secciones, subtítulos y contenido.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const json = response.text();

  return JSON.parse(json);
};

// ✅ NUEVO: Generar estructura para mapa mental en árbol
export const generateMindmap = async (summary: string): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Extrae los conceptos clave del siguiente texto y organízalos en un árbol jerárquico (formato JSON), donde cada nodo tiene "label" y opcionalmente "children":

"""
${summary}
"""

Formato deseado:
{
  "label": "Tema principal",
  "children": [
    {
      "label": "Concepto A",
      "children": [
        { "label": "Subconcepto A1" },
        { "label": "Subconcepto A2" }
      ]
    },
    {
      "label": "Concepto B"
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const json = response.text();

  return JSON.parse(json);
};

// Funciones de extracción
const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === "application/pdf") {
    return await extractTextFromPdf(file);
  } else if (file.type.startsWith("image/")) {
    return await extractTextFromImage(file);
  } else {
    throw new Error("Tipo de archivo no compatible");
  }
};

const extractTextFromPdf = async (file: File): Promise<string> => {
  const base64File = await toBase64(file);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    { inlineData: { data: base64File, mimeType: file.type } },
    "Extrae el texto completo de este PDF. No resumas nada.",
  ]);

  const response = await result.response;
  return response.text().trim();
};

const extractTextFromImage = async (file: File): Promise<string> => {
  const base64Image = await toBase64(file);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    { inlineData: { data: base64Image, mimeType: file.type } },
    "Extrae el texto visible en esta imagen. No resumas nada.",
  ]);

  const response = await result.response;
  return response.text().trim();
};

const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1]);
      } else {
        reject(new Error("Error al leer el archivo como base64"));
      }
    };
    reader.onerror = reject;
  });
};
