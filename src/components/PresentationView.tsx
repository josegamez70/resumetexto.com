import React, { useRef } from "react";
import { PresentationData, PresentationType } from "../types";

interface PresentationViewProps {
  presentation: PresentationData;
  presentationType: PresentationType;
  onReset: () => void;
}

const PresentationView: React.FC<PresentationViewProps> = ({
  presentation,
  presentationType,
  onReset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!presentation || !presentation.sections) {
    return (
      <div className="text-center p-6 animate-fadeIn">
        <p>No hay datos de presentación para mostrar.</p>
        <button
          onClick={onReset}
          className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white"
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
    let summaryClass = "bg-yellow-500 text-black px-4 py-2 font-semibold cursor-pointer select-none";
    let contentClass = "p-4 whitespace-pre-line";

    if (level === 2) {
      summaryClass = "bg-blue-600 text-white px-4 py-2 font-semibold cursor-pointer select-none";
      contentClass = "p-4 bg-blue-100 text-black whitespace-pre-line";
    }
    if (level === 3) {
      summaryClass = "bg-yellow-200 text-gray-800 px-4 py-2 font-semibold cursor-pointer select-none";
      contentClass = "p-4 bg-yellow-50 text-gray-800 whitespace-pre-line";
    }

    return (
      <details
        className={`border rounded-lg overflow-hidden ${level === 1 ? "bg-gray-800 border-gray-700" : level === 2 ? "ml-4 bg-gray-700 border-gray-600" : "ml-8 bg-gray-600 border-gray-500"}`}
      >
        <summary className={summaryClass}>
          {section.emoji} {section.title}
        </summary>
        {section.content && <p className={contentClass}>{section.content}</p>}
        {section.subsections &&
          section.subsections.map((sub: any, idx: number) => renderSection(sub, level + 1))}
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
<title>${presentation.title}</title>
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
<script>
function expandAll() {
  document.querySelectorAll('details').forEach(d => d.setAttribute('open', 'true'));
}
function collapseAll() {
  document.querySelectorAll('details').forEach(d => d.removeAttribute('open'));
}
function printPDF() {
  window.print();
}
</script>
</head>
<body class="bg-gray-900 text-white p-6">
<h1 class="text-3xl font-bold mb-6">Mapa Mental, esquema resumen interactivo</h1>
<p class="mb-4 italic text-gray-400">Tipo de presentación: ${presentationType}</p>

<div class="flex gap-4 mb-6 flex-wrap">
  <button onclick="expandAll()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">📂 Desplegar todos</button>
  <button onclick="collapseAll()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg">📁 Colapsar todos</button>
  <button onclick="printPDF()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">🖨 Imprimir a PDF</button>
</div>

<div>
${containerRef.current.innerHTML}
</div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentation.title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <h1 className="text-3xl font-bold mb-6">Mapa Mental, esquema resumen interactivo</h1>
      <p className="mb-4 text-gray-400 italic">
        Tipo de presentación: {presentationType}
      </p>

      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={expandAll}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          📂 Desplegar todos
        </button>
        <button
          onClick={collapseAll}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          📁 Colapsar todos
        </button>
        <button
          onClick={printPDF}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          🖨 Imprimir a PDF
        </button>
        <div>
          <button
            onClick={downloadHTML}
            className="bg-gray-300 hover:bg-gray-400 text-black border border-black px-4 py-2 rounded-lg"
          >
            💾 Descargar HTML Interactivo
          </button>
          <p className="text-gray-400 text-sm mt-1">
            Para más detalle y desplegables
          </p>
        </div>
      </div>

      <div ref={containerRef} className="space-y-3">
        {presentation.sections.map((section, index) =>
          renderSection(section, 1)
        )}
      </div>

      <div className="mt-8">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default PresentationView;
