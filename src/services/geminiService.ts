// services/geminiService.ts

import * as pdfjsLib from "pdfjs-dist";
import {
  SummaryType,
  PresentationType,
  PresentationData,
  MindMapData,
  Flashcard, // ¡Importa el nuevo tipo Flashcard!
  PresentationSection, // <-- ¡Importa tu tipo PresentationSection!
} from "../types";

// Worker de PDF.js desde CDN
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version}/pdf.worker.min.js`;

// -------- Utilidad: extraer texto de PDF --------
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = (content.items as any[])
      .map((it: any) => ("str" in it ? it.str : ""))
      .filter(Boolean);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

// -------- Utilidad: file → base64 (seguro en chunks) --------
async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

// -------- 1) Resumir contenido (soporta PDF + imágenes) --------
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<string> {
  const isPDF = /pdf/i.test(file.type) || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");

  // 1) PDFs con texto: intento normal
  if (isPDF) {
    try {
      const text = await extractTextFromPDF(file);
      if (text && text.replace(/\s+/g, " ").length > 80) {
        const resp = await fetch("/api/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, summaryType }),
        });
        const raw = await resp.text();
        const data = raw ? JSON.parse(raw) : {};
        if (!resp.ok) throw new Error(data.error || "Error al resumir PDF con texto.");
        return String(data.summary || "");
      }
      // Si no hay texto útil → caer a visión
    } catch {
      // caer a visión
    }
  }

  // 2) Imágenes y PDFs sin texto: enviar archivo a visión
  if (isImage || isPDF) {
    const base64 = await fileToBase64(file);
    const resp = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summaryType,
        file: { name: file.name, mimeType: file.type || (isPDF ? "application/pdf" : "application/octet-stream"), base64 },
      }),
    });
    const raw = await resp.text();
    const data = raw ? JSON.parse(raw) : {};
    if (!resp.ok) throw new Error(data.error || "Error al resumir archivo.");
    return String(data.summary || "");
  }

  // 3) Otros (txt/docx exportado a txt en el navegador): como texto plano
  try {
    const textPlain = (await file.text()).trim();
    if (!textPlain) throw new Error("Archivo vacío.");
    const resp = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textPlain, summaryType }),
    });
    const raw = await resp.text();
    const data = raw ? JSON.parse(raw) : {};
    if (!resp.ok) throw new Error(data.error || "Error al resumir.");
    return String(data.summary || "");
  } catch {
    throw new Error("No se pudo extraer contenido del archivo. Sube un PDF con texto o una imagen nítida.");
  }
}

// -------- 2) Generar “Mapa conceptual” --------
export async function createPresentation(
  summaryText: string,
  presentationType: PresentationType
): Promise<PresentationData> {
  const resp = await fetch("/api/present", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summaryText, presentationType }),
  });

  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía al generar el mapa conceptual.");

  let data: any;
  try { data = JSON.parse(raw); }
  catch { throw new Error("Respuesta no es JSON válido al generar el mapa conceptual."); }

  if (!resp.ok) throw new Error(data.error || "Error al generar el mapa conceptual.");
  return data.presentationData as PresentationData;
}

// -------- 3) Generar “Mapa mental” --------
export async function createMindMapFromText(text: string): Promise<MindMapData> {
  const textToSend = String(text || "").trim();
  if (!textToSend) {
    throw new Error("No hay texto para generar el mapa mental. Primero genera un resumen o una presentación.");
  }
  const resp = await fetch("/api/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: textToSend }),
  });
  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor en mindmap.");
  let data: any;
  try { data = JSON.parse(raw); } catch { throw new Error("Respuesta no es JSON válido en mindmap."); }
  if (!resp.ok) throw new Error(data.error || "Error al generar mapa mental.");
  return data.mindmap as MindMapData;
}

// -------- 4) Generar Flashcards (¡NUEVO!) --------
export async function generateFlashcards(
  summaryText: string
): Promise<Flashcard[]> {
  const textToSend = String(summaryText || "").trim();
  if (!textToSend) {
    throw new Error("No hay resumen para generar las flashcards.");
  }

  const resp = await fetch("/api/flashcards", { // <-- Nueva ruta de API
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summaryText: textToSend }),
  });

  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor al generar flashcards.");

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error("La respuesta no es JSON válido al generar flashcards: " + raw);
  }

  if (!resp.ok) throw new Error(data.error || "Error al generar las flashcards.");

  // Asumimos que `data.flashcards` es un array de objetos { question: string, answer: string }
  // Aquí añadimos un ID único a cada flashcard y filtramos cualquier tarjeta vacía.
  const flashcards: Flashcard[] = (data.flashcards || []).map((card: any, index: number) => ({
    id: `card-${index}-${Date.now()}`, // Genera un ID único para cada tarjeta
    question: String(card.question || "").trim(),
    answer: String(card.answer || "").trim(),
  })).filter((card: Flashcard) => card.question && card.answer); // Filtrar tarjetas sin contenido

  if (flashcards.length === 0) {
    throw new Error("No se generaron flashcards válidas. Intenta con un resumen más detallado.");
  }

  return flashcards;
}

// -------- 5) Utilidad: aplanar presentación → texto (usa PresentationSection) --------
export function flattenPresentationToText(p: PresentationData): string {
  const lines: string[] = [p.title];
  const walk = (s: PresentationSection, d = 0) => { // <-- Usa PresentationSection
    const prefix = "  ".repeat(d);
    lines.push(`${prefix}${s.emoji ? s.emoji + " " : ""}${s.title}`);
    if (s.content) lines.push(`${prefix}${s.content}`);
    (s.subsections || []).forEach((ss: PresentationSection) => walk(ss, d + 1)); // <-- Usa PresentationSection
  };
  p.sections.forEach((sec) => walk(sec, 0));
  return lines.join("\n");
}