import type { Handler } from "@netlify/functions";

const API_KEY = process.env.GOOGLE_AI_API_KEY!;
const MODEL = process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { prompt } = JSON.parse(event.body || "{}");
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt" }) };
    }

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: data?.error?.message || "Gemini error" }),
      };
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";

    return { statusCode: 200, body: JSON.stringify({ text, raw: data }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "Internal error" }) };
  }
};
