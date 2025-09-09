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

/** Carga dinámica de pdf.js (solo si hace falta) */
// @ts-ignore
const loadPdfjs = async () => await import("pdfjs-dist/build/pdf");

/** Extrae texto de hasta `maxPages` páginas de un PDF */
async function extractPdfText(file: File, maxPages = 10): Promise<string> {
  const pdfjs: any = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages = Math.min(pdf.numPages, maxPages);
  let out = "";
  for (let p = 1; p <= pages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((i: any) => i.str || "").join(" ").trim();
    if (text) out += (out ? "\n\n" : "") + text;
    // límite de seguridad para no saturar funciones
    if (out.length > 300_000) break;
  }
  return out.trim();
}

/**
 * Renderiza hasta `maxPages` páginas de un PDF a imágenes (JPEG base64),
 * ideal para PDFs escaneados/manuscritos sin capa de texto.
 */
async function renderPdfPagesToImages(
  file: File,
  maxPages = 10,
  scale = 1.5,
  quality = 0.92
): Promise<Array<{ inlineData: { mimeType: string; data: string } }>> {
  const pdfjs: any = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages = Math.min(pdf.numPages, maxPages);

  const parts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
  for (let p = 1; p <= pages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderTask = page.render({ canvasContext: ctx, viewport });
    await renderTask.promise;

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1];

    parts.push({
      inlineData: { mimeType: "image/jpeg", data: base64 },
    });

    // liberar memoria
    canvas.width = 1;
    canvas.height = 1;
  }
  return parts;
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
 *
 * - PDF:
 *    1) Intentamos extraer TEXTO de hasta 10 páginas (rápido).
 *    2) Si no hay texto (escaneado/manuscrito), renderizamos hasta 10 páginas a imágenes
 *       y enviamos como `fileParts` (OCR con gemini-2.5-flash).
 * - Imagen: OCR directo.
 * - Texto plano: sin recorte estricto; se trocea a chunks largos (~15k).
 */
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<string> {
  const mime = file?.type || "";
  const payload: any = {
    summaryType,
    preferModel: "gemini-2.5-flash",
  };

  if (/^application\/pdf$/i.test(mime)) {
    // 1) PDF digital → extraer texto (hasta 10 páginas)
    let textFromPdf = "";
    try {
      textFromPdf = await extractPdfText(file, 10);
    } catch {
      // si pdf.js falla, caeremos al OCR
    }

    if (textFromPdf && textFromPdf.length > 500) {
      // Enviar como texto troceado (rápido y evita 504)
      payload.textChunks = splitTextIntoChunks(textFromPdf, 15000);
    } else {
      // 2) PDF escaneado/manuscrito → render a imágenes (hasta 10 páginas)
      const parts = await renderPdfPagesToImages(file, 10, 1.5, 0.92);
      if (!parts.length) {
        // fallback final: enviar el PDF completo como binario (por si acaso)
        const base64 = await fileToBase64(file);
        payload.file = { base64, mimeType: mime || guessMime(file.name || "file"), ocr: true };
      } else {
        payload.fileParts = parts;
      }
    }
  } else if (/^image\//i.test(mime)) {
    // Imágenes → OCR directo
    const base64 = await fileToBase64(file);
    payload.file = { base64, mimeType: mime || guessMime(file.name || "image"), ocr: true };
  } else {
    // Texto plano → troceado largo
    const raw = await file.text();
    payload.textChunks = splitTextIntoChunks(raw, 15000);
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
