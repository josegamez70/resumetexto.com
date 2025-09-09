// netlify/functions/present.js
// Genera presentación (mapa conceptual jerárquico). Fuerza JSON y hace parseo robusto.

const { GoogleGenerativeAI } = require("@google/generative-ai");

function safeJsonParseObject(s) {
  // Limpia fences ```json y extrae primer objeto { ... }
  const cleaned = String(s || "").replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const a = cleaned.indexOf("{"), b = cleaned.lastIndexOf("}");
  if (a !== -1 && b > a) {
    const slice = cleaned.slice(a, b + 1);
    try { return JSON.parse(slice); } catch {}
  }
  throw new Error("La IA no devolvió JSON válido.");
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };

    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.VITE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Falta API Key" }) };

    let payload;
    try { payload = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) }; }

    const summaryText = String(payload.summaryText || "");
    const presentationType = String(payload.presentationType || "Extensive");
    const preferModel = String(payload.preferModel || "gemini-2.5-flash");
    if (!summaryText) return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { summaryText }." }) };

    const MAX = 20000;
    const safe = summaryText.length > MAX ? summaryText.slice(0, MAX) : summaryText;

    const rules = {
      Extensive: { title: "Extensa (en detalle)", sectionsMax: 6, subsectionsMaxPerLevel: 4, maxDepth: 3, contentLen: "2–3 frases por sección o subsección", extra: "Lenguaje claro, técnico cuando sea necesario." },
      Complete:  { title: "Completa (+50% más detalle que Extensa)", sectionsMax: 6, subsectionsMaxPerLevel: 5, maxDepth: 4, contentLen: "3–4 frases por sección o subsección", extra: "Amplía causas, consecuencias y ejemplos." },
      Kids:      { title: "Para Niños", sectionsMax: 6, subsectionsMaxPerLevel: 3, maxDepth: 3, contentLen: "1–2 frases simples por sección o subsección", extra: "Lenguaje muy sencillo, positivo, con emojis aptos." },
    }[presentationType] || { title: "Extensa (en detalle)", sectionsMax: 6, subsectionsMaxPerLevel: 4, maxDepth: 3, contentLen: "2–3 frases por sección o subsección", extra: "" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: preferModel });

    const prompt = `
Genera un "Mapa conceptual" (desplegables) en ESPAÑOL a partir del TEXTO.
Estilo: ${rules.title}
- Máximo ${rules.sectionsMax} secciones.
- Máximo ${rules.subsectionsMaxPerLevel} "subsections" por nivel.
- Profundidad máxima: ${rules.maxDepth} niveles (Sección = nivel 1).
- Longitud: ${rules.contentLen}.
- ${rules.extra}

Muy importante:
- La clave "subsections" puede aparecer en cualquier nivel hasta la profundidad ${rules.maxDepth}.
- Evita listas muy largas en un mismo nivel; reparte jerárquicamente.
- Devuelve EXCLUSIVAMENTE JSON válido (sin comentarios/explicaciones/bloques).

Formato EXACTO:
{
  "presentationData": {
    "title": "Título de la presentación",
    "sections": [
      {
        "emoji": "📌",
        "title": "Sección",
        "content": "Párrafo corto con ideas clave.",
        "subsections": [
          {
            "emoji": "🔹",
            "title": "Subsección",
            "content": "Detalle relevante.",
            "subsections": [
              { "emoji": "•", "title": "Sub-subsección", "content": "Detalle adicional." }
            ]
          }
        ]
      }
    ]
  }
}

TEXTO:
${safe}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.45, responseMimeType: "application/json" },
    });

    const raw = String(result?.response?.text?.() || "").trim();
    const data = safeJsonParseObject(raw);

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
  } catch (err) {
    console.error("[present] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en present" }) };
  }
};
