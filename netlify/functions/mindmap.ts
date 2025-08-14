import type { Handler } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY =
  process.env.VITE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

const genAI = new GoogleGenerativeAI(API_KEY);

const handler: Handler = async (event) => {
  try {
    if (!API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta la API Key de Gemini (VITE_API_KEY / GEMINI_API_KEY)." }),
      };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Solicitud vacía." }) };
    }

    const { text } = JSON.parse(event.body);
    if (!text || typeof text !== "string") {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { text: string }." }) };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Eres un generador de mapas mentales. A partir del TEXTO que te paso, construye un árbol jerárquico de conceptos (máx. 5 niveles),
con títulos cortos y claros. No inventes datos. Agrupa por temas.

Devuelve EXCLUSIVAMENTE un JSON válido (sin comentarios, sin explicaciones, sin texto extra, sin \`\`\`), con este esquema:

{
  "root": {
    "id": "root",
    "label": "TÍTULO PRINCIPAL",
    "children": [
      {
        "id": "n1",
        "label": "Subtema o concepto",
        "note": "Frase corta opcional",
        "children": [
          { "id": "n1a", "label": "Idea / dato", "note": "opcional" }
        ]
      }
    ]
  }
}

TEXTO:
`;

    const result = await model.generateContent([{ role: "user", parts: [{ text: prompt + text }] }]);
    let raw = result.response.text().trim();
    raw = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "La respuesta de Gemini no fue JSON válido.", raw }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ mindmap: data }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error desconocido en mindmap." }) };
  }
};

export { handler };
