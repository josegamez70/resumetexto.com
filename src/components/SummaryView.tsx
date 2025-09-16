// components/SummaryView.tsx

import React, { useEffect, useRef, useState } from "react";
import { PresentationType, MindMapColorMode } from "../types"; 

interface SummaryViewProps {
  summary: string;
  summaryTitle: string;
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
  presentationType,
  setPresentationType,
  onGeneratePresentation,
  onOpenMindMap,
  onGenerateFlashcards,
  onReset,
}) => {
  const [colorMode, setColorMode] = useState<MindMapColorMode>(MindMapColorMode.Color);
  const [speaking, setSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => { try { window.speechSynthesis.cancel(); } catch {} }, []);

  const handleSpeak = () => {
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

  const handlePrintSummary = () => {
    const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(summaryTitle || "Resumen")}</title>
<style>
  :root{color-scheme:dark light}
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial;margin:0;background:#111827;color:#fff}
  .wrap{padding:24px}
  h1{font-size:22px;margin:0 0 6px}
  h3{margin:0 0 18px;color:#facc15;font-style:italic;font-size:18px}
  .box{background:#1f2937;border:1px solid #374151;padding:16px;border-radius:10px;white-space:pre-wrap;line-height:1.5}
  .actions{margin-top:16px}
  .btn{padding:8px 12px;border-radius:8px;background:#2563eb;color:#fff;border:0;cursor:pointer}
  @media print{.actions{display:none!important}body{background:#fff;color:#000}.box{background:#fff;border-color:#ddd}}
</style>
<script>window.addEventListener('load',()=>{try{window.print()}catch(e){}});</script>
</head>
<body>
  <div class="wrap">
    <h1>Resumen</h1>
    <h3>${esc(summaryTitle || "")}</h3>
    <div class="box">${esc(summary)}</div>
    <div class="actions"><button class="btn" onclick="window.print()">Imprimir</button></div>
  </div>
</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.right = "0"; iframe.style.bottom = "0";
    iframe.style.width = "0"; iframe.style.height = "0"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    const cleanup = () => setTimeout(()=>{ try{ document.body.removeChild(iframe); }catch{} }, 1500);
    if (iframe.contentWindow) {
      iframe.onload = () => { try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } finally { cleanup(); } };
      iframe.srcdoc = html;
    } else {
      const blob = new Blob([html], { type: "text/html" }); iframe.src = URL.createObjectURL(blob); iframe.onload = cleanup;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Resumen generado</h1>
        <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <button onClick={handlePrintSummary} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">🖨 Imprimir resumen</button>
        <button onClick={handleSpeak} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded">{speaking ? "⏹ Detener audio" : "🔊 Escuchar resumen"}</button>
      </div>

      <div className="bg-gray-800 text-white p-3 sm:p-4 rounded-lg mb-6 sm:mb-8 whitespace-pre-line text-sm sm:text-base">
        {summary}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Caja Mapa Conceptual */}
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

        {/* Caja Mapa Mental */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">🧠 Mapa mental</h2>
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            <strong>¿Qué es?</strong> Un árbol que parte del tema central, y muestra las claves principales del documento, para una comprensión express.
          </p>

          <label className="block text-sm text-gray-300 mb-2">Modo:</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="colormode"
                checked={colorMode === MindMapColorMode.BlancoNegro}
                onChange={() => setColorMode(MindMapColorMode.BlancoNegro)}
              />
              Clásico
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="colormode"
                checked={colorMode === MindMapColorMode.Color}
                onChange={() => setColorMode(MindMapColorMode.Color)}
              />
              Más detalle
            </label>
          </div>

          <div className="mt-4">
            <button onClick={() => onOpenMindMap(colorMode)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded">Generar mapa mental</button>
          </div>
        </div>
      </div>

      {/* Flashcards */}
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
