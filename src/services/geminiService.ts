import { GoogleGenerativeAI } from "@google/generative-ai";
import { SummaryType } from "../types";

// ✅ Usa process.env para CRA (NO import.meta.env)
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_API_KEY!);

// 🧠 Resume contenido desde archivo
export const summarizeContent = async (
  file: File,
  summaryType: SummaryType
): Promise<string> => {
  const content = await extractTextFromFile(file);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt =
    summaryType === "presentation"
      ? `Resume el siguiente contenido en formato de presentación en HTML. No pongas <html> ni <body>. Usa títulos y puntos clave:\n\n${content}`
      : `Haz un resumen breve del siguiente texto:\n\n${content}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

// 🧠 Genera mapa mental desde texto
export const generateMindmap = async (summary: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
A partir del siguiente resumen, crea un mapa mental en formato HTML como árbol interactivo (estilo lista desplegable), donde cada concepto se expanda hacia la derecha. Usa listas <ul><li> y <details><summary> si es útil:

Resumen:
${summary}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};

// 🧠 Genera título breve (máximo 8 palabras)
export const generateSummaryTitle = async (summary: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Resume el siguiente contenido en un título de máximo 8 palabras:\n\n${summary}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().replace(/[".]/g, "").trim();
};

// ✅ Extraer texto de PDF, TXT o imagen (OCR)
const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;

  // PDF
  if (fileType === "application/pdf") {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.entry");
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.default;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const textPromises: Promise<string>[] = [];
    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      textPromises.push(Promise.resolve(text));
    }

    const allText = await Promise.all(textPromises);
    return allText.join("\n");
  }

  // TXT
  if (fileType === "text/plain") {
    return await file.text();
  }

  // Imagen (OCR)
  if (fileType.startsWith("image/")) {
    const base64 = await toBase64(file);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: fileType } },
      {
        text: "Extrae el texto visible de esta imagen. No inventes texto. Devuelve solo el texto sin formatear.",
      },
    ]);

    const response = await result.response;
    return response.text();
  }

  throw new Error("Formato de archivo no soportado.");
};

// 🔧 Helper para convertir a base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1]);
      } else {
        reject(new Error("Error al leer el archivo."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
