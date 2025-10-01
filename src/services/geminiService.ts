// src/services/geminiService.ts

import type {
  SummaryType,
  PresentationType,
  PresentationData,
  PresentationSection,
  MindMapData,
  Flashcard,
} from "../types";

/* PDF.js worker */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfjsLib = require("pdfjs-dist");
  if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }
} catch {}

/* ----------------------------- Helpers -------------------------------- */

function extractJson<T = any>(raw: string): T {
  if (!raw) throw new Error("Respuesta vacía del modelo");
  const fenced = /```json([\s\S]*?)```/i.exec(raw);
  let candidate = fenced ? fenced[1].trim() : raw.trim();
  const a = candidate.indexOf("{");
  const b = candidate.lastIndexOf("}");
  if (a !== -1 && b !== -1 && b > a) candidate = candidate.slice(a, b + 1);
  candidate = candidate
    .replace(/[\u201C-\u201F]/g, '"')
    .replace(/,\s*([}\]])/g, "$1");
  try { return JSON.parse(candidate) as T; }
  catch {
    const cleaned = candidate.replace(/```+.*?```+/gs, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error);
    fr.onload = () => {
      const res = String(fr.result || "");
      resolve(res.includes(",") ? res.split(",")[1] : res);
    };
    fr.readAsDataURL(file);
  });
}

/** Reescala JPEG/PNG en el cliente si pesa > ~1.5MB. Convierte a JPEG. */
async function compressImageToJpegBase64(file: File, maxDim = 1600, quality = 0.72): Promise<string> {
  // Si el navegador no puede leer (p.ej. HEIC en algunos), devolvemos tal cual (lo atrapará el server).
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("No se pudo cargar la imagen para comprimir."));
      im.src = blobUrl;
    });

    const { width, height } = img;
    let tw = width, th = height;
    if (width > height && width > maxDim) {
      tw = maxDim; th = Math.round(height * (maxDim / width));
    } else if (height >= width && height > maxDim) {
      th = maxDim; tw = Math.round(width * (maxDim / height));
    }

    const canvas = document.createElement("canvas");
    canvas.width = tw; canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.drawImage(img, 0, 0, tw, th);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    return dataUrl.split(",")[1] || "";
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/** Si es imagen grande, comprime; si es PDF u otro, pasa tal cual.
 *  RETORNA en el formato esperado por 'fileParts' en la función Netlify.
 */
async function fileToGeminiPart(file: File): Promise<{ inlineData?: { data: string; mimeType: string }; text?: string }> {
  const mime = file.type || "";
  const isJpegPng = /^image\/(jpeg|jpg|png)$/i.test(mime);
  const isImage = /^image\//i.test(mime);
  const isPdf = /^application\/pdf$/i.test(mime);

  // Si es JPEG/PNG y grande, comprimir y devolver como inlineData
  if (isJpegPng && file.size > 1.5 * 1024 * 1024) {
    const base64 = await compressImageToJpegBase64(file);
    return { inlineData: { data: base64, mimeType: "image/jpeg" } };
  }

  // Si es otra imagen o PDF, convertir a base64 y devolver como inlineData
  if (isImage || isPdf) {
    const base64 = await fileToBase64(file);
    return { inlineData: { data: base64, mimeType: mime } };
  }

  // Para otros tipos de archivo, intentar leer como texto y devolver
  try {
    const textContent = await file.text();
    return { text: textContent.slice(0, 20000) }; // Truncar texto para evitar payloads excesivos
  } catch {
    console.warn(`No se pudo leer el archivo ${file.name} como texto o imagen/pdf. Se ignorará.`);
    return {}; // Devolver un objeto vacío si no se puede procesar
  }
}

async function postJson<T = any>(fnName: string, body: any): Promise<T> {
  const url = `/.netlify/functions/${fnName}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const text = await resp.text();
  if (!resp.ok) {
    try {
      const err = JSON.parse(text);
      throw new Error(err?.error || `Error ${resp.status} en ${fnName}`);
    } catch {
      throw new Error(`Error ${resp.status} en ${fnName}: ${text.slice(0, 500)}`);
    }
  }
  try { return JSON.parse(text) as T; }
  catch { return extractJson<T>(text); }
}

/* ------------------------------ API ----------------------------------- */

export async function summarizeContents(
  files: File[],
  summaryType: SummaryType
): Promise<string> {
  // *** CAMBIO PRINCIPAL AQUÍ: Construir el payload con 'fileParts' ***
  const payload: any = {
    summaryType,
    fileParts: [] as Array<{ inlineData?: { data: string; mimeType: string }; text?: string }>,
  };

  // Procesar cada archivo para convertirlo en una "parte" de Gemini
  // Limitamos a 6 archivos como en tu lógica original
  for (const f of files.slice(0, 6)) {
    const part = await fileToGeminiPart(f);
    if (part.inlineData || part.text) { // Solo añadir si hay contenido válido
      payload.fileParts.push(part);
    }
  }

  // Si no se pudo extraer contenido válido de ningún archivo, lanzar un error
  if (payload.fileParts.length === 0) {
      throw new Error("No se pudo extraer contenido válido de los archivos proporcionados para resumir.");
  }

  const data = await postJson<{ summary: string }>("summarize", payload);
  const summary = String(data?.summary ?? "").trim();
  if (!summary) throw new Error("La IA no devolvió un resumen.");
  return summary;
}

export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<string> {
  // *** CAMBIO AQUÍ: Llamar a summarizeContents para unificar la lógica ***
  return summarizeContents([file], summaryType);
}

export async function createPresentation(
  summaryText: string,
  presentationType: PresentationType
): Promise<PresentationData> {
  const data = await postJson<any>("present", { summaryText, presentationType });
  const pres: PresentationData =
    data?.presentationData ?? data ?? { title: "", sections: [] };
  if (!pres?.sections) throw new Error("Respuesta inválida al crear la presentación.");
  return pres;
}

export async function createMindMapFromText(text: string): Promise<MindMapData> {
  const data = await postJson<{ mindmap: MindMapData }>("mindmap", { text });
  const mm = data?.mindmap ?? data;
  if (!mm?.root) throw new Error("Respuesta inválida al generar el mapa mental.");
  return mm;
}

export function flattenPresentationToText(p: PresentationData): string {
  const lines: string[] = [];
  lines.push(`# ${p.title}`);
  const walk = (s: PresentationSection, depth = 1) => {
    const pad = "  ".repeat(depth - 1);
    lines.push(`${pad}- ${s.emoji ? s.emoji + " " : ""}${s.title}`);
    if (s.content) lines.push(`${pad}  ${s.content}`);
    (s.subsections || []).forEach((x) => walk(x, depth + 1));
  };
  (p.sections || []).forEach((sec) => walk(sec, 1));
  return lines.join("\n");
}

export async function generateFlashcards(
  summaryText: string
): Promise<Flashcard[]> {
  const data = await postJson<{ flashcards: Flashcard[] }>("flashcards", { summaryText });
  const arr = Array.isArray(data?.flashcards) ? data.flashcards : [];
  if (!arr.length) throw new Error("No se generaron flashcards.");
  return arr;
}