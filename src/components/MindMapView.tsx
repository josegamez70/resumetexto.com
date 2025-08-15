import React, { useEffect, useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  colorMode: MindMapColorMode;
  onBack: () => void;
};

// Paleta base para los hijos de la RAÍZ (nivel 1).
// A partir de ahí, las ramas heredan el color y se aclara por nivel.
type HSL = { h: number; s: number; l: number };
const paletteLevel1: HSL[] = [
  { h: 355, s: 80, l: 45 }, // rojizo
  { h: 45, s: 90, l: 50 },  // ámbar
  { h: 140, s: 60, l: 40 }, // verde
  { h: 200, s: 80, l: 45 }, // azul cielo
  { h: 280, s: 70, l: 45 }, // fucsia
  { h: 90, s: 70, l: 45 },  // lima
];

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function hslStr(c: HSL) { return `hsl(${c.h}deg ${c.s}% ${c.l}%)`; }
function lighten(c: HSL, dl: number) { return { ...c, l: clamp(c.l + dl, 10, 92) }; }
function darken(c: HSL, dl: number) { return { ...c, l: clamp(c.l - dl, 0, 90) }; }
function textOn(bg: HSL) { return bg.l >= 62 ? "#000" : "#fff"; }

function styleForTag(level: number, colorMode: MindMapColorMode, color: HSL | null) {
  if (level === 0) {
    return {
      backgroundColor: "#000",
      color: "#fff",
      border: "2px solid #6b7280", // gris-500
      fontWeight: 800,
      padding: "10px 16px",
      borderRadius: "12px",
    } as React.CSSProperties;
  }
  if (colorMode === MindMapColorMode.BlancoNegro || !color) {
    return {
      backgroundColor: "#1f2937",
      color: "#fff",
      border: "1px solid #4b5563",
      fontWeight: 600,
      padding: "8px 14px",
      borderRadius: "10px",
    } as React.CSSProperties;
  }
  const bg = hslStr(color);
  const border = hslStr(darken(color, 10));
  const fg = textOn(color);
  return {
    backgroundColor: bg,
    color: fg,
    border: `1px solid ${border}`,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: "10px",
  } as React.CSSProperties;
}

function styleForChildrenContainer(colorMode: MindMapColorMode, parentColor: HSL | null) {
  if (colorMode === MindMapColorMode.BlancoNegro || !parentColor) {
    return { borderLeft: "1px solid #374151" } as React.CSSProperties; // gris-700
  }
  return { borderLeft: `2px solid ${hslStr(darken(parentColor, 10))}` } as React.CSSProperties;
}

function Connector({ colorMode, parentColor }: { colorMode: MindMapColorMode; parentColor: HSL | null }) {
  const style: React.CSSProperties =
    colorMode === MindMapColorMode.Color && parentColor
      ? {
          width: "18px",
          height: "12px",
          borderLeft: `2px solid ${hslStr(darken(parentColor, 10))}`,
          borderBottom: `2px solid ${hslStr(darken(parentColor, 10))}`,
          marginLeft: "1rem",
          borderBottomLeftRadius: "8px",
        }
      : {
          width: "16px",
          height: "10px",
          borderLeft: "1px solid #4b5563",
          borderBottom: "1px solid #4b5563",
          marginLeft: "1rem",
          borderBottomLeftRadius: "8px",
        };
  return <span className="sm:hidden inline-block" style={style} aria-hidden="true" />;
}

