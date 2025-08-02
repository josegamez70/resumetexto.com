import * as pdfjsLib from "pdfjs-dist";
import { SummaryType, PresentationType, PresentationData } from "../types";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const pdfToGenerativeParts = async (file: File) => {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
  const pageParts = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      const base64EncodedData = canvas.toDataURL("image/jpeg").split(",")[1];
      pageParts.push({
        inlineData: {
          data: base64EncodedData,
          mimeType: "image/jpeg",
        },
      });
    }
  }
  return pageParts;
};

export const summarizeContent = async (
  file: File,
  summaryType: SummaryType
): Promise<string> => {
  let fileParts;

  if (file.type === "application/pdf") {
    fileParts = await pdfToGenerativeParts(file);
  } else if (file.type.startsWith("image/")) {
    fileParts = [await fileToGenerativePart(file)];
  } else {
    throw new Error("Tipo de archivo no soportado. Sube un PDF o imagen.");
  }

  const response = await fetch("/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileParts, summaryType }),
  });

  let text;
  try {
    text = await response.text();
  } catch {
    throw new Error("Error al leer respuesta del servidor.");
  }

  if (!text) {
    throw new Error("Respuesta vacía del servidor al generar resumen.");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON válido al generar resumen.");
  }

  if (!response.ok) throw new Error(data.error || "Error al generar resumen");
  return data.summary;
};

export const createPresentation = async (
  summaryText: string,
  presentationType: PresentationType
): Promise<PresentationData> => {
  const response = await fetch("/api/present", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summaryText, presentationType }),
  });

  let text;
  try {
    text = await response.text();
  } catch {
    throw new Error("Error al leer respuesta del servidor.");
  }

  if (!text) {
    throw new Error("Respuesta vacía del servidor al generar presentación.");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Respuesta no es JSON válido al generar presentación.");
  }

  if (!response.ok) throw new Error(data.error || "Error al generar presentación");
  return data.presentationData;
};
