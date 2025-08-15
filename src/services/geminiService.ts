export async function createMindMapFromText(text: string): Promise<MindMapData> {
  const textToSend = String(text || "").trim();
  if (!textToSend) {
    throw new Error("No hay texto para generar el mapa mental. Primero genera un resumen o una presentación.");
  }

  const resp = await fetch("/api/mindmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: textToSend }), // ← garantizamos 'text'
  });

  const raw = await resp.text();
  if (!raw) throw new Error("Respuesta vacía del servidor en mindmap.");

  let data: any;
  try { data = JSON.parse(raw); }
  catch { throw new Error("Respuesta no es JSON válido en mindmap."); }

  if (!resp.ok) throw new Error(data.error || "Error al generar mapa mental.");

  return data.mindmap as MindMapData;
}
