// netlify/functions/mindmap.js
// Mapa mental: cap input a 12k, fuerza JSON, parseo robusto y poda/normalización.

const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

function genId() { return crypto.randomBytes(6).toString("hex"); }

function safeJsonParseObject(s) {
  const cleaned = String(s || "").replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
  if (a !== -1 && b > a) {
    const slice = cleaned.slice(a, b + 1);
    try { return JSON.parse(slice); } catch {}
  }
  throw new Error("No se pudo parsear el JSON del mapa mental.");
}

const MAX_WORDS_L1 = 4;
const MAX_WORDS_L2 = 5;

function shortLabel(label, maxWords) {
  const words = String(label || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}
function isContentful(n) {
  return Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());
}

function normalizeTree(node, level = 0) {
  if (!node || typeof node !== "object") return;
  if (!node.id || typeof node.id !== "string" || node.id === "auto") node.id = genId();
  if (!Array.isArray(node.children)) node.children = [];

  if (level === 1) node.label = shortLabel(node.label, MAX_WORDS_L1);
  if (level === 2) node.label = shortLabel(node.label, MAX_WORDS_L2);

  if (level >= 3) {
    node.children = [];
    node.label = String(node.label ?? "").trim();
    node.note  = String(node.note  ?? "").trim();
    return;
  }

  node.children.forEach((c) => normalizeTree(c, level + 1));

  if (level === 2) {
    node.children = node.children.map((c) => ({
      id: c.id || genId(),
      label: String(c.label ?? "").trim(),
      note:  String(c.note  ?? "").trim(),
      children: [],
    })).filter(isContentful);
  }

  node.children = node.children.filter((c) => {
    if (!Array.isArray(c.children) || c.children.length === 0) return isContentful(c);
    return true;
  });
}

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY" }) };
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) }; }

    const rawText = String(body.text || "");
    if (!rawText.trim()) return { statusCode: 400, body: JSON.stringify({ error: "Falta 'text' para el mapa mental." }) };

    const MAX = 12000; // cap para evitar timeouts
    const cleaned = rawText.replace(/\s+/g, " ").trim();
    const safe = cleaned.length > MAX ? cleaned.slice(0, MAX) : cleaned;

    const preferModel = String(body.preferModel || "gemini-2.5-flash");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: preferModel });

    const system = `
Devuelve SOLO JSON (sin comentarios) con esta forma:

{
  "root": {
    "id": "string",
    "label": "Tema central",
    "note": "opcional",
    "children": [
      {
        "id": "string",
        "label": "Idea principal (máx. 4 palabras)",
        "note": "opcional",
        "children": [
          {
            "id": "string",
            "label": "Subtema (máx. 5 palabras)",
            "note": "opcional",
            "children": [
              { "id": "string", "label": "Detalle breve (opcional, puede ir vacío)", "note": "opcional", "children": [] }
            ]
          }
        ]
      }
    ]
  }
}

REGLAS:
- Español.
- Nivel 1: máx. 4 palabras; Nivel 2: máx. 5 palabras.
- Profundidad máxima: 3 (root -> 1 -> 2 -> 3).
- Nivel 3 es HOJA. Si no hay nada, su "label" puede quedar VACÍO (luego se oculta).
- JSON P U R O.`;

    const user = `
Texto base (recortado a ${MAX} caracteres para eficiencia):
---
${safe}
---
Devuelve SOLO el JSON del mapa mental siguiendo las REGLAS.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: system }, { text: user }] }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
        maxOutputTokens: 1024
      },
    });

    const raw = String(result?.response?.text?.() || "");
    const parsed = safeJsonParseObject(raw);
    if (!parsed || !parsed.root) {
      return { statusCode: 500, body: JSON.stringify({ error: "No se pudo parsear el JSON del mapa mental." }) };
    }

    normalizeTree(parsed.root, 0);
    return { statusCode: 200, body: JSON.stringify({ mindmap: parsed }) };
  } catch (err) {
    console.error("[mindmap] ERROR:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error interno en mindmap" }) };
  }
};
