// netlify/functions/summarize.js
// Acepta: { fileParts, summaryType } | { text, summaryType } | { summaryType, file:{base64,mimeType} }
// Formatos:
//  - short/corto/breve/express  -> párrafo 2–4 frases, sin viñetas
//  - bullets/puntos             -> • una frase por viñeta
//  - long/largo/extenso         -> objetivo 700–1300 palabras, muy detallado
//
// Usa gemini-2.0-flash por su mayor capacidad y calidad.

const { GoogleGenerativeAI } = require("@google/generative-ai");

function norm(x = "") {
  return String(x).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function pickFlavor(summaryType) {
  const s = norm(summaryType);
  if (/(short|corto|breve|express)/.test(s)) return "short";
  if (/(puntos|bullets|viñetas|vinyetas|lista|bullet)/.test(s)) return "bullets";
  if (/(long|largo|extenso|extensa|extendido|extendida|detallado|detallada|completo|completa)/.test(s)) return "long";
  return "default"; // Fallback para cualquier otro tipo
}

exports.handler = async (event) => {
  try {
    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.VITE_API_KEY || // En caso de que uses VITE_API_KEY para dev, aunque para Netlify es GOOGLE_AI_API_KEY
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Falta la API Key (GOOGLE_AI_API_KEY)." }) };
    }
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    let payload = {};
    try { payload = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido." }) }; }

    const { fileParts, text, summaryType, file } = payload; // Acepta múltiples formatos de entrada
    if (!summaryType) return { statusCode: 400, body: JSON.stringify({ error: "Falta summaryType." }) };

    const flavor = pickFlavor(summaryType);

    let styleInstruction = `
Eres un asistente que resume en ESPAÑOL. Sé fiel al contenido, sin inventar. Tono acorde a "${summaryType}".`;

    if (flavor === "short") {
      styleInstruction += `
FORMATO (CORTO / BREVE / EXPRESS, SIN VIÑETAS):
- Devuelve 2–4 frases completas en un único bloque de texto.
- No uses guiones, numeración ni viñetas.
- Resume lo esencial en pocas palabras.`;
    } else if (flavor === "bullets") {
      styleInstruction += `
FORMATO (POR PUNTOS / BULLETS):
- Devuelve SÓLO viñetas con el símbolo "• " al inicio.
- Cada viñeta debe ser UNA frase. 5–10 viñetas máx.
- No uses numeración ni texto corrido. Solo viñetas.`;
    } else if (flavor === "long") {
      // *** INSTRUCCIONES PARA RESUMEN LARGO (DOBLE/TRIPLE) ***
      styleInstruction += `
FORMATO (LARGO / EXTENSO / DETALLADO, SIN VIÑETAS):
- Extensión objetivo: 700–1300 palabras (mínimo 650 palabras).
- Devuelve entre 35 y 60 frases completas.
- Organiza el texto en 10 a 20 párrafos.
- Explica con mucho contexto, causas, consecuencias detalladas, múltiples ejemplos o comparaciones si aplica. Desglosa los temas en subsecciones lógicas con párrafos bien estructurados.
- No uses viñetas ni numeración. Solo párrafos corridos.
- No añadas títulos o etiquetas, solo el resumen estructurado en párrafos.
- Si el material fuente es breve, amplía con explicaciones profundas, conexiones relevantes y ejemplos prudentes para cumplir la longitud, sin inventar hechos que no estén en el texto. Prioriza la exhaustividad basada en el contenido.`;
    } else { // 'default'
      styleInstruction += `
FORMATO (GENERAL):
- Usa párrafos breves o viñetas si ayudan, pero prioriza claridad.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos gemini-2.0-flash por su mayor capacidad para resúmenes detallados
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const parts = [{ text: styleInstruction.trim() }];

    // Adaptación para manejar los diferentes formatos de entrada (fileParts, text, file)
    let hasContent = false;
    if (Array.isArray(fileParts) && fileParts.length) {
      for (const p of fileParts) {
        if (p?.text) parts.push({ text: String(p.text) });
        else if (p?.inlineData?.data && p?.inlineData?.mimeType) {
          parts.push({ inlineData: { data: p.inlineData.data, mimeType: p.inlineData.mimeType } });
        }
      }
      hasContent = true;
    } else if (typeof text === "string" && text.trim()) {
      parts.push({ text: text.trim() });
      hasContent = true;
    } else if (file?.base64 && file?.mimeType) {
      parts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
      hasContent = true;
    }

    if (!hasContent) {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar al menos un archivo o texto para resumir." }) };
    }

    // *** AGREGADA INSTRUCCIÓN DE VALIDACIÓN FINAL ***
    parts.push({
      text: `
Tarea: Resume todos los materiales anteriores (texto + archivos) de forma integrada en español.
No devuelvas JSON ni Markdown. Solo texto corrido (o viñetas si el tipo lo pide).
Validación final: si el tipo de resumen es "largo", asegúrate de cumplir el mínimo de 650 palabras. Si no llegas, añade contexto y ejemplos del material sin inventar, profundizando en los temas tratados.`.trim(),
    });

    const isLong = flavor === "long";
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.35,
        // *** maxOutputTokens ajustado para tipo 'long' usando gemini-2.0-flash ***
        // 8192 es un buen valor para pro si esperamos respuestas muy largas.
        // Flash usa 4096. Pro puede manejar más.
        maxOutputTokens: isLong ? 8192 : 1024,
        candidateCount: 1, // Asegura una única respuesta
      },
    });

    const out = result?.response?.text?.() || "";
    const summary = String(out || "").trim();

    // Pequeña validación extra en el backend para longitud mínima (solo advertencia)
    if (isLong && summary.split(/\s+/).length < 600 && summary.split(/\s+/).length > 50) { // Un poco menos de 650 para flexibilidad
      console.warn(`[summarize] El resumen 'largo' fue más corto de lo esperado (${summary.split(/\s+/).length} palabras). Se solicitó un mínimo de 650.`);
    }

    if (!summary) {
      console.error("[summarize] Respuesta vacía del modelo");
      return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió contenido." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (error) {
    console.error("[summarize] ERROR:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error?.message || "Error interno en summarize" }) };
  }
};