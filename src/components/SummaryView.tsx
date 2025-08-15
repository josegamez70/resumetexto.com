import React, { useState } from "react";
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

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Resumen generado</h1>
        <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
      </div>

      <div className="bg-gray-800 text-white p-3 sm:p-4 rounded-lg mb-6 sm:mb-8 whitespace-pre-line text-sm sm:text-base">
        {summary}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Caja Mapa Conceptual */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">🧩 Mapa conceptual</h2>
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            Estructura en desplegables y subdesplegables.
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
            Árbol hacia la derecha (en móvil se muestran los hijos debajo).
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
