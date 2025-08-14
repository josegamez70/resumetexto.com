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
    <div className="flex items-start gap-2 sm:gap-3 my-1">
      {/* Nodo */}
      <button
        className="shrink-0 rounded-lg sm:rounded-xl px-3 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-left w-full sm:w-auto"
        onClick={() => hasChildren && setOpen((v) => !v)}
        title={hasChildren ? (open ? "Colapsar" : "Expandir") : "Nodo"}
      >
        <div className="font-semibold text-sm sm:text-base leading-snug">{node.label}</div>
        {node.note && <div className="text-xs text-gray-400 mt-1 leading-snug">{node.note}</div>}
      </button>

      {/* Hijos: en móvil sin borde; en ≥sm con borde lateral */}
      {open && hasChildren && (
        <div className="pl-2 sm:pl-5 sm:border-l border-gray-700 flex flex-col gap-2 sm:gap-3 w-full">
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
  details.mind{display:flex;align-items:flex-start;gap:.6rem;margin:.25rem 0}
  details.mind > summary{display:inline-flex;align-items:flex-start;list-style:none;cursor:pointer}
  summary::-webkit-details-marker{display:none}
  .marker{display:inline-flex;width:1.5rem;height:1.5rem;border-radius:.375rem;background:#374151;align-items:center;justify-content:center;margin-right:.5rem;font-weight:700;color:#fff}
  details.mind[open] > summary .marker::after{content:"−"}
  details.mind:not([open]) > summary .marker::after{content:"+"}
  .node .label{font-weight:600}
  .node .note{font-size:.8rem;color:#9ca3af;margin-top:.15rem}
  /* móvil: sin borde en cascada */
  details.mind > .children{padding-left:.75rem}
  @media (min-width:640px){
    body{overflow-x:auto}
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental</h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={() => setExpandAllSeq((v) => v + 1)} className="w-full sm:w-auto px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm">Desplegar todos</button>
            <button onClick={() => setCollapseAllSeq((v) => v + 1)} className="w-full sm:w-auto px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">Colapsar todos</button>
            <button onClick={downloadHTML} className="w-full sm:w-auto px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">Descargar HTML</button>
            <button onClick={onBack} className="w-full sm:w-auto px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm">Volver</button>
          </div>
        </div>

        {/* Vista en-app (compacta en móvil) */}
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
