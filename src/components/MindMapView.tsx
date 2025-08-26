// src/components/MindMapView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

/**
 * Mejoras:
 * - Layout horizontal con conectores y “flujo hacia la derecha”.
 * - Pan (arrastrar) + Zoom (rueda / pinch) con límites.
 * - Mobile first: en pantallas pequeñas se comporta como acordeón sin desbordes.
 * - Botones: Expandir/Colapsar, Zoom+/-, Centrar, Imprimir, Descargar HTML.
 */

type HSL = { h: number; s: number; l: number };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const hslStr = (c: HSL) => `hsl(${c.h}deg ${c.s}% ${c.l}%)`;
const lighten = (c: HSL, dl: number): HSL => ({ ...c, l: clamp(c.l + dl, 10, 92) });
const darken = (c: HSL, dl: number): HSL => ({ ...c, l: clamp(c.l - dl, 0, 90) });
const textOn = (bg: HSL) => (bg.l >= 62 ? "#000" : "#fff");

const PALETTE_L1: HSL[] = [
  { h: 355, s: 80, l: 45 },
  { h: 45,  s: 90, l: 50 },
  { h: 140, s: 60, l: 40 },
  { h: 200, s: 80, l: 45 },
  { h: 280, s: 70, l: 45 },
  { h: 90,  s: 70, l: 45 },
];

// Tamaños compactos por nivel (en caracteres)
const maxWidthCh = (level: number) => (level === 0 ? 34 : level === 1 ? 26 : level === 2 ? 24 : 22);
const isContentful = (n?: Partial<MindMapNode>) =>
  Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

function tagStyle(level: number, colorMode: MindMapColorMode, myColor: HSL | null): React.CSSProperties {
  const common: React.CSSProperties = {
    display: "inline-block",
    maxWidth: `${maxWidthCh(level)}ch`,
    whiteSpace: "normal",
    wordBreak: "break-word",
    hyphens: "auto",
    lineHeight: 1.15,
  };
  if (level === 0) {
    return {
      ...common,
      backgroundColor: "#111827",
      color: "#fff",
      border: "2px solid #6b7280",
      fontWeight: 800,
      padding: "10px 16px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,.35)"
    };
  }
  if (colorMode === MindMapColorMode.BlancoNegro || !myColor) {
    return {
      ...common,
      backgroundColor: "#1f2937",
      color: "#fff",
      border: "1px solid #4b5563",
      fontWeight: 600,
      padding: "8px 14px",
      borderRadius: "10px",
      boxShadow: "0 1px 6px rgba(0,0,0,.25)"
    };
  }
  const bg = hslStr(myColor), bd = hslStr(darken(myColor, 10)), fg = textOn(myColor);
  return {
    ...common,
    backgroundColor: bg,
    color: fg,
    border: `1px solid ${bd}`,
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: "10px",
    boxShadow: "0 1px 6px rgba(0,0,0,.25)"
  };
}

function childrenBorder(colorMode: MindMapColorMode, parentColor: HSL | null): React.CSSProperties {
  if (colorMode === MindMapColorMode.BlancoNegro || !parentColor) return { borderLeft: "1px solid #374151" };
  return { borderLeft: `2px solid ${hslStr(darken(parentColor, 10))}` };
}

const Caret: React.FC<{ open: boolean }> = ({ open }) => (
  <span
    aria-hidden="true"
    className={`inline-block transition-transform ${open ? "rotate-90" : "rotate-0"}`}
    style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid currentColor", marginLeft: 6 }}
  />
);

