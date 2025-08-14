import React, { useEffect, useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode } from "../types";

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  onBack: () => void;
};

const NodeBox: React.FC<{
  node: MindMapNode;
  level: number;
  expandAllSeq: number;
  collapseAllSeq: number;
}> = ({ node, level, expandAllSeq, collapseAllSeq }) => {
  const [open, setOpen] = useState(level === 0);
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);

  const hasChildren = (node.children?.length || 0) > 0;

  return (
    <div className="flex items-start gap-1.5 sm:gap-3 my-0.5">
      {/* Nodo: más compacto en móvil */}
      <button
        className="shrink-0 rounded-md sm:rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-left w-full sm:w-auto"
        onClick={() => hasChildren && setOpen((v) => !v)}
        title={hasChildren ? (open ? "Colapsar" : "Expandir") : "Nodo"}
      >
        <div className="font-semibold text-xs sm:text-sm leading-tight">{node.label}</div>
        {node.note && <div className="text-[11px] sm:text-xs text-gray-400 mt-0.5 leading-tight">{node.note}</div>}
      </button>

      {/* Hijos: sin borde en móvil; con borde a partir de sm */}
      {open && hasChildren && (
        <div className="pl-1.5 sm:pl-4 sm:border-l border-gray-700 flex flex-col gap-1.5 sm:gap-2 w-full">
          {node.children!.map((c) => (
            <NodeBox
              key={c.id}
              node={c}
              level={level + 1}
              expandAllSeq={expandAllSeq}
              collapseAllSeq={collapseAllSeq}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MindMapView: React.FC<Props> = ({ data, summaryTitle, onBack }) => {
  const [expandAllSeq, setExpandAllSeq] = useState(0);
  const [collapseAllSeq, setCollapseAllSeq] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const pageTitle = useMemo(
    () => summaryTitle || data.root.label || "Mapa mental",
    [summaryTitle, data.root.label]
  );

  // --- Helpers para descarga (HTML con <details>) ---
  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const detailsTreeHTML = (node: MindMapNode, open: boolean): string => {
    const hasChildren = (node.children?.length || 0) > 0;
    const kids = hasChildren ? node.children!.map((c) => detailsTreeHTML(c, false)).join("") : "";
    return `
<details class="mind" ${open ? "open" : ""}>
  <summary>
    <span class="marker" aria-hidden="true"></span>
    <div class="node">
      <div class="label">${esc(node.label)}</div>
      ${node.note ? `<div class="note">${esc(node.note)}</div>` : ""}
    </div>
  </summary>
  ${hasChildren ? `<div class="children">${kids}</div>` : ""}
</details>`;
  };

  const downloadHTML = () => {
    const tree = detailsTreeHTML(data.root, true);
    const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body{height:100%} body{max-width:100%;overflow-x:hidden}
  /* Compacto móvil */
  details.mind{display:flex;align-items:flex-start;gap:.5rem;margin:.2rem 0}
  details.mind > summary{display:inline-flex;align-items:flex-start;list-style:none;cursor:pointer}
  summary::-webkit-details-marker{display:none}
  .marker{display:inline-flex;width:1.25rem;height:1.25rem;border-radius:.375rem;background:#374151;align-items:center;justify-content:center;margin-right:.4rem;font-weight:700;color:#fff;font-size:.8rem;line-height:1.25rem}
  details.mind[open] > summary .marker::after{content:"−"}
  details.mind:not([open]) > summary .marker::after{content:"+"}
  .node .label{font-weight:600;font-size:.9rem}
  .node .note{font-size:.75rem;color:#9ca3af;margin-top:.1rem}
  details.mind > .children{padding-left:.6rem}
  @media (min-width:640px){
    body{overflow-x:auto}
    details.mind{gap:.75rem;margin:.25rem 0}
    .marker{width:1.5rem;height:1.5rem;font-size:.9rem}
    .node .label{font-size:1rem}
    details.mind > .children{border-left:1px solid #374151;padding-left:1rem}
  }
</style>
<script>
  function expandAll(){ document.querySelectorAll('details.mind').forEach(d=>d.setAttribute('open','')) }
  function collapseAll(){ document.querySelectorAll('details.mind').forEach(d=>d.removeAttribute('open')) }
  function printPDF(){ window.print() }
</script>
</head>
<body class="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
  <h1 class="text-xl sm:text-2xl font-bold mb-1">Mapa mental</h1>
  <h3 class="text-base sm:text-lg italic text-yellow-400 mb-4">${esc(pageTitle)}</h3>

  <div class="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4">
    <button onclick="expandAll()" class="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm">📂 Desplegar todos</button>
    <button onclick="collapseAll()" class="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm">📁 Colapsar todos</button>
    <button onclick="printPDF()" class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">🖨 Imprimir a PDF</button>
  </div>

  <div>
    ${tree}
  </div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageTitle}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Cabecera: SOLO Volver */}
        <div className="flex items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental</h2>
          <div className="w-full sm:w-auto">
            <button onClick={onBack} className="w-full sm:w-auto px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm">
              Volver
            </button>
          </div>
        </div>

        {/* Controles debajo del título */}
        <div className="grid grid-cols-1 sm:flex gap-2 mb-3 sm:mb-5">
          <button onClick={() => setExpandAllSeq((v) => v + 1)} className="w-full sm:w-auto px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm">
            Desplegar todos
          </button>
          <button onClick={() => setCollapseAllSeq((v) => v + 1)} className="w-full sm:w-auto px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">
            Colapsar todos
          </button>
          <button onClick={downloadHTML} className="w-full sm:w-auto px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
            Descargar HTML
          </button>
        </div>

        {/* Vista en-app (más compacta en móvil) */}
        <div ref={containerRef}>
          <NodeBox
            node={data.root}
            level={0}
            expandAllSeq={expandAllSeq}
            collapseAllSeq={collapseAllSeq}
          />
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
