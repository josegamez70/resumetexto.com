const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  try {
    const { summaryText, presentationType } = JSON.parse(event.body || "{}");

    if (!summaryText || !presentationType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan parámetros: summaryText o presentationType" }),
      };
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta GOOGLE_AI_API_KEY en las variables de entorno." }),
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const getPresentationPrompt = (type) => {
      let style = "";
      if (type === "Extensive") {
        style = `Debe ser EXTENSA, con subsecciones y sub-subsecciones si es relevante, explicaciones y ejemplos.`;
      } else if (type === "Complete") {
        style = `Debe ser EXTENSA, con subsecciones y sub-subsecciones si es relevante, explicaciones y ejemplos,
                 pero con aproximadamente un 40% más de texto y explicaciones que la versión Extensa,
                 desarrollando más cada punto sin añadir secciones nuevas innecesarias.`;
      } else if (type === "Kids") {
        style = `Debe ser para niños, con lenguaje simple y emojis divertidos.`;
      }

      return `
Genera una presentación en español siguiendo este formato JSON ESTRICTO:
{
  "title": "Título de la presentación",
  "sections": [
    {
      "emoji": "📚",
      "title": "Título sección",
      "content": "Texto de la sección (puede estar vacío si solo tiene subsecciones)",
      "subsections": [
        {
          "emoji": "🔹",
          "title": "Título subsección",
          "content": "Contenido de la subsección",
          "subsections": [
            {
              "emoji": "💡",
              "title": "Título sub-subsección",
              "content": "Contenido"
            }
          ]
        }
      ]
    }
  ]
}
Reglas:
- Devuelve SIEMPRE un objeto JSON con la clave "sections".
- Si no hay subsecciones, devuelve un array vacío en "subsections".
- ${style}
      `;
    };

    const prompt = `${getPresentationPrompt(presentationType)}\n\nTexto base:\n${summaryText}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    });

    let textResponse = (await result.response.text()).trim();

    if (textResponse.startsWith("```")) {
      textResponse = textResponse.replace(/```json/i, "").replace(/```/g, "").trim();
    }

    const firstBrace = textResponse.indexOf("{");
    const lastBrace = textResponse.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      textResponse = textResponse.substring(firstBrace, lastBrace + 1);
    }

    let presentationData;
    try {
      presentationData = JSON.parse(textResponse);
    } catch (err) {
      console.error("[present] ERROR: Respuesta de Gemini no es JSON válido:", textResponse);
      throw new Error("Respuesta de Gemini no es JSON válido.");
    }

    if (!presentationData.sections) {
      presentationData.sections = [];
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presentationData }),
    };

  } catch (error) {
    console.error("[present] ERROR general en /api/present:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Error interno al generar presentación." }),
    };
  }
};
