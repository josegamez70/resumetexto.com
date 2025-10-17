// components/SummaryView.tsx

import React, { useEffect, useRef, useState } from "react"; // <-- `useRef` and `useEffect` are back
import { PresentationType, MindMapColorMode, SummaryType } from "../types";

interface SummaryViewProps {
  summary: string;
  summaryTitle: string;
  summaryType: SummaryType;
  uploadedFileName: string;
  presentationType: PresentationType;
  setPresentationType: (type: PresentationType) => void;
  onGeneratePresentation: () => void;
  onOpenMindMap: (colorMode: MindMapColorMode) => void;
  onGenerateFlashcards: () => void;
  onReset: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  summaryTitle,
  summaryType,
  uploadedFileName,
  presentationType,
  setPresentationType,
  onGeneratePresentation,
  onOpenMindMap,
  onGenerateFlashcards,
  onReset,
}) => {
  const [speaking, setSpeaking] = useState(false); // <-- Restored
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null); // <-- Restored
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // <-- Restored useEffect for speech synthesis cancellation
  useEffect(() => () => { try { window.speechSynthesis.cancel(); } catch {} }, []);

  const handleSpeak = () => { // <-- Restored handleSpeak function
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(summary);
    const voices = synth.getVoices();
    const es =
      voices.find(v => v.lang?.toLowerCase().startsWith("es")) ||
      voices.find(v => v.lang?.toLowerCase().includes("es")) ||
      null;
    if (es) u.voice = es;
    u.lang = es?.lang || "es-ES";
    u.rate = 1.0; u.pitch = 1.0;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u; setSpeaking(true); synth.cancel(); synth.speak(u);
  };

  const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const getSummaryTypeName = (type: SummaryType) => {
    switch (type) {
      case SummaryType.Short: return "Corto";
      case SummaryType.Detailed: return "Detallado";
      case SummaryType.Bulleted: return "Por_Puntos";
      default: return "General";
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);

    const documentMainTitle = "Resumelo!";
    const documentSubTitle = `Modalidad: ${getSummaryTypeName(summaryType).replace(/_/g, " ")}`;

    const cleanFileName = uploadedFileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    const pdfFileName = `RESUMELO!_${cleanFileName}_${getSummaryTypeName(summaryType)}.pdf`;

    const htmlToConvert = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(documentMainTitle)} - ${esc(documentSubTitle)}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial;margin:0;background:#fff;color:#000}
  .wrap{padding:24px}
  h1{font-size:26px;margin:0 0 6px;color:#000; -webkit-print-color-adjust:exact; print-color-adjust:exact;}
  h3{margin:0 0 18px;color:#333;font-style:italic;font-size:18px; -webkit-print-color-adjust:exact; print-color-adjust:exact;}
  .content{
    white-space:pre-wrap;
    line-height:1.5;
    color:#000;
    background:#fff;
  }
</style>
</head>
<body>
  <div class="wrap">
    <h1>${esc(documentMainTitle)}</h1>
    <h3>${esc(documentSubTitle)}</h3>
    <div class="content">${esc(summary)}</div>
  </div>
</body></html>`;

    try {
      const response = await fetch('/.netlify/functions/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlToConvert,
          filename: pdfFileName,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        console.error('Error al generar el PDF en el servidor:', errorData);
        alert(`Error al generar el PDF: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error de red o inesperado al generar el PDF:', error);
      alert('Hubo un problema de conexión al intentar generar el PDF. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Resumen generado</h1>
        <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <button
          onClick={handleDownloadPdf}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? "Generando PDF..." : "🖨 Descargar Resumen (PDF)"}
        </button>
        {/* <-- Botón "Escuchar resumen" RESTAURADO */}
        <button onClick={handleSpeak} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded">{speaking ? "⏹ Detener audio" : "🔊 Escuchar resumen"}</button>
      </div>

      <div className="bg-gray-800 text-white p-3 sm:p-4 rounded-lg mb-6 sm:mb-8 whitespace-pre-line text-sm sm:text-base">
        {summary}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Caja Mapa Conceptual (Sin cambios) */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">🧩 Mapa conceptual</h2>
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            <strong>¿Qué es?</strong> Un esquema con secciones que puedes abrir/cerrar (desplegables) y subniveles. Útil para estudiar o repasar por bloques.
          </p>

          <label className="block text-sm text-gray-300 mb-2">Estilo:</label>
          <select
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full"
            value={presentationType}
            onChange={(e) => setPresentationType(e.target.value as PresentationType)}
          >
            <option value={PresentationType.Extensive}>Extensa (en detalle)</option>
            <option value={PresentationType.Complete}>Completa (+50% detalle)</option>
            <option value={PresentationType.Integro}>Íntegro (muy completo, máximo alcance)</option>
            <option value={PresentationType.Kids}>Para Niños</option>
          </select>

          <div className="mt-4">
            <button onClick={onGeneratePresentation} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">Generar mapa conceptual</button>
          </div>
        </div>

        {/* Caja Mapa Mental - MODIFICADA */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">🧠 Mapa mental</h2>
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            <strong>¿Qué es?</strong> Un árbol que parte del tema central, y muestra las claves principales del documento, para una comprensión express.
          </p>
          <div className="mt-4">
            <button onClick={() => onOpenMindMap(MindMapColorMode.BlancoNegro)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded">Generar mapa mental</button>
          </div>
        </div>
      </div>

      {/* Flashcards (Sin cambios) */}
      <div className="mt-4 bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">📇 Flashcards</h2>
        <p className="text-gray-300 mb-4 text-sm sm:text-base">
          <strong>¿Qué son?</strong> Tarjetas con una pregunta por delante y su respuesta por detrás. Ideal para el repaso activo.
        </p>
        <div className="mt-4">
          <button onClick={onGenerateFlashcards} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">Generar flashcards</button>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={onReset} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded">Volver a inicio</button>
      </div>
    </div>
  );
};

export default SummaryView;