// ────────────────────────────────────────────────────────────────────────────
// Nodo: horizontal (desktop) y acordeón en móvil
// ────────────────────────────────────────────────────────────────────────────
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

  const onToggle = () => {
    if (!hasChildren) return;
    if (level === 1) {
      const willOpen = !open;
      if (willOpen) setAccordionIndex(idx);
      else setAccordionIndex(null);
      setOpen(willOpen);
      return;
    }
    setOpen(v => !v);
  };

  // Conector curvo (desktop)
  const connectorDesktop = (
    <svg className="hidden sm:block shrink-0" width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path
        d="M2 2 C 2 18, 30 2, 30 26"
        stroke={myColor ? hslStr(darken(myColor, 10)) : "#4b5563"}
        strokeWidth={myColor ? 2 : 1}
        fill="none"
      />
    </svg>
  );

  return (
    <div className="flex sm:flex-row flex-col sm:items-start items-stretch sm:gap-3 gap-1.5 my-0.5">
      <button
        style={tagStyle(level, colorMode, myColor)}
        className="text-left w-full sm:w-auto"
        onClick={onToggle}
        title={hasChildren ? (open ? "Colapsar" : "Expandir") : "Nodo"}
      >
        <div className="flex items-center">
          <div className="leading-tight">{node.label}</div>
          {hasChildren && <Caret open={open} />}
        </div>
        {node.note && <div className="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-tight">{node.note}</div>}
      </button>

      {/* Conector en desktop */}
      {open && hasChildren && connectorDesktop}

      {/* Rama de hijos: en desktop horizontal; en móvil vertical con borde izquierdo */}
      {open && hasChildren && (
        <div
          className="sm:pl-0 pl-3 sm:border-0 border-l"
          style={childrenBorder(colorMode, myColor)}
        >
          <div className="flex sm:flex-row flex-col sm:items-start sm:gap-6 gap-1.5">
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
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Vista principal con Pan & Zoom + export/print
// ────────────────────────────────────────────────────────────────────────────
type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  colorMode: MindMapColorMode;
  onBack: () => void;
};

const MindMapView: React.FC<Props> = ({ data, summaryTitle, colorMode, onBack }) => {
  const [expandAllSeq, setExpandAllSeq] = useState(0);
  const [collapseAllSeq, setCollapseAllSeq] = useState(0);
  const [accordionIndex, setAccordionIndex] = useState<number | null>(null);

  // Pan & Zoom
  const worldRef = useRef<HTMLDivElement>(null);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);

  const isPanning = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const pageTitle = useMemo(() => summaryTitle || data.root.label || "Mapa mental", [summaryTitle, data.root.label]);

  // Centrar mundo al cargar
  useEffect(() => {
    // desplazamiento inicial hacia la izquierda para que la raíz no quede pegada
    setTx(0);
    setTy(0);
    setScale(1);
  }, []);

  // Eventos de pan
  const onPointerDown = (e: React.PointerEvent) => {
    // Evita arrastre de texto
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isPanning.current = true;
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTx(v => v + dx);
    setTy(v => v + dy);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    isPanning.current = false;
  };

  // Zoom (rueda)
  const onWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 10) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => clamp(s * factor, 0.5, 2.2));
  };

  const zoomIn  = () => setScale(s => clamp(s * 1.15, 0.5, 2.2));
  const zoomOut = () => setScale(s => clamp(s * 0.87, 0.5, 2.2));
  const center  = () => { setTx(0); setTy(0); setScale(1); };

  // -------- Export HTML (usa layout responsive horizontal/vertical) ----------
  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const hsl = (c: HSL) => `hsl(${c.h}deg ${c.s}% ${c.l}%)`;
  const tagStyleHTML = (level: number, cm: MindMapColorMode, myColor: HSL | null) => {
    const common = `display:inline-block;max-width:${maxWidthCh(level)}ch;white-space:normal;word-break:break-word;hyphens:auto;line-height:1.15;`;
    if (level === 0) return `${common}background:#111827;color:#fff;border:2px solid #6b7280;font-weight:800;padding:10px 16px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.35);`;
    if (cm === MindMapColorMode.BlancoNegro || !myColor) return `${common}background:#1f2937;color:#fff;border:1px solid #4b5563;font-weight:600;padding:8px 14px;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,.25);`;
    const bg = hsl(myColor); const bd = hsl(darken(myColor, 10)); const fg = myColor!.l >= 62 ? "#000" : "#fff";
    return `${common}background:${bg};color:${fg};border:1px solid ${bd};font-weight:600;padding:8px 14px;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,.25);`;
  };
  const childrenBorderHTML = (cm: MindMapColorMode, parentColor: HSL | null) =>
    cm === MindMapColorMode.BlancoNegro || !parentColor ? "border-left:1px solid #374151;" : `border-left:2px solid ${hsl(darken(parentColor, 10))};`;

  const exportTree = (
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
    const kids = (node.children || []).filter(isContentful);
    const has = kids.length > 0;
    const children = has
      ? kids.map((c, i) => exportTree(c as any, true, level + 1, i, myColor)).join("")
      : "";

    return `
<div class="nb">
  <div class="tag" style="${tagStyleHTML(level, colorMode, myColor)}">${esc(node.label)}${node.note ? `<div class="note">${esc(node.note)}</div>` : ""}</div>
  ${has ? `<div class="children" style="padding-left:.75rem;${childrenBorderHTML(colorMode, myColor)}">${children}</div>` : ""}
</div>`;
  };

  const downloadHTML = () => {
    const tree = exportTree(data.root, true, 0, 0, null);
    const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(pageTitle)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#111827;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif}
  .wrap{padding:16px}
  .controls{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}
  button{background:#1f2937;color:#fff;border:1px solid #374151;border-radius:10px;padding:8px 12px;cursor:pointer}
  .card{background:rgba(31,41,55,.5);border:1px solid #374151;border-radius:14px;padding:12px;overflow:auto}
  .nb{display:flex;flex-direction:column;gap:6px;margin:4px 0}
  @media (min-width:640px){ .nb{flex-direction:row;align-items:flex-start;gap:16px} .children{padding-left:0!important} }
  .tag .note{opacity:.9;font-size:.75rem;margin-top:.15rem;line-height:1.15}
  @media print {
    body{background:#fff;color:#000}
    .controls{display:none}
    .card{border:0}
  }
</style>
<script>
  function expandAll(){ document.querySelectorAll('details').forEach(d=>d.open=true); }
  function collapseAll(){ document.querySelectorAll('details').forEach(d=>d.open=false); }
  function printPDF(){ window.print(); }
</script>
</head>
<body>
  <div class="wrap">
    <h1 style="margin:0 0 4px 0;font-size:20px;font-weight:800">Mapa mental</h1>
    <h3 style="margin:0 0 12px 0;color:#fde047;font-weight:600;font-size:16px">${esc(pageTitle)}</h3>
    <div class="controls">
      <button onclick="expandAll()">📂 Desplegar todos</button>
      <button onclick="collapseAll()">📁 Colapsar todos</button>
      <button onclick="printPDF()">🖨 Imprimir a PDF</button>
    </div>
    <div class="card">${tree}</div>
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

  const printPDF = () => {
    // opcional: forzar expandir antes de imprimir (visual)
    setExpandAllSeq(v => v + 1);
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental</h2>
            <div className="text-base sm:text-lg italic text-yellow-400">{pageTitle}</div>
          </div>
          <div className="w-full sm:w-auto">
            <button onClick={onBack} className="w-full sm:w-auto border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm">
              Volver
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-start mb-3">
          <button onClick={() => { setAccordionIndex(null); setExpandAllSeq(v => v + 1); }} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm">Desplegar todos</button>
          <button onClick={() => { setAccordionIndex(null); setCollapseAllSeq(v => v + 1); }} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">Colapsar todos</button>
          <button onClick={zoomOut} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">−</button>
          <button onClick={zoomIn}  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">＋</button>
          <button onClick={center}  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">Centrar</button>
          <button onClick={printPDF} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">🖨 Imprimir PDF</button>
          <button onClick={downloadHTML} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm">💾 Descargar HTML</button>
        </div>

        {/* Tarjeta + lienzo desplazable */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          {/* Viewport (captura pan/zoom). touch-action:none para permitir arrastrar en móvil */}
          <div
            className="relative w-full h-[70vh] sm:h-[76vh] overflow-hidden"
            style={{ touchAction: "none", cursor: "grab" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          >
            {/* “Mundo” a pan/zoom */}
            <div
              ref={worldRef}
              className="absolute left-1/2 top-1/2 will-change-transform"
              style={{
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`,
                transformOrigin: "0 0",
                padding: "24px",
                minWidth: 600
              }}
            >
              {/* Raíz y ramas horizontales en desktop; en móvil cae a vertical con bordes */}
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
        </div>

      </div>
    </div>
  );
};

export default MindMapView;
