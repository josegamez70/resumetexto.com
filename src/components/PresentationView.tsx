import React, { useRef } from "react";
import { PresentationData, PresentationType } from "../types";

interface PresentationViewProps {
  presentation: PresentationData;
  presentationType: PresentationType;
  summaryTitle: string;
  onBackToSummary: () => void; // ← ya lo tenías
  onHome?: () => void;         // no se usa aquí
}

const BackToSummaryFab: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-lg hover:bg-yellow-300"
    aria-label="Volver al resumen"
  >
    ← Volver
  </button>
);

const PresentationView: React.FC<PresentationViewProps> = ({
  presentation,
  presentationType,
  summaryTitle,
  onBackToSummary,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!presentation || !presentation.sections) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fadeIn text-center">
        <p>No hay datos para mostrar.</p>
        <BackToSummaryFab onClick={onBackToSummary} />
      </div>
    );
  }

  const expandAll = () => {
    containerRef.current?.querySelectorAll("details").forEach((d) => d.setAttribute("open", "true"));
  };
  const collapseAll = () => {
    containerRef.current?.querySelectorAll("details").forEach((d) => d.removeAttribute("open"));
  };
  const printPDF = () => window.print();

  const handleTopSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const detailsEl = (e.currentTarget as HTMLElement).parentElement as HTMLDetailsElement;
    const isOpen = detailsEl.hasAttribute("open");
    const wrapper = containerRef.current;
    if (!wrapper) return;
    if (isOpen) {
      detailsEl.removeAttribute("open");
    } else {
      wrapper.querySelectorAll("details.lvl1").forEach((d) => d.removeAttribute("open"));
      detailsEl.setAttribute("open", "true");
    }
  };

  const renderSection = (section: any, level = 1) => {
    let summaryClass =
      "bg-yellow-500 text-black px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
    let contentClass = "p-3 sm:p-4 whitespace-pre-line text-sm sm:text-base break-words";
    if (level === 2) {
      summaryClass =
        "bg-blue-600 text-white px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
      contentClass =
        "p-3 sm:p-4 bg-blue-100 text-black whitespace-pre-line text-sm sm:text-base break-words";
    }
    if (level >= 3) {
      summaryClass =
        "bg-yellow-200 text-gray-800 px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
      contentClass =
        "p-3 sm:p-4 bg-yellow-50 text-gray-800 whitespace-pre-line text-sm sm:text-base break-words";
    }
    const isTop = level === 1;

    return (
      <details
        className={`border rounded-lg overflow-hidden w-full max-w-full ${
          isTop
            ? "lvl1 bg-gray-800 border-gray-700"
            : level === 2
            ? "bg-gray-700 border-gray-600 pl-2 sm:pl-4"
            : "bg-gray-600 border-gray-500 pl-3 sm:pl-6"
        }`}
      >
        <summary
          className={summaryClass}
          onClick={isTop ? handleTopSummaryClick : undefined}
        >
          {section.emoji} {section.title}
        </summary>
        {section.content && <p className={contentClass}>{section.content}</p>}
        {Array.isArray(section.subsections) &&
          section.subsections.map((sub: any) => renderSection(sub, level + 1))}
      </details>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
          <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
          <p className="text-xs sm:text-sm text-gray-400 italic">Tipo: {presentationType}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-start mb-3 sm:mb-6">
        <button onClick={expandAll} className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm">📂 Desplegar todos</button>
        <button onClick={collapseAll} className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm">📁 Colapsar todos</button>
        <button onClick={printPDF} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm">🖨 Imprimir</button>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4 overflow-x-hidden">
        <div ref={containerRef} className="space-y-3">
          {presentation.sections.map((section) => renderSection(section, 1))}
        </div>
      </div>

      {/* FAB Volver */}
      <BackToSummaryFab onClick={onBackToSummary} />
    </div>
  );
};

export default PresentationView;
