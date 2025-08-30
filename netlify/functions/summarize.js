// Acepta: { fileParts, summaryType } | { text, summaryType } | { summaryType, file:{base64,mimeType} }
// Formatos:
//  - corto/breve/express  -> párrafo 2–4 frases, sin viñetas
//  - puntos/bullets       -> • una frase por viñeta
//  - largo/long/extenso   -> 6–12 frases en 2–4 párrafos, sin viñetas

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
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY" }) };
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) }; }

    const { fileParts, text, summaryType, file } = body;
    if (!summaryType) return { statusCode: 400, body: JSON.stringify({ error: "Falta summaryType" }) };

    const flavor = pickFlavor(summaryType);

    let styleInstruction = `
Eres un asistente que resume en ESPAÑOL. Sé fiel al contenido, sin inventar. Tono acorde a "${summaryType}".`;

    if (flavor === "short") {
      styleInstruction += `
FORMATO (CORTO, SIN VIÑETAS):
- Devuelve 2–4 frases completas en un único bloque de texto.
- No uses guiones, numeración ni viñetas.`;
    } else if (flavor === "bullets") {
      styleInstruction += `
FORMATO (PUNTOS):
- Devuelve SÓLO viñetas con el símbolo "• " al inicio.
- Cada viñeta debe ser UNA frase. 5–10 viñetas máx.
- No numeres, no añadas títulos.`;
    } else if (flavor === "long") {
      styleInstruction += `
FORMATO (LARGO, SIN VIÑETAS):
- Devuelve 6–12 frases completas repartidas en 2–4 párrafos.
- No uses guiones, numeración ni viñetas.
- No añadas títulos o etiquetas.`;
    } else {
      styleInstruction += `
FORMATO (GENERAL):
- Usa párrafos breves o viñetas si ayudan, pero prioriza claridad.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const parts = [{ text: styleInstruction.trim() }];

    if (Array.isArray(fileParts) && fileParts.length) {
      for (const p of fileParts) {
        if (p?.text) parts.push({ text: String(p.text) });
        else if (p?.inlineData?.data && p?.inlineData?.mimeType) {
          parts.push({ inlineData: { data: p.inlineData.data, mimeType: p.inlineData.mimeType } });
        }
      }
    } else if (typeof text === "string" && text.trim()) {
      parts.push({ text: text.trim() });
    } else if (file?.base64 && file?.mimeType) {
      parts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta 'fileParts' o 'text' o 'file'." }) };
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.35 },
    });

    const out = result?.response?.text?.() || "";
    const summary = String(out || "").trim();

    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (error) {
    console.error("[summarize] ERROR:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Error interno en summarize" }) };
  }
};
