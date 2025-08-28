// src/services/geminiService.ts
// -----------------------------------------------------------------------------
// Todas las llamadas al modelo pasan por /.netlify/functions/gemini
// (nada de claves en el bundle del front).
// -----------------------------------------------------------------------------

import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

import {
  SummaryType,
  PresentationType,
  PresentationData,
  MindMapData,
  Flashcard,
} from "../types";

// --- helper: llama a la Netlify Function ------------------------------------------------
async function askGemini(prompt: string): Promise<string> {
  const res = await fetch("/.netlify/functions/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Gemini error");
  return (data.text as string) ?? "";
}

// --- utils ------------------------------------------------------------------------------

function extractJson<T>(raw: string): T {
  // limpia ```json ... ``` ó ruido alrededor
  const cleaned = raw
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fallback: intenta encontrar el primer {...}
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("No JSON in model output");
  }
}

// --- PDF a texto ------------------------------------------------------------------------

export async function extractTextFromPDF(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: any) => ("str" in it ? it.str : ""))
      .join(" ");
    out += text + "\n\n";
  }
  return out.replace(/\s+\n/g, "\n").trim();
}

// --- Resumen ---------------------------------------------------------------------------

type SummaryJson = { title: string; summary: string };

export async function summarizeText(
  text: string,
  type: SummaryType
): Promise<SummaryJson> {
  const style =
    type === (SummaryType as any).Short
      ? "en 5–7 frases"
      : type === (SummaryType as any).Long
      ? "en 10–15 frases con algo de detalle"
      : "por puntos breves (•)";

  const prompt = `
Lee el siguiente texto y genera un JSON **válido** con exactamente:
{
  "title": "<título conciso>",
  "summary": "<resumen ${style} en español>"
}

Texto:
${text.slice(0, 15000)}
  `.trim();

  const raw = await askGemini(prompt);
  return extractJson<SummaryJson>(raw);
}

export async function summarizeFile(
  file: File,
  type: SummaryType
): Promise<SummaryJson> {
  const text = await extractTextFromPDF(file);
  return summarizeText(text, type);
}

// --- Mapa mental -----------------------------------------------------------------------

type MindNode = { text: string; children?: MindNode[] };

export async function generateMindMapFromSummary(
  summary: string
): Promise<MindMapData> {
  const prompt = `
Convierte el resumen en un mapa mental y devuelve JSON **válido** con este formato:
{
  "root": { "text": "<título raíz>", "children": [ { "text": "nodo", "children": [...] }, ... ] }
}
No añadas explicaciones fuera del JSON. Idioma: español.

Resumen:
${summary}
  `.trim();

  const raw = await askGemini(prompt);
  const data = extractJson<{ root: MindNode }>(raw);
  return { root: data.root };
}

// --- Presentación ----------------------------------------------------------------------

type PresentationSection = {
  title: string;
  emoji?: string;
  content?: string;
  subsections?: PresentationSection[];
};

export async function generatePresentationFromSummary(
  summary: string,
  type: PresentationType
): Promise<PresentationData> {
  const depth =
    type === (PresentationType as any).Complete
      ? "con 3 niveles (tema → subtema → detalle)"
      : type === (PresentationType as any).Kids
      ? "pensada para niños: muy clara, frases cortas y emojis"
      : "con 2 niveles (tema → subtema)";

  const tone =
    type === (PresentationType as any).Kids
      ? "tono cercano y sencillo"
      : "tono divulgativo";

  const prompt = `
Transforma el resumen en esquema de presentación. Devuelve JSON **válido**:
{
  "title": "<título>",
  "sections": [
    { "title": "Sección", "emoji": "💡", "content": "2–3 frases opcionales",
      "subsections": [ { "title": "subsección", "emoji": "•", "content": "1–2 frases" } ] }
  ]
}
Estructura ${depth}, ${tone}. Sin texto fuera del JSON. Idioma: español.

Resumen:
${summary}
  `.trim();

  const raw = await askGemini(prompt);
  return extractJson<PresentationData>(raw);
}

// --- Flashcards -------------------------------------------------------------------------

export async function generateFlashcardsFromSummary(
  summary: string
): Promise<Flashcard[]> {
  const prompt = `
Crea tarjetas tipo pregunta-respuesta del resumen. Devuelve JSON **válido**:
[
  { "question": "¿...?", "answer": "..." },
  ...
]
Entre 8 y 15 tarjetas, claras y útiles. Idioma: español.

Resumen:
${summary}
  `.trim();

  const raw = await askGemini(prompt);
  return extractJson<Flashcard[]>(raw);
}

// --- Utilidad: aplanar presentación a texto --------------------------------------------

export function flattenPresentationToText(p: PresentationData): string {
  const lines: string[] = [p.title || "Presentación"];

  const walk = (s: PresentationSection, d = 0) => {
    const prefix = "  ".repeat(d);
    lines.push(`${prefix}${s.emoji ? s.emoji + " " : ""}${s.title}`);
    if (s.content) lines.push(`${prefix}${s.content}`);
    (s.subsections || []).forEach((ss) => walk(ss, d + 1));
  };

  (p.sections || []).forEach((sec) => walk(sec, 0));
  return lines.join("\n");
}
