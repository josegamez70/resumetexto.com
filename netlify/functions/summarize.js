// netlify/functions/summarize.js
// Acepta cualquiera de estos bodies:
//   { fileParts, summaryType }   // estilo antiguo (fileParts: [{text:..}|{inlineData:{mimeType,data}}])
//   { text, summaryType }        // solo texto
//   { summaryType, file: { name, mimeType, base64 } }  // un archivo en base64 (imagen/PDF)
// Formatea según summaryType: "corto"/"short" => párrafo sin viñetas; "puntos"/"bullets" => • por frase.

const { GoogleGenerativeAI } = require("@google/generative-ai");

function norm(x = "") {
  return String(x).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}
function pickFlavor(summaryType) {
  const s = norm(summaryType);
  if (/(short|corto|breve|express)/.test(s)) return "short";
  if (/(puntos|bullets|viñetas|vinyetas|lista|bullet)/.test(s)) return "bullets";
  return "default";
}

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY en entorno." }) };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) }; }

    const { fileParts, text, summaryType, file } = body;
    if (!summaryType) {
      return { statusCode: 400, body: JSON.stringify({ error: "Falta summaryType" }) };
    }

    const flavor = pickFlavor(summaryType);

    // Instrucciones de formato según flavor
    let styleInstruction = `
Eres un asistente que resume en ESPAÑOL. Sé fiel al contenido, sin inventar.
Adecúa el tono al tipo de resumen (${summaryType}).`;
    if (flavor === "short") {
      styleInstruction += `
FORMATO (RESUMEN CORTO, SIN VIÑETAS):
- Devuelve 2–4 frases completas en un único bloque de texto.
- No uses guiones, numeración ni viñetas.
- No añadas títulos, etiquetas ni resúmenes extra.`;
    } else if (flavor === "bullets") {
      styleInstruction += `
FORMATO (RESUMEN EN PUNTOS):
- Devuelve SÓLO viñetas con el símbolo "• " al inicio.
- Cada viñeta debe ser UNA frase. 5–10 viñetas máx.
- No numeres, no añadas títulos.`;
    } else {
      styleInstruction += `
FORMATO (GENERAL):
- Si procede, usa párrafos breves o viñetas, priorizando claridad.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Construir parts
    const parts = [{ text: styleInstruction.trim() }];

    if (Array.isArray(fileParts) && fileParts.length) {
      // Estilo antiguo: dejamos pasar los parts tal cual
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
      generationConfig: { temperature: 0.3 },
    });

    const out = result?.response?.text?.() || "";
    const summary = String(out || "").trim();

    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (error) {
    console.error("[summarize] ERROR:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Error interno en summarize" }) };
  }
};
