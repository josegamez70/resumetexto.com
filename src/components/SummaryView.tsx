import React from "react";
import { PresentationType } from "../types";

interface SummaryViewProps {
  summary: string;
  summaryTitle: string;
  presentationType: PresentationType;
  setPresentationType: (type: PresentationType) => void;
  onGeneratePresentation: () => void;
  onReset: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  presentationType,
  setPresentationType,
  onGeneratePresentation,
  onReset
}) => {
  const handlePrintPDF = () => {
    const keyword = summary.split(" ").slice(0, 2).join(" ");
    const originalTitle = document.title;
    document.title = `Resumelo! - ${keyword}`;
    window.print();
  };

  return (
    <div className="bg-brand-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Resumen generado:</h2>
      <p className="mb-6 whitespace-pre-line">{summary}</p>

      {/* Botón imprimir PDF */}
      <div className="mb-4">
        <button
          onClick={handlePrintPDF}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          🖨 Imprimir en PDF
        </button>
      </div>

      {/* Caja destacada para tipo de presentación */}
      <div className="mb-4 border-2 border-yellow-400 rounded-lg p-4 bg-gray-800">
        <label className="mr-2 font-semibold text-white">Tipo de presentación:</label>
        <select
          value={presentationType}
          onChange={(e) => setPresentationType(e.target.value as PresentationType)}
          className="bg-gray-700 text-white p-2 rounded mt-2"
        >
          <option value={PresentationType.Extensive}>📚 Extensa</option>
          <option value={PresentationType.Complete}>📖 Completa (50% más de detalle)</option>
          <option value={PresentationType.Kids}>🎈 Para niños</option>
        </select>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onGeneratePresentation}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Generar Presentación
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
