// netlify/functions/present.js
// Presentación (mapa conceptual) optimizada para evitar timeouts en Netlify.

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Parseo robusto de objeto JSON (limpia ```json ... ``` y extrae { ... })
function safeJsonParseObject(s) {
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
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.VITE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta API Key" }) };
    }

    let payload;
    try { payload = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) }; }

    const summaryText = String(payload.summaryText || "");
    const presentationType = String(payload.presentationType || "Extensive");
    const preferModel = String(payload.preferModel || "gemini-2.5-flash");
    if (!summaryText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { summaryText }." }) };
    }

    // 🔹 Recorta input para acelerar (y evitar timeout)
    const MAX_IN = 12000;
    const safeIn = summaryText.length > MAX_IN ? summaryText.slice(0, MAX_IN) : summaryText;

    // 🔹 Reglas con límites más conservadores (responde antes)
    const rules =
      {
        Extensive: { title: "Extensa (en detalle)", sectionsMax: 5, subsectionsMaxPerLevel: 4, maxDepth: 3, contentLen: "2–3 frases por nodo", extra: "" },
        Complete:  { title: "Completa",                sectionsMax: 5, subsectionsMaxPerLevel: 4, maxDepth: 3, contentLen: "2–3 frases por nodo", extra: "" },
        Kids:      { title: "Para Niños",              sectionsMax: 5, subsectionsMaxPerLevel: 3, maxDepth: 3, contentLen: "1–2 frases simples por nodo", extra: "Usa emojis adecuados." },
      }[presentationType] ||
      { title: "Extensa (en detalle)", sectionsMax: 5, subsectionsMaxPerLevel: 4, maxDepth: 3, contentLen: "2–3 frases por nodo", extra: "" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: preferModel });

    const prompt = `
Genera un "Mapa conceptual" (desplegables jerárquicos) en ESPAÑOL a partir del TEXTO.
Estilo: ${rules.title}
- Máximo ${rules.sectionsMax} secciones.
- Máximo ${rules.subsectionsMaxPerLevel} elementos "subsections" por cada nivel.
- Profundidad máxima: ${rules.maxDepth} niveles.
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
        "content": "Párrafo breve con ideas clave.",
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

TEXTO (recortado a ${MAX_IN} chars):
${safeIn}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
        // 🔹 Limita la salida para ganar tiempo
        maxOutputTokens: 1200,
      },
    });

    const raw = String(result?.response?.text?.() || "").trim();
    const data = safeJsonParseObject(raw);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("[present] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en present" }) };
  }
};
