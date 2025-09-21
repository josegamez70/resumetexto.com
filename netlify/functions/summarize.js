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
      return { statusCode: 500, body: JSON.stringify({ error: "Falta la API Key (GOOGLE_AI_API_KEY / VITE_API_KEY / GEMINI_API_KEY)." }) };
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
FORMATO (CORTO / BREVE / EXPRESS):
- Devuelve entre 2 y 4 frases.
- Solo texto corrido, sin viñetas ni numeración.
- Resume lo esencial en pocas palabras.`;
    } else if (flavor === "long") {
      // *** MODIFICADO AQUÍ PARA QUE SEA MÁS LARGO Y DETALLADO ***
      styleInstruction += `
FORMATO (LARGO / EXTENSO / DETALLADO):
- Extensión objetivo: 700–1300 palabras (mínimo 650 palabras).
- Devuelve entre 35 y 60 frases completas.
- Organiza el texto en 10 a 20 párrafos.
- Explica con mucho contexto, causas, consecuencias detalladas, múltiples ejemplos o comparaciones si aplica.
- No uses viñetas ni numeración. Solo párrafos corridos.
- Si el material fuente es breve, amplía con explicaciones profundas, conexiones relevantes y ejemplos prudentes para cumplir la longitud, sin inventar hechos que no estén en el texto. Prioriza la exhaustividad basada en el contenido.`;
    } else { // Este 'else' cubre el flavor === "bullet"
      styleInstruction += `
FORMATO (POR PUNTOS / BULLETS):
- Devuelve de 5 a 10 frases en viñetas.
- Cada viñeta comienza con "• " y contiene UNA sola idea.
- No uses numeración ni texto corrido. Solo viñetas.`;
    }

    const { GoogleGenerativeAI: GGA } = { GoogleGenerativeAI };
    const genAI = new GGA(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
          body: JSON.stringify({
            error: "Imagen demasiado grande tras compresión. Toma la foto en calidad media o súbela más pequeña.",
          }),
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
Validación final: si el tipo es "largo", asegúrate de cumplir el mínimo de 650 palabras. Si no llegas, añade contexto y ejemplos del material sin inventar, profundizando en los temas tratados.`.trim(), // *** MODIFICADO AQUÍ LA VALIDACIÓN FINAL ***
    });

    const isLong = flavor === "long"; // Detectar si el flavor es "long"
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.35, // Mantener la temperatura si es lo que prefieres
        maxOutputTokens: isLong ? 4096 : 1024, // *** RE-INTRODUCIDO maxOutputTokens para 'long' ***
        candidateCount: 1, // Añadido para asegurar una única respuesta
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