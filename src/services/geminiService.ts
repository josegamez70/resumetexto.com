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

/** Extrae JSON de respuestas con o sin bloque ```json */
function extractJson<T = any>(raw: string): T {
  if (!raw) throw new Error("Respuesta vacía del modelo");

  // 1) Si viene en bloque ```json ... ```
  const fenced = /```json([\s\S]*?)```/i.exec(raw);
  let candidate = fenced ? fenced[1].trim() : raw.trim();

  // 2) Recorta al primer { y último }
  const a = candidate.indexOf("{");
  const b = candidate.lastIndexOf("}");
  if (a !== -1 && b !== -1 && b > a) candidate = candidate.slice(a, b + 1);

  // 3) Normaliza comillas “”
  candidate = candidate.replace(/[\u201C-\u201F]/g, '"');

  // 4) Borra comas colgantes
  candidate = candidate.replace(/,\s*([}\]])/g, "$1");

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // 5) Limpieza final por si hay restos de fences
    const cleaned = candidate.replace(/```+.*?```+/gs, "").trim();
    return JSON.parse(cleaned) as T;
  }
}

/** Convierte un File a base64 (solo datos) */
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

/** Divide texto largo en chunks de tamaño máximo (por defecto 15000) */
function splitTextIntoChunks(text: string, max = 15000): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + max));
    i += max;
  }
  return chunks;
}

/** Adivina el mime por extensión si no viene en file.type */
function guessMime(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

/** POST JSON a funciones Netlify con tolerancia a respuesta texto/JSON */
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

/**
 * Resumen potente con OCR (PDF/imagen/manuscrito) y soporte de textos largos.
 * - En PDFs/IMÁGENES: envía base64 + mime y sugiere usar gemini-2.5-flash.
 * - En TEXTO: ya NO recorta a 10k; envía textChunks de ~15k.
 */
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<string> {
  const mime = file?.type || "";
  const payload: any = {
    summaryType,
    // Sugerencia para el backend: usar modelo multimodal
    preferModel: "gemini-2.5-flash",
  };

  // PDF o imagen → enviar binario (OCR robusto en backend)
  if (/^application\/pdf$/i.test(mime) || /^image\//i.test(mime)) {
    const base64 = await fileToBase64(file);
    payload.file = {
      base64,
      mimeType: mime || guessMime(file.name || "file"),
      // Pista opcional al backend para activar OCR “duro”
      ocr: true,
    };
  } else {
    // Texto plano → sin recortar; trocear en bloques grandes
    const raw = await file.text();
    const chunks = splitTextIntoChunks(raw, 15000);
    payload.textChunks = chunks;
  }

  const data = await postJson<{ summary: string }>("summarize", payload);
  const summary = String(data?.summary ?? "").trim();
  if (!summary) throw new Error("La IA no devolvió un resumen.");
  return summary;
}

/** Crea una presentación (usa el backend; se sugiere allí 2.5-flash también) */
export async function createPresentation(
  summaryText: string,
  presentationType: PresentationType
): Promise<PresentationData> {
  const data = await postJson<any>("present", {
    summaryText,
    presentationType,
    preferModel: "gemini-2.5-flash",
  });
  const pres: PresentationData =
    data?.presentationData ?? data ?? { title: "", sections: [] };
  if (!pres?.sections) throw new Error("Respuesta inválida al crear la presentación.");
  return pres;
}

/** Genera un mapa mental desde texto ya procesado */
export async function createMindMapFromText(text: string): Promise<MindMapData> {
  const data = await postJson<{ mindmap: MindMapData }>("mindmap", {
    text,
    preferModel: "gemini-2.5-flash",
  });
  const mm = data?.mindmap ?? data;
  if (!mm?.root) throw new Error("Respuesta inválida al generar el mapa mental.");
  return mm;
}

/** Aplana la presentación a texto con jerarquía */
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

/** Flashcards coherentes con el resumen y el contenido */
export async function generateFlashcards(
  summaryText: string
): Promise<Flashcard[]> {
  const data = await postJson<{ flashcards: Flashcard[] }>("flashcards", {
    summaryText,
    preferModel: "gemini-2.5-flash",
  });
  const arr = Array.isArray(data?.flashcards) ? data.flashcards : [];
  if (!arr.length) throw new Error("No se generaron flashcards.");
  return arr;
}
