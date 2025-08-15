import React, { useEffect, useRef, useState } from "react";
import { PresentationType, MindMapColorMode } from "../types";

interface SummaryViewProps {
  summary: string;
  summaryTitle: string;
  presentationType: PresentationType;
  setPresentationType: (type: PresentationType) => void;
  onGeneratePresentation: () => void;
  onOpenMindMap: (colorMode: MindMapColorMode) => void;
  onReset: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  summaryTitle,
  presentationType,
  setPresentationType,
  onGeneratePresentation,
  onOpenMindMap,
  onReset,
}) => {
  const [colorMode, setColorMode] = useState<MindMapColorMode>(MindMapColorMode.Color);
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Limpieza TTS al desmontar
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  const handleSpeak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    // Crear utterance
    const u = new SpeechSynthesisUtterance(summary);
    // Spanish voice si está disponible
    const voices = synth.getVoices();
    const esVoice =
      voices.find((v) => v.lang?.toLowerCase().startsWith("es")) ||
      voices.find((v) => v.lang?.toLowerCase().includes("es")) ||
      null;
    if (esVoice) u.voice = esVoice;
    u.lang = esVoice?.lang || "es-ES";
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utterRef.current = u;
    setSpeaking(true);
    synth.cancel();
    synth.speak(u);
  };

  const handlePrintSummary = () => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${summaryTitle || "Resumen"}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @media print { .no-print { display: none !important; } }
  body { background:#111827; color:white; }
</style>
</head>
<body class="p-6">
  <h1 class="text-2xl font-bold mb-2">Resumen</h1>
  <h3 class="text-lg italic text-yellow-400 mb-4">${summaryTitle || ""}</h3>
  <div class="bg-gray-800 text-white p-4 rounded-lg whitespace-pre-line text-base">${summary
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</div>
  <div class="no-print mt-4">
    <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">🖨 Imprimir</button>
  </div>
</body></html>`;
    w.document.write(html);
    w.document.close();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Resumen generado</h1>
        <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
      </div>

      {/* Botones del resumen */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <button
          onClick={handlePrintSummary}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          title="Imprimir solo el resumen"
        >
          🖨 Imprimir resumen
        </button>
        <button
          onClick={handleSpeak}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
          title="Leer el resumen en voz alta"
        >
          {speaking ? "⏹ Detener audio" : "🔊 Escuchar resumen"}
        </button>
      </div>

      <div className="bg-gray-800 text-white p-3 sm:p-4 rounded-lg mb-6 sm:mb-8 whitespace-pre-line text-sm sm:text-base">
        {summary}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Caja Mapa Conceptual */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">🧩 Mapa conceptual</h2>
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            Estructura en desplegables y subdesplegables (sub-sub en todos los estilos).
          </p>

          <label className="block text-sm text-gray-300 mb-2">Estilo:</label>
          <select
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full"
            value={presentationType}
            onChange={(e) => setPresentationType(e.target.value as PresentationType)}
          >
            <option value={PresentationType.Extensive}>Extensa (en detalle)</option>
            <option value={PresentationType.Complete}>Completa (+50% detalle)</option>
            <option value={PresentationType.Kids}>Para Niños</option>
          </select>

          <div className="mt-4">
            <button
              onClick={onGeneratePresentation}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              title="Generar mapa conceptual"
            >
              Generar mapa conceptual
            </button>
          </div>
        </div>

        {/* Caja Mapa Mental */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">🧠 Mapa mental (extendido)</h2>
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            Raíz negra; hijos heredan color de la madre (menos intenso). En móvil, los hijos se muestran debajo.
          </p>

          <label className="block text-sm text-gray-300 mb-2">Modo de color:</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="colormode"
                checked={colorMode === MindMapColorMode.BlancoNegro}
                onChange={() => setColorMode(MindMapColorMode.BlancoNegro)}
              />
              Blanco y negro
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="colormode"
                checked={colorMode === MindMapColorMode.Color}
                onChange={() => setColorMode(MindMapColorMode.Color)}
              />
              A color
            </label>
          </div>

          <div className="mt-4">
            <button
              onClick={() => onOpenMindMap(colorMode)}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
              title="Generar mapa mental"
            >
              Generar mapa mental
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onReset}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Volver a inicio
        </button>
      </div>
    </div>
  );
};

export default SummaryView;
