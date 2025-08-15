// netlify/functions/mindmap.js
// Reglas:
// - Niveles 1 y 2: etiquetas cortas (máx. 4 y 5 palabras).
// - Niveles 1 y 2: mínimo 2 subpuntos.
// - Profundidad máxima: 3 (root -> 1 -> 2 -> 3).
// - Nivel 3: hoja. Si no hay nada que indicar, etiqueta VACÍA (no "Detalle").
//   Si el modelo aportó texto, se muestra tal cual (sin renombrar).

const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

function genId() { return crypto.randomBytes(6).toString("hex"); }

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch {}
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch {} }
  return null;
}

const MAX_WORDS_L1 = 4;
const MAX_WORDS_L2 = 5;
const MIN_CHILDREN_L1 = 2;
const MIN_CHILDREN_L2 = 2;

function shortLabel(label, maxWords) {
  const words = String(label || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

// Normaliza ids/estructura. No altera colores ni UI.
function normalizeTree(node, level = 0) {
  if (!node || typeof node !== "object") return;
  if (!node.id || typeof node.id !== "string" || node.id === "auto") node.id = genId();
  if (!Array.isArray(node.children)) node.children = [];

  if (level === 1) node.label = shortLabel(node.label, MAX_WORDS_L1);
  if (level === 2) node.label = shortLabel(node.label, MAX_WORDS_L2);

  // Profundidad máxima: 3 (nivel 3 = hoja)
  if (level >= 3) {
    node.children = [];
    // IMPORTANTE: NO renombrar a "Detalle". Si viene vacío, se queda vacío.
    node.label = String(node.label ?? "").trim();
    node.note = String(node.note ?? "");
    return;
  }

  // Garantizar mínimo de hijos en 1 y 2
  const min = level === 1 ? MIN_CHILDREN_L1 : (level === 2 ? MIN_CHILDREN_L2 : 0);
  while (node.children.length < min) {
    node.children.push({ id: genId(), label: "", note: "", children: [] }); // placeholders vacíos
  }

  // Normalizar descendencia
  node.children.forEach((c) => normalizeTree(c, level + 1));

  // Si estamos en nivel 2: sus hijos (nivel 3) deben ser hoja
  if (level === 2) {
    node.children = node.children.map((c) => ({
      id: c.id || genId(),
      // Mantener etiqueta tal cual venga; si es vacía, queda vacía (no "Detalle")
      label: String(c.label ?? "").trim(),
      note: String(c.note ?? ""),
      children: [], // hoja
    }));
  }
}

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY" }) };
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) }; }

    const text = String(body.text || "").trim();
    if (!text) return { statusCode: 400, body: JSON.stringify({ error: "Falta 'text' para el mapa mental." }) };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Prompt: corto en 1–2, mínimo subpuntos, nivel 3 opcionalmente vacío.
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
              { "id": "string", "label": "Texto breve del detalle (opcional, puede ir vacío)", "note": "opcional", "children": [] }
            ]
          }
        ]
      }
    ]
  }
}

REGLAS:
- Español.
- Nivel 1: máx. 4 palabras por etiqueta; Nivel 2: máx. 5 palabras.
- Nivel 1 y 2 DEBEN tener subpuntos (mínimo 2 hijos).
- Profundidad máxima: 3 niveles bajo root (root -> 1 -> 2 -> 3).
- El nivel 3 es HOJA; si no hay nada que indicar, su "label" puede quedar VACÍO.
- JSON puro (sin viñetas ni Markdown).
`;

    const user = `
Texto base:
---
${text}
---

Devuelve SOLO el JSON del mapa mental siguiendo las REGLAS.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: system }, { text: user }] }],
      generationConfig: { temperature: 0.4 },
    });

    const raw = result?.response?.text?.() || "";
    const parsed = safeParseJSON(raw);
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
