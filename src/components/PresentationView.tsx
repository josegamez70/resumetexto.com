// src/components/PresentationView.tsx
import React, { useRef } from "react";
import { PresentationData, PresentationType } from "../types";

interface PresentationViewProps {
  presentation: PresentationData;
  presentationType: PresentationType;
  summaryTitle: string;
  onBackToSummary: () => void;
  onHome?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  Extensive: "Extensa (detalle)",
  Complete: "Completa (+50% detalle)",
  Integro: "Íntegro (muy completo, máximo alcance)",
  Kids: "Para Niños",
};

const PresentationView: React.FC<PresentationViewProps> = ({
  presentation,
  presentationType,
  summaryTitle,
  onBackToSummary,
  onHome,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const HomeBtn = (
    <button
      onClick={onHome || onBackToSummary}
      className="inline-flex items-center justify-center gap-2 border border-gray-600 text-gray-100 hover:bg-gray-700/40 px-4 py-2 rounded-lg w-full sm:w-auto"
      aria-label="Inicio"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3l9 8h-3v7h-5v-5H11v5H6v-7H3l9-8z"/>
      </svg>
      <span>Inicio</span>
    </button>
  );

  if (!presentation || !presentation.sections) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fadeIn text-center">
        <p>No hay datos para mostrar.</p>
        <div className="mt-4 flex justify-center">{HomeBtn}</div>
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

  const handleTopSummaryClick = (e: React.MouseEvent, _idx: number) => {
    e.preventDefault();
    const detailsEl = (e.currentTarget as HTMLElement).parentElement as HTMLDetailsElement;
    if (!containerRef.current || !detailsEl) return;
    const isOpen = detailsEl.hasAttribute("open");
    if (isOpen) detailsEl.removeAttribute("open");
    else {
      containerRef.current.querySelectorAll("details.lvl1").forEach((d) => d.removeAttribute("open"));
      detailsEl.setAttribute("open", "true");
    }
  };

  const downloadHTML = () => {
    if (!containerRef.current) return;
    const safeTitle =
      (summaryTitle || presentation.title || "presentacion")
        .replace(/[^a-z0-9_\- .]/gi, "")
        .trim() || "presentacion";
    const prettyType = TYPE_LABELS[String(presentationType)] || String(presentationType);

    const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${summaryTitle || presentation.title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body{height:100%}
  body{max-width:100%;overflow-x:hidden}
  details{width:100%;max-width:100%}
  summary{list-style:none}
  summary::-webkit-details-marker{display:none}
  summary, p { word-break: break-word; overflow-wrap: anywhere; }
</style>
<script>
window._bulkOpen = false;
function expandAll(){ window._bulkOpen = true; document.querySelectorAll('details').forEach(d=>d.open=true); setTimeout(()=>{ window._bulkOpen = false; }, 0); }
function collapseAll(){ document.querySelectorAll('details').forEach(d=>d.open=false) }
function printPDF(){ window.print() }
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
    <h3 class="text-sm sm:text-lg italic text-yellow-400">${summaryTitle || ""}</h3>
    <p class="text-xs sm:text-sm text-gray-400 italic">Tipo: ${prettyType}</p>
  </div>
  <div class="flex flex-wrap gap-2 justify-start mb-4">
    <button onclick="expandAll()" class="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm">📂 Desplegar todos</button>
    <button onclick="collapseAll()" class="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm">📁 Colapsar todos</button>
    <button onclick="printPDF()" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm">🖨 Imprimir</button>
  </div>
  <div class="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4 space-y-3 overflow-x-hidden">
    ${containerRef.current.innerHTML}
  </div>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = (section: any, level = 1, idx = 0) => {
    let summaryClass =
      "bg-yellow-500 text-black px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
    let contentClass = "p-3 sm:p-4 whitespace-pre-line text-sm sm:text-base break-words";
    if (level === 2) {
      summaryClass = "bg-blue-600 text-white px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
      contentClass = "p-3 sm:p-4 bg-blue-100 text-black whitespace-pre-line text-sm sm:text-base break-words";
    }
    if (level >= 3) {
      summaryClass = "bg-yellow-200 text-gray-800 px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
      contentClass = "p-3 sm:p-4 bg-yellow-50 text-gray-800 whitespace-pre-line text-sm sm:text-base break-words";
    }
    const isTop = level === 1;

    const getSubs = (s: any) => [
      ...(Array.isArray(s.subsections) ? s.subsections : []),
      ...(Array.isArray(s.children) ? s.children : []),
    ];

    return (
      <details
        className={`border rounded-lg overflow-hidden w-full max-w-full ${
          isTop
            ? "lvl1 bg-gray-800 border-gray-700"
            : level === 2
            ? "bg-gray-700 border-gray-600 pl-2 sm:pl-4"
            : "bg-gray-600 border-gray-500 pl-3 sm:pl-6"
        }`}
        key={(section.id ?? section.title ?? "sec") + "-" + level + "-" + idx}
      >
        <summary
          className={summaryClass}
          onClick={isTop ? (e) => handleTopSummaryClick(e, idx) : undefined}
        >
          {section.emoji} {section.title}
        </summary>
        {section.content && <p className={contentClass}>{section.content}</p>}
        {getSubs(section).map((sub: any, i: number) => renderSection(sub, level + 1, i))}
      </details>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
          <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
          <p className="text-xs sm:text-sm text-gray-400 italic">
            Tipo: {TYPE_LABELS[String(presentationType)] || String(presentationType)}
          </p>
        </div>
        <div className="w-full sm:w-auto flex justify-center">{HomeBtn}</div>
      </div>

      <div className="flex flex-wrap gap-2 justify-start mb-3 sm:mb-6">
        <button onClick={expandAll} className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm">📂 Desplegar todos</button>
        <button onClick={collapseAll} className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm">📁 Colapsar todos</button>
        <button onClick={printPDF} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm">🖨 Imprimir</button>
        <button onClick={downloadHTML} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm">💾 Descargar HTML</button>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4 overflow-x-hidden">
        <div ref={containerRef} className="space-y-3">
          {presentation.sections.map((section, i) => renderSection(section, 1, i))}
        </div>
      </div>
    </div>
  );
};

export default PresentationView;
