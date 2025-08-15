import React, { useRef } from "react";
import { PresentationData, PresentationType } from "../types";

interface PresentationViewProps {
  presentation: PresentationData;
  presentationType: PresentationType;
  summaryTitle: string;
  onBackToSummary: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({
  presentation,
  presentationType,
  summaryTitle,
  onBackToSummary,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!presentation || !presentation.sections) {
    return (
      <div className="text-center p-6 animate-fadeIn">
        <p>No hay datos para mostrar.</p>
        <button
          onClick={onBackToSummary}
          className="mt-4 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg"
        >
          Volver
        </button>
      </div>
    );
  }

  const expandAll = () => {
    containerRef.current?.querySelectorAll("details").forEach(d => d.setAttribute("open", "true"));
  };
  const collapseAll = () => {
    containerRef.current?.querySelectorAll("details").forEach(d => d.removeAttribute("open"));
  };
  const printPDF = () => window.print();

  const downloadHTML = () => {
    if (!containerRef.current) return;
    const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${summaryTitle || presentation.title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body{height:100%} body{max-width:100%;overflow-x:hidden}
  details{width:100%} summary{list-style:none} summary::-webkit-details-marker{display:none}
</style>
<script>
function expandAll(){ document.querySelectorAll('details').forEach(d=>d.setAttribute('open','true')); }
function collapseAll(){ document.querySelectorAll('details').forEach(d=>d.removeAttribute('open')); }
function printPDF(){ window.print(); }
</script>
</head>
<body class="bg-gray-900 text-white p-3 sm:p-6">
  <div class="mb-3 sm:mb-4">
    <h1 class="text-lg sm:text-2xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
    <p class="text-gray-300 text-sm">Abre/cierra cada bloque para estudiar por partes. El HTML descargado se ve igual que aquí.</p>
    <h3 class="text-sm sm:text-lg italic text-yellow-400">${summaryTitle || ""}</h3>
    <p class="text-xs sm:text-sm text-gray-400 italic">Tipo: ${presentationType}</p>
  </div>
  <div class="grid grid-cols-1 sm:flex gap-2 mb-3 sm:mb-5">
    <button onclick="expandAll()" class="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm">📂 Desplegar todos</button>
    <button onclick="collapseAll()" class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm">📁 Colapsar todos</button>
    <button onclick="printPDF()" class="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">🖨 Imprimir</button>
  </div>
  <div class="space-y-3">
    ${containerRef.current.innerHTML}
  </div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summaryTitle || presentation.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = (section: any, level = 1) => {
    let summaryClass =
      "bg-yellow-500 text-black px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base";
    let contentClass = "p-3 sm:p-4 whitespace-pre-line text-sm sm:text-base";
    if (level === 2) {
      summaryClass = "bg-blue-600 text-white px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base";
      contentClass = "p-3 sm:p-4 bg-blue-100 text-black whitespace-pre-line text-sm sm:text-base";
    }
    if (level >= 3) {
      summaryClass = "bg-yellow-200 text-gray-800 px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base";
      contentClass = "p-3 sm:p-4 bg-yellow-50 text-gray-800 whitespace-pre-line text-sm sm:text-base";
    }
    return (
      <details
        className={`border rounded-lg overflow-hidden ${
          level === 1 ? "bg-gray-800 border-gray-700"
          : level === 2 ? "ml-2 sm:ml-4 bg-gray-700 border-gray-600"
          : "ml-4 sm:ml-8 bg-gray-600 border-gray-500"
        } w-full`}
      >
        <summary className={summaryClass}>{section.emoji} {section.title}</summary>
        {section.content && <p className={contentClass}>{section.content}</p>}
        {Array.isArray(section.subsections) && section.subsections.map((sub: any, i: number) => renderSection(sub, level + 1))}
      </details>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fadeIn">
      <div className="flex items-stretch sm:items-center justify-between gap-3 mb-3 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
          <p className="text-gray-300 text-sm">Abre/cierra cada bloque. Puedes descargar el HTML y se verá igual.</p>
          <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
          <p className="text-xs sm:text-sm text-gray-400 italic">Tipo: {presentationType}</p>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={onBackToSummary}
            className="w-full sm:w-auto border border-red-500 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:flex gap-2 mb-3 sm:mb-6">
        <button onClick={expandAll} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm">📂 Desplegar todos</button>
        <button onClick={collapseAll} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">📁 Colapsar todos</button>
        <button onClick={printPDF} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">🖨 Imprimir</button>
        <button onClick={downloadHTML} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm">💾 Descargar HTML</button>
      </div>

      <div ref={containerRef} className="space-y-3">
        {presentation.sections.map(section => renderSection(section, 1))}
      </div>
    </div>
  );
};

export default PresentationView;
