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
      containerRef.current
        .querySelectorAll("details")
        .forEach((d) => d.setAttribute("open", "true"));
    }
  };

  const collapseAll = () => {
    if (containerRef.current) {
      containerRef.current
        .querySelectorAll("details")
        .forEach((d) => d.removeAttribute("open"));
    }
  };

  const printPDF = () => {
    window.print();
  };

  const downloadHTML = () => {
    function renderHTMLSection(section: any, level = 1) {
      let summaryClass = "section-summary";
      let contentClass = "section-content";

      // Nivel 2: subdesplegable gris
      if (level === 2) {
        summaryClass = "section-summary-gray";
        contentClass = "section-content-gray";
      }
      // Nivel 3: sub-subdesplegable celeste
      if (level === 3) {
        summaryClass = "section-summary-blue";
        contentClass = "section-content-blue";
      }

      return `
<details class="level-${level}">
  <summary class="${summaryClass}">${section.emoji} ${section.title}</summary>
  ${section.content ? `<p class="${contentClass}">${section.content}</p>` : ""}
  ${
    section.subsections && section.subsections.length > 0
      ? section.subsections.map(sub => renderHTMLSection(sub, level + 1)).join("")
      : ""
  }
</details>`;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${presentation.title}</title>
<style>
  body { font-family: Arial, sans-serif; background: #111; color: #fff; padding: 20px; }
  details { border: 1px solid #444; margin: 5px 0; border-radius: 8px; overflow: hidden; background: #222; }
  summary { padding: 8px 12px; font-weight: bold; cursor: pointer; }
  
  /* Nivel 1 */
  .section-summary { background: #FFD700; color: #000; }
  .section-content { padding: 10px; background: #333; white-space: pre-line; }
  
  /* Nivel 2 - Gris */
  .level-2 { margin-left: 20px; }
  .section-summary-gray { background: #888; color: #fff; }
  .section-content-gray { padding: 10px; background: #aaa; color: #000; }
  
  /* Nivel 3 - Celeste */
  .level-3 { margin-left: 40px; }
  .section-summary-blue { background: #00bfff; color: #000; }
  .section-content-blue { padding: 10px; background: #bdeaff; color: #000; }

  /* Botones */
  button { margin-right: 10px; padding: 8px 12px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
  .btn-expand { background: #28a745; color: white; }
  .btn-collapse { background: #dc3545; color: white; }
  .btn-print { background: #007bff; color: white; }
</style>
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
<body>
<h1>${presentation.title}</h1>
<p><em>Tipo de presentación: ${presentationType}</em></p>

<div style="margin-bottom: 15px;">
  <button class="btn-expand" onclick="expandAll()">📂 Desplegar todos</button>
  <button class="btn-collapse" onclick="collapseAll()">📁 Colapsar todos</button>
  <button class="btn-print" onclick="printPDF()">🖨 Imprimir a PDF</button>
</div>

${presentation.sections.map(section => renderHTMLSection(section)).join("")}

</body>
</html>
`;

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
      {/* Cambio de título */}
      <h1 className="text-3xl font-bold mb-6">Mapa Mental, esquema resumen interactivo</h1>
      <p className="mb-4 text-gray-400 italic">
        Tipo de presentación: {presentationType}
      </p>

      {/* Botones de control */}
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
        {/* Botón HTML modificado */}
        <button
          onClick={downloadHTML}
          className="bg-gray-300 hover:bg-gray-400 text-black border border-black px-4 py-2 rounded-lg"
        >
          💾 Descargar HTML Interactivo
        </button>
      </div>

      {/* Contenido */}
      <div ref={containerRef} className="space-y-3">
        {presentation.sections.map((section, index) => (
          <details
            key={index}
            className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800"
          >
            <summary className="bg-yellow-500 text-black px-4 py-2 font-semibold cursor-pointer select-none">
              {section.emoji} {section.title}
            </summary>
            {section.content && (
              <p className="p-4 whitespace-pre-line">{section.content}</p>
            )}
            {section.subsections &&
              section.subsections.length > 0 &&
              section.subsections.map((sub, subIndex) => (
                <details
                  key={subIndex}
                  className="ml-4 mt-2 border border-gray-600 rounded bg-gray-700"
                >
                  <summary className="bg-yellow-400 text-black px-3 py-1 font-medium cursor-pointer select-none">
                    {sub.emoji} {sub.title}
                  </summary>
                  {sub.content && (
                    <p className="p-3 whitespace-pre-line">{sub.content}</p>
                  )}
                </details>
              ))}
          </details>
        ))}
      </div>

      {/* Botón volver */}
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
