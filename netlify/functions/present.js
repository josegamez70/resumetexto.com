// netlify/functions/present.js
// Genera "Mapa conceptual" a partir de { summaryText, presentationType } con subsections RECURSIVAS
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

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Body vacío. Envía { summaryText, presentationType }" }) };
    }

    let payload;
    try { payload = JSON.parse(event.body); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) }; }

    const summaryText = String(payload.summaryText || "");
    const presentationType = String(payload.presentationType || "Extensive"); // Extensive | Complete | Kids
    if (!summaryText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { summaryText: string }." }) };
    }

    const MAX = 10000;
    const safe = summaryText.length > MAX ? summaryText.slice(0, MAX) : summaryText;

    // Reglas por tipo (incluye profundidad máxima)
    const rules = {
      Extensive: {
        title: "Extensa (en detalle)",
        sectionsMax: 6,
        subsectionsMaxPerLevel: 4,
        maxDepth: 3, // Sección > Sub > Sub-Sub (hasta 3 niveles)
        contentLen: "2–3 frases por sección o subsección",
        extra: "Lenguaje claro, técnico cuando sea necesario.",
      },
      Complete: {
        title: "Completa (+50% más detalle que Extensa)",
        sectionsMax: 6,
        subsectionsMaxPerLevel: 5,
        maxDepth: 4, // Sección > Sub > Sub-Sub > Sub-Sub-Sub
        contentLen: "3–4 frases por sección o subsección",
        extra: "Amplía causas, consecuencias y ejemplos concretos.",
      },
      Kids: {
        title: "Para Niños",
        sectionsMax: 6,
        subsectionsMaxPerLevel: 3,
        maxDepth: 2, // Sección > Sub
        contentLen: "1–2 frases simples por sección o subsección",
        extra: "Lenguaje muy sencillo, positivo, con emojis aptos.",
      },
    }[presentationType] || {
      title: "Extensa (en detalle)",
      sectionsMax: 6,
      subsectionsMaxPerLevel: 4,
      maxDepth: 3,
      contentLen: "2–3 frases por sección o subsección",
      extra: "",
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
Genera un "Mapa conceptual" (desplegables y subdesplegables) en ESPAÑOL a partir del TEXTO.
Estilo seleccionado: ${rules.title}.
- Máximo ${rules.sectionsMax} secciones.
- Máximo ${rules.subsectionsMaxPerLevel} elementos "subsections" por cada nivel.
- Profundidad máxima: ${rules.maxDepth} niveles (Sección = nivel 1).
- Longitud de contenido: ${rules.contentLen}.
- ${rules.extra}

Muy importante:
- La clave "subsections" puede aparecer **en cualquier nivel** hasta la profundidad ${rules.maxDepth}.
- Evita listas muy largas en un mismo nivel; reparte jerárquicamente.
- Devuelve **EXCLUSIVAMENTE** JSON válido (sin comentarios/explicaciones/bloques \`\`\`).

Formato EXACTO (ejemplo con recursividad):
{
  "presentationData": {
    "title": "Título de la presentación",
    "sections": [
      {
        "emoji": "📌",
        "title": "Sección",
        "content": "Párrafo corto con ideas clave.",
        "subsections": [
          {
            "emoji": "🔹",
            "title": "Subsección",
            "content": "Detalle relevante.",
            "subsections": [
              {
                "emoji": "•",
                "title": "Sub-subsección",
                "content": "Detalle adicional.",
                "subsections": [
                  {
                    "emoji": "·",
                    "title": "Sub-sub-subsección",
                    "content": "Detalle si aplica."
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

TEXTO:
${safe}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.45 },
    });

    let raw = result.response.text().trim();

    // Parse robusto
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      try {
        data = JSON.parse(cleaned);
      } catch {
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          const slice = cleaned.slice(start, end + 1);
          try {
            data = JSON.parse(slice);
          } catch {
            console.error("[present] JSON inválido. raw:", raw);
            return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió JSON válido.", raw: raw.slice(0, 5000) }) };
          }
        } else {
          console.error("[present] No se encontró bloque JSON. raw:", raw);
          return { statusCode: 500, body: JSON.stringify({ error: "La IA no devolvió JSON válido.", raw: raw.slice(0, 5000) }) };
        }
      }
    }

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
