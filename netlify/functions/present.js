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

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) };
    }

    const summaryText = String(payload.summaryText || "");
    const presentationType = String(payload.presentationType || "Extensive");
    if (!summaryText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { summaryText: string }." }) };
    }

    const MAX = 10000;
    const safe = summaryText.length > MAX ? summaryText.slice(0, MAX) : summaryText;

    // --- Reglas base ---
    const rules = {
      Extensive: {
        title: "Extensa (en detalle)",
        sectionsMax: 6,
        subsectionsMaxPerLevel: 4,
        maxDepth: 3,
        contentLen: "2–3 frases por sección o subsección",
        extra: "Lenguaje claro, técnico cuando sea necesario.",
      },
      Complete: {
  title: "Completa (+50% más detalle)",
  sectionsMax: 7,
  subsectionsMaxPerLevel: 6,
  maxDepth: 5,
  contentLen: "5–7 frases por sección o subsección",
  extra: "Define, explica por qué importa, cómo funciona y da 1–2 ejemplos breves. Incluye riesgos/limitaciones y recomendaciones claras sin extenderse.",
},
Integro: {
  title: "Íntegro (muy completo, máximo alcance)",
  sectionsMax: 8,                    // más amplitud
  subsectionsMaxPerLevel: 9,         // más ramificación por nivel
  maxDepth: 6,                       // permite capas extra (sub-sub y más)
  contentLen: "8–12 frases por sección o subsección",
  extra: "Cobertura máxima y no redundante: definición, contexto/antecedentes, causas, consecuencias, comparativas, contraejemplos, errores frecuentes, mini-casos, FAQ y glosario cuando aporte valor; referencias/normativa SOLO si el texto original las incluye.",
},

      Kids: {
        title: "Para Niños",
        sectionsMax: 6,
        subsectionsMaxPerLevel: 3,
        maxDepth: 3,
        contentLen: "2–3 frases simples por sección o subsección",
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

    // --- Directrices extra por tipo ---
    const styleByType = {
      Extensive: `
- Prioriza claridad y síntesis técnica.
- Evita ejemplos extensos; céntrate en definiciones, causas y consecuencias.
`,
     Complete: `
- Diferénciate de "Extensa" con mayor amplitud y organización clara.
- Para cada bloque: ¿qué es? → ¿por qué importa? → ¿cómo funciona? → 1–2 ejemplos breves → riesgos/limitaciones → recomendaciones.
- Evita redundancias; resume sin perder precisión técnica.
- Puedes cerrar con un mini “Checklist” o 2–3 preguntas frecuentes si realmente ayudan.
`,
Integro: `
- Máxima cobertura y variedad de ángulos. Profundiza sin repetir.
- En al menos la mitad de secciones incluye nivel 3 (sub-subsecciones) cuando aporte valor.
- Para cada bloque: definición, contexto/antecedentes, causas, consecuencias, ejemplos y contraejemplos, errores frecuentes, micro-escenarios, comparativas, recomendaciones prácticas.
- Considera FAQ y Glosario al final de bloques complejos. Referencias/normativa sólo si aparecen en el texto original.
`,

      Kids: `
- Lenguaje muy sencillo, positivo y cercano. Usa emojis adecuados.
- 1–2 frases simples por punto, con ejemplos cotidianos.
- Evita tecnicismos; si aparecen, explícalos como a un niño.
`,
    }[presentationType] || "";

    // --- Prompt para Complete e Integro (ejemplo con sub-sub)
    const promptForComplete = `
Genera un "Mapa conceptual" (desplegables y subdesplegables) en ESPAÑOL a partir del TEXTO.

Estilo: ${rules.title}
- Máximo ${rules.sectionsMax} secciones.
- Máximo ${rules.subsectionsMaxPerLevel} elementos "subsections" por cada nivel.
- Profundidad máxima: ${rules.maxDepth} niveles.
- Longitud: ${rules.contentLen}.
- ${rules.extra}

Directrices específicas:
${styleByType}

Muy importante:
- La clave "subsections" puede aparecer **en cualquier nivel** hasta la profundidad ${rules.maxDepth}.
- Evita listas muy largas en un mismo nivel; reparte jerárquicamente.
- Mantén coherencia y no repitas ideas: aporta siempre ángulos distintos.
- Devuelve **EXCLUSIVAMENTE** JSON válido.

Formato EXACTO (recursivo):
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
                "content": "Detalle adicional."
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
`.trim();

    // --- Prompt para los demás
    const promptRich = `
Genera un "Mapa conceptual" (desplegables y subdesplegables) en ESPAÑOL a partir del TEXTO.

Estilo: ${rules.title}
- Máximo ${rules.sectionsMax} secciones.
- Máximo ${rules.subsectionsMaxPerLevel} elementos "subsections" por cada nivel.
- Profundidad máxima: ${rules.maxDepth}.
- Longitud: ${rules.contentLen}.
- ${rules.extra}

Directrices específicas:
${styleByType}

Muy importante:
- La clave "subsections" puede aparecer **en cualquier nivel** hasta la profundidad ${rules.maxDepth}.
- Evita listas muy largas en un mismo nivel; reparte jerárquicamente.
- Mantén coherencia y no repitas ideas.
- Devuelve **EXCLUSIVAMENTE** JSON válido.

Formato EXACTO:
{
  "presentationData": {
    "title": "Título de la presentación",
    "sections": [
      {
        "emoji": "📌",
        "title": "Sección",
        "content": "Texto breve.",
        "subsections": []
      }
    ]
  }
}

TEXTO:
${safe}
`.trim();

    // --- Selección de prompt y temperatura
    let prompt;
    let temperature;

   if (presentationType === "Complete" || presentationType === "Integro") {
  prompt = promptForComplete; // mantiene el ejemplo recursivo con sub-sub
  temperature = (presentationType === "Integro") ? 0.60 : 0.50;
} else {
  prompt = promptRich;
  temperature = {
    Extensive: 0.35,
    Kids: 0.45,
  }[presentationType] ?? 0.45;
}

    // --- Modelo único
    const modelName = "gemini-2.0-flash";
    const { GoogleGenerativeAI: GGA } = { GoogleGenerativeAI };
    const genAI = new GGA(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature },
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

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
  } catch (err) {
    console.error("[present] error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err?.message || "Error en present" }) };
  }
};
