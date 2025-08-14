import React from "react";
import { PresentationType } from "../types";

interface SummaryViewProps {
  summary: string;
  summaryTitle: string;
  presentationType: PresentationType;
  setPresentationType: (type: PresentationType) => void;
  onGeneratePresentation: () => void;   // ahora "Mapa conceptual"
  onReset: () => void;
  onOpenMindMap?: () => void;           // NUEVO: Mapa mental (resumido)
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  summaryTitle,
  presentationType,
  setPresentationType,
  onGeneratePresentation,
  onReset,
  onOpenMindMap,
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Resumen generado</h1>
        <h3 className="text-lg italic text-yellow-400">{summaryTitle}</h3>
      </div>

      <div className="bg-gray-800 text-white p-4 rounded-lg mb-6 whitespace-pre-line">
        {summary}
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-2">
          Tipo de <span className="font-semibold">Mapa conceptual</span>:
        </label>
        <select
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 w-full md:w-72"
          value={presentationType}
          onChange={(e) => setPresentationType(e.target.value as PresentationType)}
        >
          <option value="Extensive">Extensive</option>
          <option value="Complete">Complete</option>
          <option value="Kids">Kids</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={onGeneratePresentation}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          title="Generar mapa conceptual (desplegables y subdesplegables)"
        >
          🧩 Generar Mapa conceptual
        </button>

        <button
          onClick={() => onOpenMindMap && onOpenMindMap()}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
          title="Generar mapa mental (resumido) en formato árbol hacia la derecha"
        >
          🧠 Mapa mental (resumido)
        </button>

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
