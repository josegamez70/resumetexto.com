// src/services/geminiService.ts

import type {
  SummaryType,
  PresentationType,
  PresentationData,
  PresentationSection,
  MindMapData,
  Flashcard,
} from "../types";

/* ---------------------------------------------------------
   Configuración PDF.js (evitar "Setting up fake worker")
--------------------------------------------------------- */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfjsLib = require("pdfjs-dist");
  if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }
} catch { /* no-op */ }

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function extractJson<T = any>(raw: string): T {
  if (!raw) throw new Error("Respuesta vacía del modelo");
  const fenced = /```json([\s\S]*?)```/i.exec(raw);
  let candidate = fenced ? fenced[1].trim() : raw.trim();
  const a = candidate.indexOf("{");
  const b = candidate.lastIndexOf("}");
  if (a !== -1 && b !== -1 && b > a) candidate = candidate.slice(a, b + 1);
  candidate = candidate
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
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
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    fr.readAsDataURL(file);
  });
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

/* ---------------------------------------------------------
   API pública
--------------------------------------------------------- */

/**
 * NUEVO: admite 1 PDF o hasta 6 fotos (sin mezclar).
 * Si recibes mezcla, prioriza validación/errores en backend.
 */
export async function summarizeContents(
  files: File[],
  summaryType: SummaryType
): Promise<string> {
  // Normalizamos y validamos de forma suave (backend valida estrictamente)
  const pdfs   = files.filter(f => /^application\/pdf$/i.test(f.type));
  const images = files.filter(f => /^image\//i.test(f.type));

  let normalized: File[] = [];

  if (pdfs.length > 0 && images.length === 0) {
    normalized = [pdfs[0]]; // solo 1 PDF (si llegan varios, tomamos el primero)
  } else if (pdfs.length === 0 && images.length > 0) {
    normalized = images.slice(0, 6); // hasta 6 fotos
  } else if (pdfs.length === 0 && images.length === 0) {
    // Caso texto plano u otros tipos: se envía como textoChunks
    normalized = [];
  } else {
    // Mezcla: dejamos que lo rechace el backend con un error claro
    normalized = files;
  }

  const payload: any = {
    summaryType,
    files: [] as { base64: string; mimeType: string }[],
    textChunks: [] as string[],
  };

  if (normalized.length) {
    for (const file of normalized) {
      const mime = file?.type || "";
      if (/^application\/pdf$/i.test(mime) || /^image\//i.test(mime)) {
        const base64 = await fileToBase64(file);
        payload.files.push({ base64, mimeType: mime });
      } else {
        const text = await file.text();
        payload.textChunks.push(text.slice(0, 20000));
      }
    }
  } else {
    // Si no hay archivos (p.ej. input de texto en otras rutas), intenta leer como texto
    for (const file of files) {
      const text = await file.text().catch(() => "");
      if (text) payload.textChunks.push(text.slice(0, 20000));
    }
  }

  const data = await postJson<{ summary: string }>("summarize", payload);
  const summary = String(data?.summary ?? "").trim();
  if (!summary) throw new Error("La IA no devolvió un resumen.");
  return summary;
}

/**
 * Compatibilidad: firma antigua (1 archivo).
 * Internamente usa summarizeContents para unificar lógica.
 */
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<string> {
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
