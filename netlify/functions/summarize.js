// netlify/functions/summarize.js
// Retrocompatible:
// - acepta { file, text } (formato antiguo)
// - acepta { files: [{base64,mimeType},...], textChunks: [ ... ] } (formato nuevo)
// Estilos restaurados: Short / Bullets / Long

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const apiKey =
      process.env.GOOGLE_AI_API_KEY ||
      process.env.VITE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta la API Key (GOOGLE_AI_API_KEY / VITE_API_KEY / GEMINI_API_KEY)." }),
      };
    }

    // Parse body
    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) };
    }

    // Soportar ambos formatos
    // - Antiguo: { file: {base64,mimeType} , text: "..." }
    // - Nuevo: { files: [...], textChunks: [...] }
    const files = Array.isArray(payload.files)
      ? payload.files
      : (payload.file ? [payload.file] : []);

    const textChunks = Array.isArray(payload.textChunks)
      ? payload.textChunks
      : (payload.text ? [payload.text] : []);

    const summaryType = String(payload.summaryType || "short");

    if (!files.length && !textChunks.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Debes enviar al menos un archivo (pdf/imagen) o texto." }),
      };
    }

    // --------- Estilos restaurados (Short / Bullets / Long) ----------
    function norm(x = "") {
      return String(x).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    }
    const flavor = (() => {
      const s = norm(summaryType);
      if (/(short|corto|breve|express)/.test(s)) return "short";
      if (/(puntos|bullets|viñetas|vinyetas|lista|bullet)/.test(s)) return "bullets";
      if (/(long|largo|extenso|extensa|extendido|extendida|detallado|detallada)/.test(s)) return "long";
      // Compat alias "detailed" -> trátalo como long
      if (/(detailed|detalle|detallado|detallada)/.test(s)) return "long";
      return "short";
    })();

    let styleInstruction = `
Eres un asistente que resume en ESPAÑOL. Sé fiel al contenido, sin inventar. Tono acorde a "${summaryType}".`.trim();

    if (flavor === "short") {
      styleInstruction += `
      
FORMATO (CORTO, SIN VIÑETAS):
- Devuelve 5–7 frases en un único bloque de texto.
- No uses guiones, numeración ni viñetas.`;
    } else if (flavor === "bullets") {
      styleInstruction += `
      
FORMATO (POR PUNTOS):
- Devuelve SÓLO viñetas con el símbolo "• " al inicio.
- Cada viñeta debe ser UNA frase. 5–10 viñetas máx.
- No numeres, no añadas títulos.`;
    } else {
      // long
      styleInstruction += `
      
FORMATO (LARGO, SIN VIÑETAS):
- Devuelve 6–12 frases completas repartidas en 2–4 párrafos.
- No uses guiones, numeración ni viñetas.
- No añadas títulos o etiquetas.`;
    }

    // Modelo
    const { GoogleGenerativeAI: GGA } = { GoogleGenerativeAI };
    const genAI = new GGA(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construcción de partes: texto + binarios
    const parts = [{ text: styleInstruction }];

    // Añadir textos (si los hay)
    const MAX_TOK_TEXT = 18000;
    for (const t of textChunks) {
      if (!t) continue;
      parts.push({ text: String(t).slice(0, MAX_TOK_TEXT) });
    }

    // Añadir archivos (si los hay)
    for (const f of files) {
      const mimeType = String(f?.mimeType || "").toLowerCase();
      const data = String(f?.base64 || "");
      if (!mimeType || !data) continue;

      // Normalización suave de HEIC/HEIF (iOS)
      const normalizedMime = /image\/(heic|heif)/.test(mimeType) ? "image/heic" : mimeType;

      parts.push({
        inlineData: { mimeType: normalizedMime, data },
      });
    }

    // Instrucción final
    parts.push({
      text: `
Tarea: Resume todos los materiales anteriores (texto + archivos) de forma integrada en español.
No devuelvas JSON ni Markdown, solo texto corrido (o viñetas si el tipo lo pide).`.trim(),
    });

    // Llamada al modelo
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.35 },
    });

    // Extraer texto
    const summary = String(result?.response?.text?.() || "").trim();

    if (!summary) {
      // Log para ayudarte a depurar en Netlify
      console.error("[summarize] Respuesta vacía del modelo:", JSON.stringify(result, null, 2).slice(0, 2000));
      return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió contenido." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (err) {
    console.error("[summarize] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en summarize" }) };
  }
};