const NodeBox: React.FC<{
  node: MindMapNode;
  level: number;
  idx: number;
  colorMode: MindMapColorMode;
  branchColor: HSL | null; // color heredado de la madre
  expandAllSeq: number;
  collapseAllSeq: number;
}> = ({ node, level, idx, colorMode, branchColor, expandAllSeq, collapseAllSeq }) => {
  const [open, setOpen] = useState(level === 0);
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);

  const hasChildren = (node.children?.length || 0) > 0;

  // Color de esta etiqueta:
  // - nivel 0: negro
  // - nivel 1: color de paleta por índice
  // - nivel >=2: hereda y se aclara por nivel
  let myColor: HSL | null = null;
  if (colorMode === MindMapColorMode.Color) {
    if (level === 1) myColor = paletteLevel1[idx % paletteLevel1.length];
    else if (level >= 2) myColor = branchColor ? lighten(branchColor, 10) : null;
  }

  // Color que heredarán los hijos (color de la madre, no aclarado).
  const nextBranchColor: HSL | null =
    colorMode === MindMapColorMode.Color
      ? level === 0
        ? null
        : myColor || branchColor
      : null;

  return (
    <div className="flex flex-col sm:flex-row items-start gap-1.5 sm:gap-3 my-0.5">
      {/* Etiqueta */}
      <button
        style={styleForTag(level, colorMode, myColor)}
        className="shrink-0 text-left w-full sm:w-auto"
        onClick={() => hasChildren && setOpen((v) => !v)}
        title={hasChildren ? (open ? "Colapsar" : "Expandir") : "Nodo"}
      >
        <div className="leading-tight">{node.label}</div>
        {node.note && (
          <div className="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-tight">
            {node.note}
          </div>
        )}
      </button>

      {/* Conector móvil como "llave" del color de la madre */}
      {open && hasChildren && (
        <Connector colorMode={colorMode} parentColor={branchColor} />
      )}

      {/* Hijos: móvil debajo; desktop a la derecha con borde-l del color de la madre */}
      {open && hasChildren && (
        <div
          className="pl-3 sm:pl-4 flex flex-col gap-1.5 sm:gap-2 w-full"
          style={styleForChildrenContainer(colorMode, branchColor)}
        >
          {node.children!.map((c, i) => (
            <NodeBox
              key={c.id}
              node={c}
              level={level + 1}
              idx={i}
              colorMode={colorMode}
              branchColor={nextBranchColor}
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

  // ---- Export HTML con los mismos estilos (inline) y colores heredados ----
  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const tagStyleHTML = (level: number, cm: MindMapColorMode, color: HSL | null) => {
    if (level === 0) return "background:#000;color:#fff;border:2px solid #6b7280;font-weight:800;padding:.65rem 1rem;border-radius:12px;";
    if (cm === "bw" || !color)
      return "background:#1f2937;color:#fff;border:1px solid #4b5563;font-weight:600;padding:.5rem .9rem;border-radius:10px;";
    const bg = hslStr(color);
    const bd = hslStr(darken(color, 10));
    const fg = textOn(color);
    return `background:${bg};color:${fg};border:1px solid ${bd};font-weight:600;padding:.5rem .9rem;border-radius:10px;`;
  };

  const childrenBorderHTML = (cm: MindMapColorMode, parentColor: HSL | null) => {
    if (cm === "bw" || !parentColor) return "border-left:1px solid #374151;";
    return `border-left:2px solid ${hslStr(darken(parentColor,10))};`;
  };

  const connectorHTML = (cm: MindMapColorMode, parentColor: HSL | null) => {
    if (cm === "bw" || !parentColor)
      return "width:16px;height:10px;border-left:1px solid #4b5563;border-bottom:1px solid #4b5563;margin-left:1rem;border-bottom-left-radius:8px;";
    const c = hslStr(darken(parentColor, 10));
    return `width:18px;height:12px;border-left:2px solid ${c};border-bottom:2px solid ${c};margin-left:1rem;border-bottom-left-radius:8px;`;
  };

  const detailsTreeHTML = (
    node: MindMapNode,
    open: boolean,
    level = 0,
    idx = 0,
    branchColor: HSL | null = null
  ): string => {
    // Color de ESTA etiqueta
    let myColor: HSL | null = null;
    if (colorMode === MindMapColorMode.Color) {
      if (level === 1) myColor = paletteLevel1[idx % paletteLevel1.length];
      else if (level >= 2) myColor = branchColor ? lighten(branchColor, 10) : null;
    }
    // Color que heredan los hijos
    const nextBranch = colorMode === MindMapColorMode.Color ? (level === 0 ? null : (myColor || branchColor)) : null;

    const hasChildren = (node.children?.length || 0) > 0;
    const kids = hasChildren
      ? node.children!.map((c, i) => detailsTreeHTML(c, false, level + 1, i, nextBranch)).join("")
      : "";

    return `
<details class="mind" ${open ? "open" : ""}>
  <summary class="inline-flex items-start">
    <span class="marker sm:hidden" aria-hidden="true"></span>
    <div style="${tagStyleHTML(level, colorMode, myColor)}">
      <div class="leading-tight">${esc(node.label)}</div>
      ${node.note ? `<div style="opacity:.9;font-size:.75rem;margin-top:.15rem;line-height:1.1">${esc(node.note)}</div>` : ""}
    </div>
  </summary>
  ${
    hasChildren
      ? `<span class="connector sm:hidden" style="${connectorHTML(colorMode, branchColor)}" aria-hidden="true"></span>
         <div class="children" style="padding-left:.75rem;${childrenBorderHTML(colorMode, branchColor)}">${kids}</div>`
      : ""
  }
</details>`;
  };

  const downloadHTML = () => {
    const tree = detailsTreeHTML(data.root, true, 0, 0, null);
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
  @media (min-width:640px){
    body{overflow-x:auto}
    details.mind{flex-direction:row;align-items:flex-start;gap:.75rem}
    .connector{display:none!important}
    .children{padding-left:1rem!important}
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
            branchColor={null}
            expandAllSeq={expandAllSeq}
            collapseAllSeq={collapseAllSeq}
          />
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
