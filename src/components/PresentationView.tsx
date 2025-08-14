import React, { useRef } from "react";
import { PresentationData, PresentationType } from "../types";

interface PresentationViewProps {
  presentation: PresentationData;
  presentationType: PresentationType;
  summaryTitle: string;
  onMindMap: () => void;   // <-- NUEVO
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

  const downloadHTML = () => {
    if (!containerRef.current) return;
    const htmlContent = `<!DOCTYPE html>
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
<h1 class="text-2xl sm:text-3xl font-bold mb-2">Mapa Mental, esquema resumen interactivo</h1>
<h3 class="text-lg italic text-yellow-400 mb-6">${summaryTitle || ""}</h3>
<p class="mb-4 italic text-gray-400">Tipo de presentación: ${presentationType}</p>

<div class="flex flex-wrap gap-2 sm:gap-4 mb-6">
  <button onclick="expandAll()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg">📂 Desplegar todos</button>
  <button onclick="collapseAll()" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg">📁 Colapsar todos</button>
  <button onclick="printPDF()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg">🖨 Imprimir a PDF</button>
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📑 Presentación ({presentationType})</h2>
          <div className="flex gap-2">
            <button
              onClick={onMindMap}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
              title="Ver como Mapa Mental"
            >
              🧠 Ver como Mapa Mental
            </button>
            <button
              onClick={downloadHTML}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Descargar HTML
            </button>
            <button
              onClick={onReset}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              Volver
            </button>
          </div>
        </div>

        <div ref={containerRef} className="space-y-3">
          {presentation.sections.map((section, idx) => (
            <details key={idx} className="bg-gray-800 rounded-lg p-4">
              <summary className="cursor-pointer font-semibold">
                <span className="mr-2">{section.emoji}</span>
                {section.title}
              </summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
                {section.content}
              </p>

              {!!section.subsections?.length && (
                <div className="mt-3 space-y-2">
                  {section.subsections!.map((sub, sidx) => (
                    <details key={sidx} className="bg-gray-900 rounded-lg p-3">
                      <summary className="cursor-pointer font-medium">
                        <span className="mr-2">{sub.emoji}</span>
                        {sub.title}
                      </summary>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-400">
                        {sub.content}
                      </p>
                    </details>
                  ))}
                </div>
              )}
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PresentationView;
