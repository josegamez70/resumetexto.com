// netlify/functions/mindmap.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

function id() { return crypto.randomBytes(6).toString("hex"); }

function safeParseJSON(s) {
  try { return JSON.parse(s); } catch {}
  // Intentar extraer el primer bloque JSON
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)); } catch {}
  }
  return null;
}

function ensureSubpoints(node, level = 0) {
  if (!node || typeof node !== "object") return;
  if (!Array.isArray(node.children)) node.children = [];

  // Para niveles 1 y 2: garantizar al menos 2 subpuntos
  const mustHave = (level === 0) ? 3 : (level <= 2 ? 2 : 0);
  while (node.children.length < mustHave) {
    node.children.push({ id: id(), label: "Detalle", note: "", children: [] });
  }

  // Recurse (hasta nivel 3 para no crecer infinito)
  if (level < 3) {
    node.children.forEach((c) => ensureSubpoints(c, level + 1));
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

    const system = `
Genera un MAPA MENTAL en formato JSON PURO (sin texto adicional) con esta estructura:

{
  "root": {
    "id": "string",
    "label": "Tema central",
    "note": "opcional",
    "children": [
      {
        "id": "string",
        "label": "Idea principal",
        "note": "opcional",
        "children": [
          { "id": "string", "label": "Subpunto 1", "note": "opcional", "children": [] },
          { "id": "string", "label": "Subpunto 2", "note": "opcional", "children": [] }
        ]
      }
    ]
  }
}

REGLAS:
- Español.
- Cada nodo en niveles 1 y 2 DEBE tener SUBPUNTOS (mínimo 2 hijos).
- Profundidad máxima: 3 niveles bajo la raíz (root -> ideas -> subpuntos -> detalles).
- Nada de viñetas ni Markdown, SOLO JSON.
- "id" debe ser un identificador corto (si no sabes, usa "auto").
`;

    const user = `
Documento base (texto):
---
${text}
---

Devuelve SOLO el JSON con el mapa mental siguiendo las REGLAS.`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: system }, { text: user }] }
      ],
      generationConfig: { temperature: 0.4 }
    });

    const raw = result?.response?.text?.() || "";
    const parsed = safeParseJSON(raw);
    if (!parsed || !parsed.root) {
      return { statusCode: 500, body: JSON.stringify({ error: "No se pudo parsear el JSON del mapa mental." }) };
    }

    // Normalizar ids y asegurar subpuntos
    const assignIds = (n) => {
      if (!n.id || typeof n.id !== "string" || n.id === "auto") n.id = id();
      if (!Array.isArray(n.children)) n.children = [];
      n.children.forEach(assignIds);
      return n;
    };
    assignIds(parsed.root);
    ensureSubpoints(parsed.root, 0);

    return { statusCode: 200, body: JSON.stringify({ mindmap: parsed }) };
  } catch (err) {
    console.error("[mindmap] ERROR:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error interno en mindmap" }) };
  }
};
