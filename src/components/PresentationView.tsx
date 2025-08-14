import React, { useRef } from "react";
import { PresentationData, PresentationType } from "../types";

interface PresentationViewProps {
  presentation: PresentationData;
  presentationType: PresentationType;
  summaryTitle: string;
  onMindMap: () => void;
  onReset: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({
  presentation,
  presentationType,
  summaryTitle,
  onMindMap,
  onReset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!presentation || !presentation.sections) {
    return (
      <div className="text-center p-6 animate-fadeIn">
        <p>No hay datos para mostrar.</p>
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black"
        >
          Volver
        </button>
      </div>
    );
  }

  const expandAll = () => {
    if (containerRef.current) {
      containerRef.current.querySelectorAll("details").forEach((d) => d.setAttribute("open", "true"));
    }
  };

  const collapseAll = () => {
    if (containerRef.current) {
      containerRef.current.querySelectorAll("details").forEach((d) => d.removeAttribute("open"));
    }
  };

  const printPDF = () => {
    window.print();
  };

  const renderSection = (section: any, level = 1) => {
    let summaryClass =
      "bg-yellow-500 text-black px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base";
    let contentClass = "p-3 sm:p-4 whitespace-pre-line text-sm sm:text-base";

    if (level === 2) {
      summaryClass =
        "bg-blue-600 text-white px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base";
      contentClass =
        "p-3 sm:p-4 bg-blue-100 text-black whitespace-pre-line text-sm sm:text-base";
    }
    if (level === 3) {
      summaryClass =
        "bg-yellow-200 text-gray-800 px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base";
      contentClass =
        "p-3 sm:p-4 bg-yellow-50 text-gray-800 whitespace-pre-line text-sm sm:text-base";
    }

    return (
      <details
        className={`border rounded-lg overflow-hidden ${
          level === 1
            ? "bg-gray-800 border-gray-700"
            : level === 2
            ? "ml-3 sm:ml-4 bg-gray-700 border-gray-600"
            : "ml-6 sm:ml-8 bg-gray-600 border-gray-500"
        } w-full`}
      >
        <summary className={summaryClass}>
          {section.emoji} {section.title}
        </summary>
        {section.content && <p className={contentClass}>{section.content}</p>}
        {section.subsections &&
          section.subsections.map((sub: any) => renderSection(sub, level + 1))}
      </details>
    );
  };

  const downloadHTML = () => {
    if (!containerRef.current) return;
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${summaryTitle || presentation.title}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html, body { height: 100%; }
  body { max-width: 100%; overflow-x: hidden; }
  details { width: 100%; }
  summary { list-style: none; }
  summary::-webkit-details-marker { display: none; }
</style>
<script>
function expandAll(){ document.querySelectorAll('details').forEach(d=>d.setAttribute('open','true')); }
function collapseAll(){ document.querySelectorAll('details').forEach(d=>d.removeAttribute('open')); }
function printPDF(){ window.print(); }
</script>
</head>
<body class="bg-gray-900 text-white p-4 sm:p-6">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <div>
      <h1 class="text-xl sm:text-2xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
      <h3 class="text-base sm:text-lg italic text-yellow-400">${summaryTitle || ""}</h3>
      <p class="text-xs sm:text-sm text-gray-400 italic">Tipo: ${presentationType}</p>
    </div>
    <!-- SOLO AJUSTE DE BOTONES EN MÓVIL -->
    <div class="grid grid-cols-1 xs:grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
      <button onclick="expandAll()" class="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm">📂 Desplegar todos</button>
      <button onclick="collapseAll()" class="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm">📁 Colapsar todos</button>
      <button onclick="printPDF()" class="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">🖨 Imprimir</button>
      <a href="#" onclick="history.back();return false;" class="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-center text-sm">Volver</a>
    </div>
  </div>

  <div class="space-y-3">
    ${containerRef.current.innerHTML}
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summaryTitle || presentation.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
          <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
          <p className="text-xs sm:text-sm text-gray-400 italic">Tipo: {presentationType}</p>
        </div>

        {/* SOLO AJUSTE DE BOTONES EN MÓVIL */}
        <div className="grid grid-cols-1 sm:flex gap-2 w-full sm:w-auto">
          <button
            onClick={downloadHTML}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            💾 Descargar HTML
          </button>
          <button
            onClick={onMindMap}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
            title="Ver como Mapa mental (resumido)"
          >
            🧠 Mapa mental
          </button>
          <button
            onClick={onReset}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Volver
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:flex gap-2 mb-4 sm:mb-6">
        <button onClick={expandAll} className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm">📂 Desplegar todos</button>
        <button onClick={collapseAll} className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">📁 Colapsar todos</button>
        <button onClick={printPDF} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">🖨 Imprimir</button>
      </div>

      <div ref={containerRef} className="space-y-3">
        {presentation.sections.map((section) => renderSection(section, 1))}
      </div>
    </div>
  );
};

export default PresentationView;
