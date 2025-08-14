// src/services/geminiService.ts
import * as pdfjsLib from "pdfjs-dist";
import {
  SummaryType,
  PresentationType,
  PresentationData,
  MindMapData,
} from "../types";

// Configurar worker de pdf.js desde CDN
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* -----------------------------------------
 * Helpers
 * ----------------------------------------- */

// Convierte File a base64 (solo para enviar imágenes al backend de OCR)
async function fileToBase64(file: File): Promise<string> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      if (!res) return reject(new Error("No se pudo leer el archivo."));
      resolve(res.split(",")[1]); // quitar el prefijo data:
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return base64;
}

// Extrae texto de un PDF en el cliente
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      // @ts-ignore - pdf.js typings parciales
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

// Pide OCR al backend para imágenes (usa Gemini en serverless)
// Si tu función se llama distinto, cambia la URL aquí:
async function ocrImageOnServer(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const response = await fetch("/.netlify/functions/gemini-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
  });

  const raw = await response.text();
  if (!raw) throw new Error("Respuesta vacía del servidor en OCR.");
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta no es JSON válido en OCR.");
  }
  if (!response.ok) throw new Error(data.error || "Error en OCR (gemini-api).");
  if (!data.text) throw new Error("OCR no devolvió texto.");
  return String(data.text);
}

// Extrae texto de cualquier File (PDF o imagen)
export async function extractTextFromFile(file: File): Promise<string> {
  const type = (file.type || "").toLowerCase();
  if (type.includes("pdf")) {
    return await extractTextFromPDF(file);
  }
  if (type.startsWith("image/")) {
    return await ocrImageOnServer(file);
  }
  throw new Error("Formato no soportado. Sube un PDF o una imagen.");
}

/* -----------------------------------------
 * API de alto nivel usada por App.tsx
 * ----------------------------------------- */

// 1) Resumir contenido
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<{ summary: string; title: string }> {
  const text = await extractTextFromFile(file);

  const response = await fetch("/.netlify/functions/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, summaryType }),
  });

  const raw = await response.text();
  if (!raw) throw new Error("Respuesta vacía del servidor al resumir.");
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta no es JSON válido al resumir.");
  }
  if (!response.ok) throw new Error(data.error || "Error al resumir.");
  return { summary: String(data.summary), title: String(data.title) };
}

// 2) Crear presentación (desplegables/subdesplegables)
export async function createPresentation(
  file: File,
  presentationType: PresentationType
): Promise<PresentationData> {
  const text = await extractTextFromFile(file);

  const response = await fetch("/.netlify/functions/presentation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, presentationType }),
  });

  const raw = await response.text();
  if (!raw)
    throw new Error("Respuesta vacía del servidor al generar presentación.");
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta no es JSON válido al generar presentación.");
  }
  if (!response.ok)
    throw new Error(data.error || "Error al generar presentación.");
  return data.presentationData as PresentationData;
}

// 3) NUEVO: Generar Mapa Mental a partir de texto
export async function createMindMapFromText(text: string): Promise<MindMapData> {
  const response = await fetch("/.netlify/functions/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const raw = await response.text();
  if (!raw) throw new Error("Respuesta vacía del servidor en mindmap.");
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta no es JSON válido en mindmap.");
  }
  if (!response.ok) throw new Error(data.error || "Error al generar mapa mental.");
  return data.mindmap as MindMapData;
}

// 4) Utilidad: convertir la presentación en texto lineal (para mapa mental)
export function flattenPresentationToText(p: PresentationData): string {
  const lines: string[] = [p.title];
  const walk = (s: any, depth = 0) => {
    const prefix = "  ".repeat(depth);
    lines.push(`${prefix}${s.emoji ? s.emoji + " " : ""}${s.title}`);
    if (s.content) lines.push(`${prefix}${s.content}`);
    (s.subsections || []).forEach((ss: any) => walk(ss, depth + 1));
  };
  p.sections.forEach((sec) => walk(sec, 0));
  return lines.join("\n");
}
