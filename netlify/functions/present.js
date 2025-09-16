// netlify/functions/present.js
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
    try { payload = JSON.parse(event.body || "{}"); }
    catch { return { statusCode: 400, body: JSON.stringify({ error: "Body no es JSON válido." }) }; }

    const summaryText = String(payload.summaryText || "");
    const presentationType = String(payload.presentationType || "Extensive"); // Extensive | Complete | Integro | Kids
    if (!summaryText) {
      return { statusCode: 400, body: JSON.stringify({ error: "Debes enviar { summaryText: string }." }) };
    }

    const MAX = 10000;
    const safe = summaryText.length > MAX ? summaryText.slice(0, MAX) : summaryText;

    // --- Reglas base ---
    // OJO: Complete e Integro están INTERCAMBIADOS respecto a antes.
    const rules = {
      Extensive: {
        title: "Extensa (en detalle)",
        sectionsMax: 6,
        subsectionsMaxPerLevel: 4,
        maxDepth: 3,
        contentLen: "2–3 frases por sección o subsección",
        extra: "Lenguaje claro, técnico cuando sea necesario.",
      },
      // COMPLETE ahora usa lo que antes era INTEGRO (muy completo, máximo alcance)
      Complete: {
        title: "Íntegro (muy completo, máximo alcance)",
        sectionsMax: 7,
        subsectionsMaxPerLevel: 7,
        maxDepth: 5,
        contentLen: "6–8 frases por sección o subsección",
        extra: "Cobertura máxima sin ser redundante. Estructura jerárquica muy clara.",
      },
      // INTEGRO ahora usa lo que antes era COMPLETE (+50% detalle)
      Integro: {
        title: "Completa (+50% más detalle)",
        sectionsMax: 6,
        subsectionsMaxPerLevel: 6,
        maxDepth: 4,
        contentLen: "5–6 frases por sección o subsección",
        extra: "Incluye definición, causas, consecuencias, ejemplos, mini-casos y notas aclaratorias.",
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
    // OJO: También INTERCAMBIAMOS los bloques de estilo de Complete e Integro.
    const styleByType = {
      Extensive: `
- Prioriza claridad y síntesis técnica.
- Evita ejemplos extensos; céntrate en definiciones, causas y consecuencias.
`,

      // COMPLETE ahora toma el estilo "antes Integro"
      Complete: `
- Diferénciate claramente de "Completa" tradicional: más amplitud y variedad.
- Para cada sección principal, intenta cubrir: ¿qué es?, ¿por qué importa?, ¿cómo funciona?, ejemplos y contraejemplos, errores frecuentes, micro-escenarios, curiosidades y comparativas si aplican.
- Introduce contexto/antecedentes, referencias o normativa relevante (solo si aparece en el texto original), riesgos/limitaciones, recomendaciones prácticas y notas aclaratorias.
- Puedes cerrar algunas secciones con "Preguntas frecuentes" o "Glosario" dentro del árbol (como subsecciones).
- Evita repetir ideas ya expuestas. Varía redacción y organización: reparte ideas en niveles más profundos (hasta ${rules.maxDepth}).
- Cada frase debe aportar valor nuevo, nada de relleno.
`,

      // INTEGRO ahora toma el estilo "antes Complete"
      Integro: `
- Amplía con 5–6 frases por punto.
- Incluye causas, consecuencias, ejemplos y mini-casos.
- Señala relaciones y comparaciones cuando aporten valor.
`,

      Kids: `
- Lenguaje muy sencillo, positivo y cercano. Usa emojis adecuados.
- 1–2 frases simples por punto, con ejemplos cotidianos.
- Evita tecnicismos; si aparecen, explícalos como a un niño.
`,
    }[presentationType] || "";

    // --- Prompt ---
    const prompt = `
Genera un "Mapa conceptual" (desplegables y subdesplegables) en ESPAÑOL a partir del TEXTO.

Estilo: ${rules.title}
- Máximo ${rules.sectionsMax} secciones.
- Máximo ${rules.subsectionsMaxPerLevel} elementos "subsections" por cada nivel.
- Profundidad máxima: ${rules.maxDepth} niveles (Sección = nivel 1).
- Longitud: ${rules.contentLen}.
- ${rules.extra}

Directrices específicas:
${styleByType}

Muy importante:
- La clave "subsections" puede aparecer **en cualquier nivel** hasta la profundidad ${rules.maxDepth}.
- Evita listas muy largas en un mismo nivel; reparte jerárquicamente.
- Mantén coherencia y no repitas ideas. Si un punto ya se explicó, aporta un ángulo distinto (ejemplo, curiosidades, contrapunto, error común, pregunta frecuente…).
- Devuelve **EXCLUSIVAMENTE** JSON válido (sin comentarios/explicaciones/bloques \`\`\`).

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
`;

    // --- Temperatura variable según tipo ---
    const tempByType = {
      Extensive: 0.35,
      Complete:  0.40,
      Integro:   0.55,
      Kids:      0.45,
    }[presentationType] ?? 0.45;

    // --- Selección de modelo según tipo ---
    // Manteniendo tu criterio: SOLO Integro usa PRO; todos los demás usan FLASH.
    const modelByType = (presentationType === "Integro")
      ? "gemini-1.5-pro"
      : "gemini-1.5-flash";

    const { GoogleGenerativeAI: GGA } = { GoogleGenerativeAI };
    const genAI = new GGA(apiKey);
    const model = genAI.getGenerativeModel({ model: modelByType });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: tempByType },
    });

    let raw = result.response.text().trim();

    // Parse robusto
    let data;
    try { data = JSON.parse(raw); }
    catch {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
      try { data = JSON.parse(cleaned); }
      catch {
        const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          const slice = cleaned.slice(start, end + 1);
          try { data = JSON.parse(slice); }
          catch {
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
