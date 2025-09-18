// netlify/functions/summarize.js
// Acepta arrays: { summaryType, files: [{base64,mimeType}, ...], textChunks: [string, ...] }
// Reglas: o 1 PDF o hasta 6 imágenes (sin mezclar)

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

    let body = {};
    try { body = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) }; }

    const summaryType = String(body.summaryType || "short");
    const files = Array.isArray(body.files) ? body.files : (body.file ? [body.file] : []);
    const textChunks = Array.isArray(body.textChunks) ? body.textChunks : (body.text ? [body.text] : []);

    if (!files.length && !textChunks.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar al menos un archivo (pdf/imagen) o texto." }) };
    }

    // Validación: 1 PDF o hasta 6 imágenes, sin mezclar
    const pdfs   = files.filter(f => String(f?.mimeType || "").toLowerCase() === "application/pdf");
    const images = files.filter(f => String(f?.mimeType || "").toLowerCase().startsWith("image/"));

    if (pdfs.length > 0 && images.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No mezcles PDF con fotos. Sube 1 PDF o hasta 6 fotos." }) };
    }
    if (pdfs.length > 1) {
      return { statusCode: 400, body: JSON.stringify({ error: "Solo se admite 1 PDF." }) };
    }
    if (pdfs.length === 0 && images.length > 6) {
      return { statusCode: 400, body: JSON.stringify({ error: "Máximo 6 fotos." }) };
    }

    // Prompt por tipo de resumen
    function norm(x = "") {
      return String(x).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    }
    const flavor = (() => {
      const s = norm(summaryType);
      if (/(short|corto|breve|express)/.test(s)) return "short";
      if (/(puntos|bullets|viñetas|vinyetas|lista|bullet)/.test(s)) return "bullets";
      if (/(long|largo|extenso|extensa|extendido|extendida|detallado|detallada|completo|completa)/.test(s)) return "long";
      return "default";
    })();

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

    const { GoogleGenerativeAI: GGA } = { GoogleGenerativeAI };
    const genAI = new GGA(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const parts = [{ text: styleInstruction.trim() }];

    // Añadimos los textos (troceados suave por seguridad)
    const MAX_TOK_TEXT = 18000;
    for (const t of textChunks) {
      if (!t) continue;
      parts.push({ text: String(t).slice(0, MAX_TOK_TEXT) });
    }

    // Añadimos binarios (pdfs o imágenes)
    for (const f of files) {
      const mimeType = String(f?.mimeType || "");
      const data = String(f?.base64 || "");
      if (!mimeType || !data) continue;
      parts.push({ inlineData: { mimeType, data } });
    }

    // Instrucción final
    parts.push({
      text: `
Tarea: Resume todos los materiales anteriores (texto + archivos) de forma integrada.
Formato de salida: texto plano en español.
No devuelvas JSON ni Markdown, solo texto corrido (puedes usar viñetas si el tipo lo pide).`.trim(),
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.35 },
    });

    const summary = String(result?.response?.text?.() || "").trim();
    if (!summary) {
      return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió contenido." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (err) {
    console.error("[summarize] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en summarize" }) };
  }
};
