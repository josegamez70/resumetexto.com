import { SummaryType } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_API_KEY);

export async function summarizeContent(file: File, summaryType: SummaryType): Promise<{ summary: string; title: string }> {
  const text = await file.text();

  const prompt = `
Eres un asistente que resume textos en español. Toma el siguiente contenido y:

1. Haz un resumen claro y útil.
2. Propón un título breve, claro y representativo del contenido (máximo 10 palabras, sin comillas ni punto final).

Devuelve el resultado en formato JSON:

{
  "title": "Título generado",
  "summary": "Resumen generado"
}

Texto original:
"""${text}"""
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const raw = response.text();

  try {
    // Limpiar posibles bloques ```json ... ```
    const jsonClean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonClean);

    return {
      summary: parsed.summary || '',
      title: parsed.title || '',
    };
  } catch (e) {
    console.error('Error parsing JSON response:', e);
    return {
      summary: raw,
      title: '',
    };
  }
}
