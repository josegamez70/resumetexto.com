import { SummaryType, PresentationType, PresentationData } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

// ✅ Función principal para generar el resumen del archivo
export const summarizeContent = async (file: File, summaryType: SummaryType): Promise<string> => {
  const content = await extractTextFromFile(file);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Actúa como un experto en comprensión lectora y redacción.
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

// ✅ NUEVA función para generar un título resumen (máx. 8 palabras)
export const generateTitle = async (summary: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Actúa como un redactor experto.
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

// ✅ Función para generar una presentación a partir del resumen
export const createPresentation = async (summary: string, type: PresentationType): Promise<PresentationData> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Actúa como un experto en educación y mapas mentales.
Genera una estructura jerárquica en formato JSON con título, secciones y subsecciones, basada en este resumen:

Tipo de presentación: ${type}

Resumen:
"""
${summary}
"""

Devuélvelo en este formato exacto:
{
  "title": "Título del mapa mental",
  "sections": [
    {
      "emoji": "🧠",
      "title": "Sección principal",
      "content": "Texto explicativo de esta sección.",
      "subsections": [
        {
          "emoji": "🔹",
          "title": "Subsección",
          "content": "Texto explicativo.",
          "subsections": []
        }
      ]
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const json = response.text();

  return JSON.parse(json); // asegúrate de que la IA devuelve JSON válido
};

// ✅ Función para extraer texto (PDF o imagen)
const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === "application/pdf") {
    return await extractTextFromPdf(file);
  } else if (file.type.startsWith("image/")) {
    return await extractTextFromImage(file);
  } else {
    throw new Error("Tipo de archivo no compatible");
  }
};

// PDF
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

// Imagen
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

// Base64
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
