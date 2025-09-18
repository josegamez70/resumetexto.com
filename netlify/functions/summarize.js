// netlify/functions/summarize.js
// Retrocompatible:
// - Acepta { file, text } (formato antiguo)
// - Acepta { files: [{base64,mimeType},...], textChunks: [ ... ] } (formato nuevo)
// Tipos soportados: short | long | bullet

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
        body: JSON.stringify({
          error:
            "Falta la API Key (GOOGLE_AI_API_KEY / VITE_API_KEY / GEMINI_API_KEY). Configúrala en Netlify → Site settings → Environment.",
        }),
      };
    }

    // Parse body
    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) };
    }

    // Formatos soportados
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

    // --------- Mapeo de tipos (short | long | bullet) ----------
    const norm = (s = "") =>
      String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const s = norm(summaryType);
    let flavor = "short";
    if (s.includes("bullet") || s.includes("punto") || s.includes("vinet") || s.includes("viñet")) {
      flavor = "bullet";
    } else if (s.includes("long") || s.includes("largo") || s.includes("detall")) {
      flavor = "long";
    } else {
      flavor = "short";
    }

    let styleInstruction = `Eres un asistente que resume en ESPAÑOL. Sé fiel al contenido, sin inventar. Tipo de resumen: "${summaryType}".`;

    if (flavor === "short") {
      styleInstruction += `
FORMATO (CORTO, SIN VIÑETAS):
- Devuelve 5–7 frases en un único bloque de texto.
- No uses guiones, numeración ni viñetas.`;
    } else if (flavor === "long") {
      styleInstruction += `
FORMATO (LARGO, SIN VIÑETAS):
- Devuelve 8–14 frases completas repartidas en 2–4 párrafos.
- No uses guiones, numeración ni viñetas.
- No añadas títulos o etiquetas.`;
    } else {
      // bullet
      styleInstruction += `
FORMATO (POR PUNTOS):
- Devuelve SÓLO viñetas con el símbolo "• " al inicio.
- Cada viñeta debe ser UNA frase. 5–12 viñetas máx.
- No numeres, no añadas títulos.`;
    }

    // Modelo único
    const { GoogleGenerativeAI: GGA } = { GoogleGenerativeAI };
    const genAI = new GGA(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construcción de partes: primero instrucciones, luego textos, luego binarios
    const parts = [{ text: styleInstruction }];

    // Textos (truncado seguro)
    const MAX_TOK_TEXT = 18000;
    for (const t of textChunks) {
      if (!t) continue;
      parts.push({ text: String(t).slice(0, MAX_TOK_TEXT) });
    }

    // Archivos (máximo 6 imágenes; 1 PDF; HEIC/HEIF normalizado)
    const MAX_IMAGES = 6;
    let imageCount = 0;
    let hasPdf = false;

    for (const f of files) {
      let mimeType = String(f?.mimeType || "").toLowerCase();
      const data = String(f?.base64 || "");
      if (!mimeType || !data) continue;

      if (mimeType === "application/pdf") {
        if (hasPdf) continue; // solo 1 PDF
        hasPdf = true;
        parts.push({ inlineData: { mimeType, data } });
        continue;
      }

      if (mimeType.startsWith("image/")) {
        if (imageCount >= MAX_IMAGES) continue;
        if (/^image\/(heic|heif)$/.test(mimeType)) mimeType = "image/heic";
        parts.push({ inlineData: { mimeType, data } });
        imageCount++;
        continue;
      }

      // Otros tipos los ignoramos silenciosamente
    }

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

    const summary = String(result?.response?.text?.() || "").trim();

    if (!summary) {
      console.error("[summarize] Respuesta vacía del modelo");
      return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió contenido." }) };
    }

    return { statusCode: 200, body: JSON.stringify({ summary }) };
  } catch (err) {
    console.error("[summarize] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en summarize" }) };
  }
};
