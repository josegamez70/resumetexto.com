import React, { useEffect, useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  colorMode: MindMapColorMode;
  onBack: () => void;
};

// paleta para modo "color"
const palette = [
  "bg-rose-600 text-white border-rose-700",
  "bg-amber-500 text-black border-amber-600",
  "bg-emerald-600 text-white border-emerald-700",
  "bg-sky-600 text-white border-sky-700",
  "bg-fuchsia-600 text-white border-fuchsia-700",
  "bg-lime-600 text-black border-lime-700",
];

function tagClass(level: number, colorMode: MindMapColorMode, siblingIndex: number) {
  if (level === 0) {
    return "bg-black text-white border-2 border-gray-500 font-extrabold text-sm sm:text-base px-4 py-2.5 rounded-xl";
  }
  if (colorMode === MindMapColorMode.BlancoNegro) {
    return "bg-gray-800 text-white border border-gray-600 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg";
  }
  const pick = palette[siblingIndex % palette.length];
  return `${pick} font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg border`;
}

const NodeBox: React.FC<{
  node: MindMapNode;
  level: number;
  idx: number;
  colorMode: MindMapColorMode;
  expandAllSeq: number;
  collapseAllSeq: number;
}> = ({ node, level, idx, colorMode, expandAllSeq, collapseAllSeq }) => {
  const [open, setOpen] = useState(level === 0);
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);

  const hasChildren = (node.children?.length || 0) > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start gap-1.5 sm:gap-3 my-0.5">
      {/* Etiqueta */}
      <button
        className={`${tagClass(level, colorMode, idx)} shrink-0 text-left w-full sm:w-auto`}
        onClick={() => hasChildren && setOpen((v) => !v)}
        title={hasChildren ? (open ? "Colapsar" : "Expandir") : "Nodo"}
      >
        <div className="leading-tight">{node.label}</div>
        {node.note && <div className="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-tight">{node.note}</div>}
      </button>

      {/* Conector SOLO móvil cuando abierto */}
      {open && hasChildren && (
        <div className="sm:hidden w-px h-2 bg-gray-600 ml-4" aria-hidden="true" />
      )}

      {/* Hijos: móvil debajo; desktop a la derecha con borde-l */}
      {open && hasChildren && (
        <div className="pl-3 sm:pl-4 border-l border-gray-700 flex flex-col gap-1.5 sm:gap-2 w-full">
          {node.children!.map((c, i) => (
            <NodeBox
              key={c.id}
              node={c}
              level={level + 1}
              idx={i}
              colorMode={colorMode}
              expandAllSeq={expandAllSeq}
              collapseAllSeq={collapseAllSeq}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MindMapView: React.FC<Props> = ({ data, summaryTitle, colorMode, onBack }) => {
  const [expandAllSeq, setExpandAllSeq] = useState(0);
  const [collapseAllSeq, setCollapseAllSeq] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const pageTitle = useMemo(
    () => summaryTitle || data.root.label || "Mapa mental",
    [summaryTitle, data.root.label]
  );

  // --- Export HTML (con colorMode) ---
  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const tagClassHTML = (level: number, cm: MindMapColorMode, idx: number) => {
    if (level === 0) return "bg-black text-white border-2 border-gray-500 font-extrabold text-sm sm:text-base px-4 py-2.5 rounded-xl";
    if (cm === "bw") return "bg-gray-800 text-white border border-gray-600 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg";
    const pick = palette[idx % palette.length];
    return `${pick} font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg border`;
  };

  const detailsTreeHTML = (node: MindMapNode, open: boolean, level = 0, idx = 0): string => {
    const hasChildren = (node.children?.length || 0) > 0;
    const kids = hasChildren ? node.children!.map((c, i) => detailsTreeHTML(c, false, level + 1, i)).join("") : "";
    const tag = tagClassHTML(level, colorMode, idx);
    return `
<details class="mind" ${open ? "open" : ""}>
  <summary class="inline-flex items-start">
    <span class="marker sm:hidden" aria-hidden="true"></span>
    <div class="${tag}">
      <div class="leading-tight">${esc(node.label)}</div>
      ${node.note ? `<div class="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-tight">${esc(node.note)}</div>` : ""}
    </div>
  </summary>
  ${
    hasChildren
      ? `<div class="connector sm:hidden" aria-hidden="true"></div>
         <div class="children">${kids}</div>`
      : ""
  }
</details>`;
  };

  const downloadHTML = () => {
    const tree = detailsTreeHTML(data.root, true, 0, 0);
    const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body{height:100%} body{max-width:100%;overflow-x:hidden}
  details.mind{display:flex;flex-direction:column;gap:.5rem;margin:.2rem 0}
  details.mind > summary{display:inline-flex;align-items:flex-start;list-style:none;cursor:pointer}
  summary::-webkit-details-marker{display:none}
  .marker{display:inline-flex;width:1.25rem;height:1.25rem;border-radius:.375rem;background:#374151;align-items:center;justify-content:center;margin-right:.4rem;font-weight:700;color:#fff;font-size:.8rem;line-height:1.25rem}
  details.mind[open] > summary .marker::after{content:"−"}
  details.mind:not([open]) > summary .marker::after{content:"+"}
  .connector{width:1px;height:.6rem;background:#374151;margin-left:1.65rem}
  .children{padding-left:.6rem}
  @media (min-width:640px){
    body{overflow-x:auto}
    details.mind{flex-direction:row;align-items:flex-start;gap:.75rem}
    .connector{display:none}
    .children{border-left:1px solid #374151;padding-left:1rem}
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

  <div>${tree}</div>
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
        {/* Cabecera: SOLO Volver (outline rojo) */}
        <div className="flex items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental</h2>
          <div className="w-full sm:w-auto">
            <button
              onClick={onBack}
              className="w-full sm:w-auto border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Controles */}
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

        {/* Vista en-app */}
        <div ref={containerRef}>
          <NodeBox
            node={data.root}
            level={0}
            idx={0}
            colorMode={colorMode}
            expandAllSeq={expandAllSeq}
            collapseAllSeq={collapseAllSeq}
          />
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
