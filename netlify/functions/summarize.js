--- START OF FILE summarize.js ---

// netlify/functions/summarize.js
// Retrocompatible: {file,text} y {files[],textChunks[]}
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
        body: JSON.stringify({ error: "Falta la API Key (GOOGLE_AI_API_KEY / VITE_API_KEY / GEMINI_API_KEY)." }),
      };
    }

    // Body
    let payload = {};
    try { payload = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) }; }

    const files = Array.isArray(payload.files) ? payload.files : (payload.file ? [payload.file] : []);
    const textChunks = Array.isArray(payload.textChunks) ? payload.textChunks : (payload.text ? [payload.text] : []);
    const summaryType = String(payload.summaryType || "short");

    if (!files.length && !textChunks.length) {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar al menos un archivo (pdf/imagen) o texto." }) };
    }

    // --- Normalización tipos ---
    const norm = (s = "") => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const s = norm(summaryType);
    let flavor = "short";
    if (s.includes("bullet") || s.includes("punto") || s.includes("viñet") || s.includes("vinet")) flavor = "bullet";
    else if (s.includes("long") || s.includes("largo") || s.includes("detall") || s.includes("extenso")) flavor = "long";

    // --- Instrucciones por tipo ---
    let styleInstruction = `Eres un asistente que resume en ESPAÑOL. Sé fiel al contenido, sin inventar. Tipo de resumen: "${summaryType}".`;

    if (flavor === "short") {
      styleInstruction += `
FORMATO (CORTO, SIN VIÑETAS):
- Devuelve 2–4 frases completas en un único bloque de texto.
- No uses guiones, numeración ni viñetas.`;
    } else if (flavor === "bullet") {
      styleInstruction += `
FORMATO (PUNTOS):
- Devuelve SÓLO viñetas con el símbolo "• " al inicio.
- Cada viñeta debe ser UNA frase. 5–10 viñetas máx.
- No numeres, no añadas títulos.`;
    } else if (flavor === "long") {
      styleInstruction += `
FORMATO (LARGO, SIN VIÑETAS):
- Extensión objetivo: 700–1300 palabras (mínimo 650 palabras).
- Devuelve entre 35 y 60 frases completas organizadas en 10 a 20 párrafos.
- Explica con mucho contexto, causas, consecuencias, ejemplos o comparaciones si aplica.
- No uses viñetas ni numeración. Solo párrafos corridos.
- Si el material fuente es breve, amplía con explicaciones, conexiones y y ejemplos prudentes para cumplir la longitud, sin inventar hechos que no estén en el texto.`;
    } else {
      styleInstruction += `
FORMATO (GENERAL):
- Usa párrafos breves o viñetas si ayudan, pero prioriza claridad.`;
    }

    const { GoogleGenerativeAI: GGA } = { GoogleGenerativeAI };
    const genAI = new GGA(apiKey);

    // --- Modelo con fallback ---
    const PREFERRED = process.env.GEMINI_MODEL_SUMMARY || "gemini-pro";
    let modelId = PREFERRED;
    if (/-latest$/.test(modelId)) modelId = "gemini-pro";
    const model = genAI.getGenerativeModel({ model: modelId });


    const parts = [{ text: styleInstruction }];

    // Texto (truncado)
    const MAX_TOK_TEXT = 18000;
    for (const t of textChunks) {
      if (!t) continue;
      parts.push({ text: String(t).slice(0, MAX_TOK_TEXT) });
    }

    // Archivos con límites
    const MAX_IMAGES = 6;
    const MAX_PART_BYTES = 3.5 * 1024 * 1024; // ~3.5MB
    let imageCount = 0;
    let hasPdf = false;

    for (const f of files) {
      let mimeType = String(f?.mimeType || "").toLowerCase();
      const base64 = String(f?.base64 || "");
      if (!mimeType || !base64) continue;

      const approxBytes = Math.floor(base64.length * 0.75);
      if (approxBytes > MAX_PART_BYTES) {
        return {
          statusCode: 413,
          body: JSON.stringify({ error: "Imagen demasiado grande tras compresión. Toma la foto en calidad media o súbela más pequeña." }),
        };
      }

      if (mimeType === "application/pdf") {
        if (hasPdf) continue;
        hasPdf = true;
        parts.push({ inlineData: { mimeType, data: base64 } });
        continue;
      }

      if (mimeType.startsWith("image/")) {
        if (imageCount >= MAX_IMAGES) continue;
        if (/^image\/(heic|heif)$/.test(mimeType)) mimeType = "image/heic";
        parts.push({ inlineData: { mimeType, data: base64 } });
        imageCount++;
      }
    }

    parts.push({
      text: `
Tarea: Resume todos los materiales anteriores (texto + archivos) de forma integrada en español.
No devuelvas JSON ni Markdown. Solo texto corrido (o viñetas si el tipo lo pide).
Validación final: si el tipo es "largo", asegúrate de cumplir el mínimo de 650 palabras. Si no llegas, añade contexto y ejemplos del material sin inventar.`.trim(),
    });

    // Cambiado de "// ++ Dar más espacio..." a un comentario válido "// Dar más espacio..."
    const isLong = flavor === "long";

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: isLong ? 8192 : 2048,
      },
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