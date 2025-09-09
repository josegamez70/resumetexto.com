// netlify/functions/summarize.js
// Resumen con Gemini 2.5-flash. Acepta: fileParts | file(base64) | textChunks | text.
// Devuelve { summary: string }. “long” sale en párrafos (sin viñetas).

const { GoogleGenerativeAI } = require("@google/generative-ai");

function norm(x = "") {
  return String(x).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
function pickFlavor(summaryType) {
  const s = norm(summaryType);
  if (/(short|corto|breve|express)/.test(s)) return "short";
  if (/(puntos|bullets|viñetas|vinyetas|lista|bullet)/.test(s)) return "bullets";
  if (/(long|largo|extenso|extensa|extendido|extendida|detallado|detallada|completo|completa)/.test(s)) return "long";
  return "default";
}

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY" }) };
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) }; }

    const { fileParts, text, textChunks, summaryType, file, preferModel } = body;
    if (!summaryType) return { statusCode: 400, body: JSON.stringify({ error: "Falta summaryType" }) };

    const flavor = pickFlavor(summaryType);
    let style = `Eres un asistente que resume en ESPAÑOL. Sé fiel al contenido, sin inventar.`;

    if (flavor === "short") {
      style += `\nFORMATO CORTO: 2–4 frases, un único bloque. Sin viñetas ni títulos.`;
    } else if (flavor === "bullets") {
      style += `\nFORMATO PUNTOS: solo viñetas con "• " al inicio. 5–10 viñetas, 1 frase por viñeta. No numeres ni añadas títulos.`;
    } else if (flavor === "long") {
      style += `\nFORMATO LARGO: 6–12 frases en 2–4 párrafos. Sin viñetas, sin numeración, sin títulos. Solo prosa corrida.`;
    } else {
      style += `\nFORMATO GENERAL: claro y conciso. Puedes usar párrafos breves si ayudan.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = String(preferModel || "gemini-2.5-flash");
    const model = genAI.getGenerativeModel({ model: modelName });

    const parts = [{ text: style.trim() }];

    if (Array.isArray(fileParts) && fileParts.length) {
      for (const p of fileParts) {
        if (p?.text) parts.push({ text: String(p.text) });
        else if (p?.inlineData?.data && p?.inlineData?.mimeType) {
          parts.push({ inlineData: { data: p.inlineData.data, mimeType: p.inlineData.mimeType } });
        }
      }
    } else if (file?.base64 && file?.mimeType) {
      parts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
    } else if (Array.isArray(textChunks) && textChunks.length) {
      for (const chunk of textChunks) parts.push({ text: String(chunk) });
    } else if (typeof text === "string" && text.trim()) {
      parts.push({ text: text.trim() });
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta 'fileParts' o 'file' o 'text/textChunks'." }) };
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.35 },
    });

    const summary = String(result?.response?.text?.() || "").trim();
    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (error) {
    console.error("[summarize] ERROR:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Error interno en summarize" }) };
  }
};
