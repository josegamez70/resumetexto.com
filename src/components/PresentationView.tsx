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
    containerRef.current?.querySelectorAll("details").forEach((d) => d.setAttribute("open", "true"));
  };
  const collapseAll = () => {
    containerRef.current?.querySelectorAll("details").forEach((d) => d.removeAttribute("open"));
  };
  const printPDF = () => window.print();

  // Acordeón (primer nivel) en app
  const handleTopSummaryClick = (e: React.MouseEvent, _idx: number) => {
    e.preventDefault();
    const summaryEl = e.currentTarget as HTMLElement;
    const detailsEl = summaryEl.parentElement as HTMLDetailsElement;
    if (!containerRef.current || !detailsEl) return;
    const isOpen = detailsEl.hasAttribute("open");
    if (isOpen) {
      detailsEl.removeAttribute("open");
    } else {
      containerRef.current.querySelectorAll("details.lvl1").forEach((d) => d.removeAttribute("open"));
      detailsEl.setAttribute("open", "true");
    }
  };

  const downloadHTML = () => {
    if (!containerRef.current) return;

    const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${summaryTitle || presentation.title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body{height:100%} body{max-width:100%;overflow-x:hidden}
  details{width:100%} summary{list-style:none} summary::-webkit-details-marker{display:none}
  /* Botones compactos y alineados a la izquierda */
  .btns{display:flex;flex-wrap:wrap;gap:.45rem;justify-content:flex-start}
  .btn{display:inline-flex;align-items:center;gap:.35rem;padding:.5rem .7rem;font-size:.9rem;border-radius:.55rem}
</style>
<script>
window._bulkOpen = false;
function expandAll(){
  window._bulkOpen = true;
  document.querySelectorAll('details').forEach(d=>d.open=true);
  setTimeout(()=>{ window._bulkOpen = false; }, 0);
}
function collapseAll(){ document.querySelectorAll('details').forEach(d=>d.open=false) }
function printPDF(){ window.print() }
// Acordeón 1er nivel (ignorar durante expandAll)
document.addEventListener('toggle', function(ev){
  const el = ev.target;
  if(!(el instanceof HTMLDetailsElement)) return;
  if(window._bulkOpen) return;
  if(el.classList.contains('lvl1') && el.open){
    document.querySelectorAll('details.lvl1').forEach(function(d){ if(d!==el) d.open=false; });
  }
}, true);
</script>
</head>
<body class="bg-gray-900 text-white p-3 sm:p-6">
  <div class="mb-3 sm:mb-4">
    <h1 class="text-lg sm:text-2xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
    <!-- sin explicación -->
    <h3 class="text-sm sm:text-lg italic text-yellow-400">${summaryTitle || ""}</h3>
    <p class="text-xs sm:text-sm text-gray-400 italic">Tipo: ${presentationType}</p>
  </div>
  <div class="btns mb-4">
    <button onclick="expandAll()" class="btn bg-green-500 hover:bg-green-600 text-white">📂 Desplegar todos</button>
    <button onclick="collapseAll()" class="btn bg-red-500 hover:bg-red-600 text-white">📁 Colapsar todos</button>
    <button onclick="printPDF()" class="btn bg-blue-500 hover:bg-blue-600 text-white">🖨 Imprimir</button>
    <button onclick="(()=>{const a=document.createElement('a');a.download='${(summaryTitle || presentation.title).replace(/\"/g,'')}.html';a.href=URL.createObjectURL(new Blob([document.documentElement.outerHTML],{type:'text/html'}));a.click()})()" class="btn bg-indigo-600 hover:bg-indigo-700 text-white">💾 Descargar HTML</button>
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

  const renderSection = (section: any, level = 1, idx = 0) => {
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

    const isTop = level === 1;

    return (
      <details
        className={`border rounded-lg overflow-hidden ${
          isTop
            ? "lvl1 bg-gray-800 border-gray-700"
            : level === 2
            ? "ml-2 sm:ml-4 bg-gray-700 border-gray-600"
            : "ml-4 sm:ml-8 bg-gray-600 border-gray-500"
        } w-full`}
      >
        <summary
          className={summaryClass}
          onClick={isTop ? (e) => handleTopSummaryClick(e, idx) : undefined}
        >
          {section.emoji} {section.title}
        </summary>
        {section.content && <p className={contentClass}>{section.content}</p>}
        {Array.isArray(section.subsections) &&
          section.subsections.map((sub: any, i: number) => renderSection(sub, level + 1, i))}
      </details>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fadeIn">
      <div className="flex items-stretch sm:items-center justify-between gap-3 mb-3 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
          {/* explicación eliminada en la presentación */}
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

      {/* Botonera: izquierda y ~30% menos ancha (px reducido) */}
      <div className="flex flex-wrap gap-2 justify-start mb-3 sm:mb-6">
        <button
          onClick={expandAll}
          className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm"
          style={{ paddingLeft: "0.7rem", paddingRight: "0.7rem" }}
        >
          📂 Desplegar todos
        </button>
        <button
          onClick={collapseAll}
          className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm"
          style={{ paddingLeft: "0.7rem", paddingRight: "0.7rem" }}
        >
          📁 Colapsar todos
        </button>
        <button
          onClick={printPDF}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm"
          style={{ paddingLeft: "0.7rem", paddingRight: "0.7rem" }}
        >
          🖨 Imprimir
        </button>
        <button
          onClick={downloadHTML}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm"
          style={{ paddingLeft: "0.7rem", paddingRight: "0.7rem" }}
        >
          💾 Descargar HTML
        </button>
      </div>

      <div ref={containerRef} className="space-y-3">
        {presentation.sections.map((section, i) => renderSection(section, 1, i))}
      </div>
    </div>
  );
};

export default PresentationView;
