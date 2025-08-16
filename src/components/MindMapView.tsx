import React, { useEffect, useMemo, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  colorMode: MindMapColorMode;
  onBack: () => void;
};

type HSL = { h: number; s: number; l: number };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const hslStr = (c: HSL) => `hsl(${c.h}deg ${c.s}% ${c.l}%)`;
const lighten = (c: HSL, dl: number): HSL => ({ ...c, l: clamp(c.l + dl, 10, 92) });
const darken = (c: HSL, dl: number): HSL => ({ ...c, l: clamp(c.l - dl, 0, 90) });
const textOn = (bg: HSL) => (bg.l >= 62 ? "#000" : "#fff");

// Paleta L1
const PALETTE_L1: HSL[] = [
  { h: 355, s: 80, l: 45 },
  { h: 45,  s: 90, l: 50 },
  { h: 140, s: 60, l: 40 },
  { h: 200, s: 80, l: 45 },
  { h: 280, s: 70, l: 45 },
  { h: 90,  s: 70, l: 45 },
];

// Compactar bloques: ancho máximo por nivel (en ch)
const maxWidthCh = (level: number) => (level === 0 ? 34 : level === 1 ? 26 : level === 2 ? 24 : 22);
const isContentful = (n?: Partial<MindMapNode>) =>
  Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

function styleTag(level: number, colorMode: MindMapColorMode, myColor: HSL | null): React.CSSProperties {
  const common = {
    display: "inline-block",
    maxWidth: `${maxWidthCh(level)}ch`,
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    hyphens: "auto" as const,
    lineHeight: 1.15,
  };
  if (level === 0)
    return { ...common, backgroundColor: "#000", color: "#fff", border: "2px solid #6b7280", fontWeight: 800, padding: "10px 16px", borderRadius: "12px" };
  if (colorMode === MindMapColorMode.BlancoNegro || !myColor)
    return { ...common, backgroundColor: "#1f2937", color: "#fff", border: "1px solid #4b5563", fontWeight: 600, padding: "8px 14px", borderRadius: "10px" };
  const bg = hslStr(myColor), bd = hslStr(darken(myColor, 10)), fg = textOn(myColor);
  return { ...common, backgroundColor: bg, color: fg, border: `1px solid ${bd}`, fontWeight: 600, padding: "8px 14px", borderRadius: "10px" };
}
function styleChildrenBorder(colorMode: MindMapColorMode, parentColor: HSL | null): React.CSSProperties {
  if (colorMode === MindMapColorMode.BlancoNegro || !parentColor) return { borderLeft: "1px solid #374151" };
  return { borderLeft: `2px solid ${hslStr(darken(parentColor, 10))}` };
}
function Connector({ colorMode, parentColor }: { colorMode: MindMapColorMode; parentColor: HSL | null }) {
  const style: React.CSSProperties =
    colorMode === MindMapColorMode.Color && parentColor
      ? { width: "18px", height: "12px", borderLeft: `2px solid ${hslStr(darken(parentColor, 10))}`, borderBottom: `2px solid ${hslStr(darken(parentColor, 10))}`, marginLeft: "1rem", borderBottomLeftRadius: "8px" }
      : { width: "16px", height: "10px", borderLeft: "1px solid #4b5563", borderBottom: "1px solid #4b5563", marginLeft: "1rem", borderBottomLeftRadius: "8px" };
  return <span className="sm:hidden inline-block" style={style} aria-hidden="true" />;
}

// Triángulo indicador (solo cuando hay hijos con contenido)
const Caret: React.FC<{ open: boolean }> = ({ open }) => (
  <span
    aria-hidden="true"
    className={`inline-block transition-transform ${open ? "rotate-90" : "rotate-0"}`}
    style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid currentColor", marginLeft: 6 }}
  />
);

