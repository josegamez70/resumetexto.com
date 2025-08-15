import * as pdfjsLib from "pdfjs-dist";
import {
  SummaryType,
  PresentationType,
  PresentationData,
  MindMapData,
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

// -------- 1) Resumir contenido --------
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<string> {
  // Intentamos extraer texto del PDF; si no es PDF, probamos como texto plano
  let text = "";
  try {
    if (/pdf/i.test(file.type) || file.name.toLowerCase().endsWith(".pdf")) {
      text = await extractTextFromPDF(file);
    } else {
      text = await file.text();
    }
  } catch {
    // último intento
    try {
      text = await file.text();
    } catch {
      text = "";
    }
  }

  const payload = {
    text: String(text || "").trim(),
    summaryType,
  };

  if (!payload.text) {
    throw new Error(
      "No se pudo extraer texto del archivo. Sube un PDF con texto seleccionable."
    );
  }

  const resp = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor al resumir.");

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta no es JSON válido al resumir.");
  }

  if (!resp.ok) throw new Error(data.error || "Error al resumir.");
  return String(data.summary);
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
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta no es JSON válido al generar el mapa conceptual.");
  }

  if (!resp.ok) throw new Error(data.error || "Error al generar el mapa conceptual.");
  return data.presentationData as PresentationData;
}

// -------- 3) Generar “Mapa mental” (extendido por defecto) --------
export async function createMindMapFromText(text: string): Promise<MindMapData> {
  const textToSend = String(text || "").trim();
  if (!textToSend) {
    throw new Error(
      "No hay texto para generar el mapa mental. Primero genera un resumen o una presentación."
    );
  }

  const resp = await fetch("/api/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: textToSend }), // garantizamos 'text'
  });

  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor en mindmap.");

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta no es JSON válido en mindmap.");
  }

  if (!resp.ok) throw new Error(data.error || "Error al generar mapa mental.");
  return data.mindmap as MindMapData;
}

// -------- 4) Utilidad: aplanar presentación → texto --------
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
