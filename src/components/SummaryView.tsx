import React, { useState } from "react";
import { PresentationType, MindMapMode } from "../types";

interface SummaryViewProps {
  summary: string;
  summaryTitle: string;
  presentationType: PresentationType;
  setPresentationType: (type: PresentationType) => void;
  onGeneratePresentation: () => void;                 // genera mapa conceptual
  onOpenMindMap: (mode: MindMapMode) => void;         // genera mapa mental
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
  const [mindMapMode, setMindMapMode] = useState<MindMapMode>(MindMapMode.Resumido);

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Resumen generado</h1>
        <h3 className="text-lg italic text-yellow-400">{summaryTitle}</h3>
      </div>

      <div className="bg-gray-800 text-white p-4 rounded-lg mb-8 whitespace-pre-line">
        {summary}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Caja Mapa Conceptual */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-2xl font-bold mb-2">🧩 Mapa conceptual</h2>
          <p className="text-gray-300 mb-4">
            Estructura en desplegables y subdesplegables.
          </p>

          <label className="block text-sm text-gray-300 mb-2">
            Estilo:
          </label>
          <select
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full md:w-72"
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
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
              title="Generar mapa conceptual (desplegables y subdesplegables)"
            >
              Generar mapa conceptual
            </button>
          </div>
        </div>

        {/* Caja Mapa Mental */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-2xl font-bold mb-2">🧠 Mapa mental</h2>
          <p className="text-gray-300 mb-4">
            Árbol hacia la derecha. Elige nivel de detalle.
          </p>

          <label className="block text-sm text-gray-300 mb-2">Detalle:</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mmode"
                checked={mindMapMode === MindMapMode.Resumido}
                onChange={() => setMindMapMode(MindMapMode.Resumido)}
              />
              Resumido
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mmode"
                checked={mindMapMode === MindMapMode.Extendido}
                onChange={() => setMindMapMode(MindMapMode.Extendido)}
              />
              Extendido
            </label>
          </div>

          <div className="mt-4">
            <button
              onClick={() => onOpenMindMap(mindMapMode)}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
              title="Generar mapa mental (árbol hacia la derecha)"
            >
              Generar mapa mental
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onReset}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default SummaryView;
