// src/services/geminiService.ts

/* ---------------------------------------------------------
   Importa TODOS los tipos desde src/types
--------------------------------------------------------- */
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
   Usamos el worker oficial por URL, compatible con CRA.
--------------------------------------------------------- */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfjsLib = require("pdfjs-dist");
  if (pdfjsLib?.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  }
} catch {
  // si no hay pdfjs-dist en este contexto, ignoramos
}

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
  try {
    return JSON.parse(candidate) as T;
  } catch {
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
  try {
    return JSON.parse(text) as T;
  } catch {
    return extractJson<T>(text);
  }
}

/* ---------------------------------------------------------
   API pública
--------------------------------------------------------- */

export async function summarizeContent(
  fileOrFiles: File | File[],
  summaryType: SummaryType
): Promise<string> {
  const toBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(fr.error);
      fr.onload = () => {
        const res = String(fr.result || "");
        resolve(res.includes(",") ? res.split(",")[1] : res);
      };
      fr.readAsDataURL(f);
    });

  const payload: any = { summaryType };

  if (Array.isArray(fileOrFiles)) {
    // Varias fotos
    const images = fileOrFiles.filter(f => /^image\//i.test(f.type)).slice(0, 6);
    if (images.length > 0) {
      const list = await Promise.all(
        images.map(async (f) => ({
          base64: await toBase64(f),
          mimeType: f.type || "image/jpeg",
        }))
      );
      payload.files = list;
    }
  } else if (fileOrFiles) {
    // Un único archivo: PDF o una imagen
    const f = fileOrFiles;
    if (/^application\/pdf$/i.test(f.type)) {
      payload.file = {
        base64: await toBase64(f),
        mimeType: f.type || "application/pdf",
      };
    } else if (/^image\//i.test(f.type)) {
      payload.files = [{
        base64: await toBase64(f),
        mimeType: f.type || "image/jpeg",
      }];
    } else {
      // Texto plano (si alguna vez llamas con un .txt)
      const text = await f.text();
      payload.text = text.slice(0, 20000);
    }
  }

  const data = await postJson<{ summary: string }>("summarize", payload);
  const summary = String(data?.summary ?? "").trim();
  if (!summary) throw new Error("La IA no devolvió un resumen.");
  return summary;
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