const NodeBox: React.FC<{
  node: MindMapNode;
  level: number;
  idx: number;
  colorMode: MindMapColorMode;
  motherColor: HSL | null;
  expandAllSeq: number;
  collapseAllSeq: number;
  accordionIndex: number | null;
  setAccordionIndex: (idx: number | null) => void;
}> = ({ node, level, idx, colorMode, motherColor, expandAllSeq, collapseAllSeq, accordionIndex, setAccordionIndex }) => {
  const [open, setOpen] = useState(level === 0);
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);

  useEffect(() => {
    if (level !== 1) return;
    if (accordionIndex === null) return;
    setOpen(idx === accordionIndex);
  }, [accordionIndex, level, idx]);

  const filteredChildren = (node.children || []).filter(isContentful);
  const hasChildren = filteredChildren.length > 0;

  let myColor: HSL | null = null;
  if (colorMode === MindMapColorMode.Color) {
    if (level === 1) myColor = PALETTE_L1[idx % PALETTE_L1.length];
    else if (level >= 2) myColor = motherColor ? lighten(motherColor, 10) : null;
  }
  const colorForMyChildren = myColor;

  const handleClick = () => {
    if (!hasChildren) return;
    if (level === 1) {
      const willOpen = !open;
      if (willOpen) setAccordionIndex(idx);
      else setAccordionIndex(null);
      setOpen(willOpen);
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start gap-1.5 sm:gap-3 my-0.5">
      <button
        style={styleTag(level, colorMode, myColor)}
        className="shrink-0 text-left w-full sm:w-auto"
        onClick={handleClick}
        title={hasChildren ? (open ? "Colapsar" : "Expandir") : "Nodo"}
      >
        <div className="flex items-center">
          <div className="leading-tight">{node.label}</div>
          {hasChildren && <Caret open={open} />}
        </div>
        {node.note && <div className="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-tight">{node.note}</div>}
      </button>

      {open && hasChildren && <Connector colorMode={colorMode} parentColor={myColor} />}

      {open && hasChildren && (
        <div className="pl-3 sm:pl-4 flex flex-col gap-1.5 sm:gap-2 w-full" style={styleChildrenBorder(colorMode, myColor)}>
          {filteredChildren.map((c, i) => (
            <NodeBox
              key={c.id}
              node={c}
              level={level + 1}
              idx={i}
              colorMode={colorMode}
              motherColor={colorForMyChildren}
              expandAllSeq={expandAllSeq}
              collapseAllSeq={collapseAllSeq}
              accordionIndex={accordionIndex}
              setAccordionIndex={setAccordionIndex}
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
  const [accordionIndex, setAccordionIndex] = useState<number | null>(null);

  const pageTitle = useMemo(() => summaryTitle || data.root.label || "Mapa mental", [summaryTitle, data.root.label]);

  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ---------- HTML export helpers ----------
  const hsl = (c: HSL) => `hsl(${c.h}deg ${c.s}% ${c.l}%)`;
  const tagStyleHTML = (level: number, cm: MindMapColorMode, myColor: HSL | null) => {
    const common = `display:inline-block;max-width:${maxWidthCh(level)}ch;white-space:normal;word-break:break-word;hyphens:auto;line-height:1.15;`;
    if (level === 0) return `${common}background:#000;color:#fff;border:2px solid #6b7280;font-weight:800;padding:.65rem 1rem;border-radius:12px;`;
    if (cm === MindMapColorMode.BlancoNegro || !myColor) return `${common}background:#1f2937;color:#fff;border:1px solid #4b5563;font-weight:600;padding:.5rem .9rem;border-radius:10px;`;
    const bg = hsl(myColor); const bd = hsl(darken(myColor, 10)); const fg = myColor!.l >= 62 ? "#000" : "#fff";
    return `${common}background:${bg};color:${fg};border:1px solid ${bd};font-weight:600;padding:.5rem .9rem;border-radius:10px;`;
  };
  const childrenBorderHTML = (cm: MindMapColorMode, parentColor: HSL | null) =>
    cm === MindMapColorMode.BlancoNegro || !parentColor ? "border-left:1px solid #374151;" : `border-left:2px solid ${hsl(darken(parentColor, 10))};`;
  const connectorHTML = (cm: MindMapColorMode, parentColor: HSL | null) => {
    if (cm === MindMapColorMode.BlancoNegro || !parentColor) return "width:16px;height:10px;border-left:1px solid #4b5563;border-bottom:1px solid #4b5563;margin-left:1rem;border-bottom-left-radius:8px;";
    const c = hsl(darken(parentColor, 10)); return `width:18px;height:12px;border-left:2px solid ${c};border-bottom:2px solid ${c};margin-left:1rem;border-bottom-left-radius:8px;`;
  };

  const caretHTML = `<span class="tri" aria-hidden="true"></span>`;
  const detailsTreeHTML = (
    node: MindMapNode,
    open: boolean,
    level = 0,
    idx = 0,
    motherColor: HSL | null = null
  ): string => {
    let myColor: HSL | null = null;
    if (colorMode === MindMapColorMode.Color) {
      if (level === 1) myColor = PALETTE_L1[idx % PALETTE_L1.length];
      else if (level >= 2) myColor = motherColor ? lighten(motherColor, 10) : null;
    }
    const rawChildren = node.children || [];
    const filteredChildren = rawChildren.filter((c) => Boolean(String(c?.label ?? "").trim() || String(c?.note ?? "").trim()));
    const hasChildren = filteredChildren.length > 0;

    const kids = hasChildren
      ? filteredChildren.map((c, i) => detailsTreeHTML(c as any, false, level + 1, i, myColor)).join("")
      : "";

    return `
<details class="mind${level===1 ? " lvl1" : ""}" ${open ? "open" : ""}>
  <summary class="inline-flex items-start">
    <span class="marker sm:hidden" aria-hidden="true"></span>
    <div style="${tagStyleHTML(level, colorMode, myColor)}">
      <div class="leading-tight" style="display:inline-flex;align-items:center;">
        ${esc(node.label)}${hasChildren ? caretHTML : ""}
      </div>
      ${node.note ? `<div style="opacity:.9;font-size:.75rem;margin-top:.15rem;line-height:1.15">${esc(node.note)}</div>` : ""}
    </div>
  </summary>
  ${
    hasChildren
      ? `<span class="connector sm:hidden" style="${connectorHTML(colorMode, myColor)}" aria-hidden="true"></span>
         <div class="children" style="padding-left:.75rem;${childrenBorderHTML(colorMode, myColor)}">${kids}</div>`
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
  /* Zona y bloques de presentación con fondo gris medio */
  .stage{background:rgba(55,65,81,.45);border-radius:12px;padding:.75rem}
  details.mind{display:flex;flex-direction:column;gap:.5rem;margin:.25rem 0;background:rgba(75,85,99,.35);border-radius:.75rem;overflow:hidden}
  details.mind > summary{display:inline-flex;align-items:flex-start;list-style:none;cursor:pointer}
  summary::-webkit-details-marker{display:none}
  .marker{display:inline-flex;width:1.25rem;height:1.25rem;border-radius:.375rem;background:#374151;align-items:center;justify-content:center;margin-right:.4rem;font-weight:700;color:#fff;font-size:.8rem;line-height:1.25rem}
  details.mind[open] > summary .marker::after{content:"−"}
  details.mind:not([open]) > summary .marker::after{content:"+"}
  .tri{display:inline-block;width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:7px solid currentColor;margin-left:.35rem;transform:rotate(0deg);transition:transform .15s ease}
  details[open] > summary .tri{transform:rotate(90deg)}
  /* Botones compactos y alineados a la izquierda */
  .btns{display:flex;flex-wrap:wrap;gap:.45rem;justify-content:flex-start}
  .btn{display:inline-flex;align-items:center;gap:.35rem;padding:.5rem .7rem;font-size:.9rem;border-radius:.55rem}
  @media (min-width:640px){
    body{overflow-x:auto}
    details.mind{flex-direction:row;align-items:flex-start;gap:.75rem}
    .connector{display:none!important}
    .children{padding-left:1rem!important}
  }
</style>
<script>
  window._bulkOpen = false;
  function expandAll(){ window._bulkOpen = true; document.querySelectorAll('details.mind').forEach(d=>d.open=true); setTimeout(()=>{ window._bulkOpen=false; },0); }
  function collapseAll(){ document.querySelectorAll('details.mind').forEach(d=>d.open=false) }
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
<body class="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
  <h1 class="text-xl sm:text-2xl font-bold mb-3">Mapa mental</h1>

  <div class="btns mb-4">
    <button onclick="expandAll()" class="btn bg-green-600 hover:bg-green-700 text-white">📂 Desplegar todos</button>
    <button onclick="collapseAll()" class="btn bg-red-600 hover:bg-red-700 text-white">📁 Colapsar todos</button>
    <button onclick="printPDF()" class="btn bg-blue-600 hover:bg-blue-700 text-white">🖨 Imprimir a PDF</button>
  </div>

  <div class="stage">
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
        <div className="flex items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental</h2>
            {/* explicación eliminada en la presentación */}
          </div>
          <div className="w-full sm:w-auto">
            <button
              onClick={onBack}
              className="w-full sm:w-auto border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Botonera compacta a la izquierda */}
        <div className="flex flex-wrap gap-2 justify-start mb-3 sm:mb-5">
          <button
            onClick={() => { setAccordionIndex(null); setExpandAllSeq((v) => v + 1); }}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
            style={{ paddingLeft: "0.7rem", paddingRight: "0.7rem" }}
          >
            Desplegar todos
          </button>
          <button
            onClick={() => { setAccordionIndex(null); setCollapseAllSeq((v) => v + 1); }}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
            style={{ paddingLeft: "0.7rem", paddingRight: "0.7rem" }}
          >
            Colapsar todos
          </button>
          <button
            onClick={downloadHTML}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            style={{ paddingLeft: "0.7rem", paddingRight: "0.7rem" }}
          >
            Descargar HTML
          </button>
        </div>

        <div className="max-w-[1200px]">
          {/* El árbol en la app mantiene su UI existente */}
          {/* (el fondo gris medio se aplica solo en los HTML exportados) */}
          {/* Si también lo quieres en la app, lo envolvemos con un div con bg-gray-700/50 aquí */}
        </div>

        {/* Render del árbol */}
        {/* Root */}
        {/* (El componente NodeBox pinta todo) */}
        <NodeBox
          node={data.root}
          level={0}
          idx={0}
          colorMode={colorMode}
          motherColor={null}
          expandAllSeq={expandAllSeq}
          collapseAllSeq={collapseAllSeq}
          accordionIndex={accordionIndex}
          setAccordionIndex={setAccordionIndex}
        />
      </div>
    </div>
  );
};

export default MindMapView;
