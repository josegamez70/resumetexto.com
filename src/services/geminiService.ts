import { SummaryType } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

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
  const text = response.text();
  return text.trim();
};

// ✅ NUEVA función: generar título resumido en ≤8 palabras
export const generateTitle = async (summary: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
Actúa como un redactor experto.
Genera un título breve (máximo 8 palabras) que resuma este texto:

"""
${summary}
"""

Solo devuelve el título. Sin comillas, sin introducciones.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const title = response.text();
  return title.trim();
};

// Función auxiliar para extraer texto de PDF o imagen
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
  const text = response.text();
  return text.trim();
};

const extractTextFromImage = async (file: File): Promise<string> => {
  const base64Image = await toBase64(file);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    { inlineData: { data: base64Image, mimeType: file.type } },
    "Extrae el texto visible en esta imagen. No resumas nada.",
  ]);

  const response = await result.response;
  const text = response.text();
  return text.trim();
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
