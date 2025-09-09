// src/services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializa el cliente con la API Key
const apiKey = import.meta.env.VITE_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

export type SummaryType = "short" | "bullets" | "long" | "general";

// Función auxiliar para extraer JSON seguro
function extractJson<T>(raw: string): T {
  try {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error("Error al parsear JSON:", err);
    throw new Error("La IA devolvió un formato inesperado.");
  }
}

// --- Función principal: Resumir contenido ---
export async function summarizeContent(
  file: File,
  summaryType: SummaryType
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let prompt = "";

  switch (summaryType) {
    case "short":
      prompt = `
        Resume el siguiente texto en pocas frases, de forma breve y concisa.
        Texto:
      `;
      break;

    case "bullets":
      prompt = `
        Resume el siguiente texto en viñetas claras y estructuradas.
        Usa guiones o puntos para cada idea principal.
        Texto:
      `;
      break;

    case "long":
      prompt = `
        Redacta un **resumen largo** del siguiente texto en **párrafos continuos**.
        ❌ No uses viñetas, listas, ni puntos enumerados.
        ✅ Usa únicamente prosa corrida y coherente, como si fuera un artículo o explicación extensa.
        
        Texto:
      `;
      break;

    case "general":
    default:
      prompt = `
        Resume el siguiente texto de manera clara y estructurada.
        Texto:
      `;
      break;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: btoa(
          bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
        ),
        mimeType: file.type,
      },
    },
    { text: prompt },
  ]);

  const response = result.response;
  return response.text();
}

// --- Mapa mental ---
export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

export async function generateMindMap(file: File): Promise<{ root: MindMapNode }> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const prompt = `
    Convierte el siguiente texto en un **mapa mental en JSON**.
    - Usa nodos con id, label y children.
    - Limita a 4 niveles de profundidad.
    - No inventes información extra.
    Devuelve solo JSON válido.
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: btoa(
          bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
        ),
        mimeType: file.type,
      },
    },
    { text: prompt },
  ]);

  const raw = result.response.text();
  return extractJson<{ root: MindMapNode }>(raw);
}

// --- Flashcards ---
export interface Flashcard {
  question: string;
  answer: string;
}

export async function generateFlashcards(file: File): Promise<Flashcard[]> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const prompt = `
    Genera entre 10 y 20 **flashcards** en formato JSON.
    Cada flashcard debe tener:
    - "question": una pregunta clara sobre el contenido.
    - "answer": una respuesta breve y correcta.
    Devuelve solo JSON válido (array de objetos).
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: btoa(
          bytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
        ),
        mimeType: file.type,
      },
    },
    { text: prompt },
  ]);

  const raw = result.response.text();
  return extractJson<Flashcard[]>(raw);
}
