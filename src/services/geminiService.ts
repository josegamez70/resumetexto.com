// src/services/geminiService.ts
import * as pdfjsLib from "pdfjs-dist";
import {
  SummaryType,
  PresentationType,
  PresentationData,
  MindMapData,
} from "../types";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ---- helpers ----
async function fileToBase64(file: File): Promise<string> {
  const res: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  if (!res) throw new Error("No se pudo leer el archivo.");
  return res;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = (content.items as any[]).map((it: any) => ("str" in it ? it.str : "")).filter(Boolean);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

async function ocrImageOnServer(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  const resp = await fetch("/api/gemini-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
  });
  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor en OCR.");
  let data: any; try { data = JSON.parse(raw); } catch { throw new Error("Respuesta no es JSON válido en OCR."); }
  if (!resp.ok) throw new Error(data.error || "Error en OCR.");
  if (!data.text) throw new Error("OCR no devolvió texto.");
  return String(data.text);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const type = (file.type || "").toLowerCase();
  if (type.includes("pdf")) return await extractTextFromPDF(file);
  if (type.startsWith("image/")) return await ocrImageOnServer(file);
  throw new Error("Formato no soportado. Sube un PDF o una imagen.");
}

// ---- API alto nivel usada por App.tsx ----
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<{ summary: string; title: string }> {
  const text = await extractTextFromFile(file);
  const resp = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, summaryType }),
  });
  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor al resumir.");
  let data: any; try { data = JSON.parse(raw); } catch { throw new Error("Respuesta no es JSON válido al resumir."); }
  if (!resp.ok) throw new Error(data.error || "Error al resumir.");
  return { summary: String(data.summary), title: String(data.title) };
}

export async function createPresentation(
  file: File,
  presentationType: PresentationType
): Promise<PresentationData> {
  // Nota: tu función present.js espera "summaryText".
  const text = await extractTextFromFile(file);
  const resp = await fetch("/api/present", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summaryText: text, presentationType }),
  });
  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor al generar presentación.");
  let data: any; try { data = JSON.parse(raw); } catch { throw new Error("Respuesta no es JSON válido al generar presentación."); }
  if (!resp.ok) throw new Error(data.error || "Error al generar presentación.");
  return data.presentationData as PresentationData;
}

export async function createMindMapFromText(text: string): Promise<MindMapData> {
  const resp = await fetch("/api/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor en mindmap.");
  let data: any; try { data = JSON.parse(raw); } catch { throw new Error("Respuesta no es JSON válido en mindmap."); }
  if (!resp.ok) throw new Error(data.error || "Error al generar mapa mental.");
  return data.mindmap as MindMapData;
}

export function flattenPresentationToText(p: PresentationData): string {
  const lines: string[] = [p.title];
  const walk = (s: any, d = 0) => {
    const prefix = "  ".repeat(d);
    lines.push(`${prefix}${s.emoji ? s.emoji + " " : ""}${s.title}`);
    if (s.content) lines.push(`${prefix}${s.content}`);
    (s.subsections || []).forEach((ss: any) => walk(ss, d + 1));
  };
  p.sections.forEach((sec) => walk(sec, 0));
  return lines.join("\n");
}
