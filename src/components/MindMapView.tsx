// src/components/MindMapView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

/**
 * Mapa mental con Pan/Zoom y exportación a HTML interactivo.
 * - Pan (arrastrar) y Zoom (rueda o botones).
 * - Responsive: horizontal en desktop, vertical en móvil.
 * - Export HTML con los mismos controles interactivos.
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

const maxWidthCh = (level: number) => (level === 0 ? 34 : level === 1 ? 26 : 22);
const isContentful = (n?: Partial<MindMapNode>) =>
  Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

function tagStyle(level: number, colorMode: MindMapColorMode, myColor: HSL | null): React.CSSProperties {
  const common: React.CSSProperties = {
    display: "inline-block",
    maxWidth: `${maxWidthCh(level)}ch`,
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: 1.15,
  };
  if (level === 0) {
    return { ...common, backgroundColor: "#111827", color: "#fff", border: "2px solid #6b7280", fontWeight: 800, padding: "10px 16px", borderRadius: "12px" };
  }
  if (colorMode === MindMapColorMode.BlancoNegro || !myColor) {
    return { ...common, backgroundColor: "#1f2937", color: "#fff", border: "1px solid #4b5563", fontWeight: 600, padding: "8px 14px", borderRadius: "10px" };
  }
  const bg = hslStr(myColor), bd = hslStr(darken(myColor, 10)), fg = textOn(myColor);
  return { ...common, backgroundColor: bg, color: fg, border: `1px solid ${bd}`, fontWeight: 600, padding: "8px 14px", borderRadius: "10px" };
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

const NodeBox: React.FC<{
  node: MindMapNode;
  level: number;
  idx: number;
  colorMode: MindMapColorMode;
  motherColor: HSL | null;
  expandAllSeq: number;
  collapseAllSeq: number;
}> = ({ node, level, idx, colorMode, motherColor, expandAllSeq, collapseAllSeq }) => {
  const [open, setOpen] = useState(level === 0);
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);

  const filteredChildren = (node.children || []).filter(isContentful);
  const hasChildren = filteredChildren.length > 0;

  let myColor: HSL | null = null;
  if (colorMode === MindMapColorMode.Color) {
    if (level === 1) myColor = PALETTE_L1[idx % PALETTE_L1.length];
    else if (level >= 2) myColor = motherColor ? lighten(motherColor, 10) : null;
  }

  const onToggle = () => hasChildren && setOpen(v => !v);

  return (
    <div className="flex sm:flex-row flex-col sm:items-start items-stretch sm:gap-3 gap-1.5 my-0.5">
      <button style={tagStyle(level, colorMode, myColor)} className="text-left w-full sm:w-auto" onClick={onToggle}>
        <div className="flex items-center">
          <div>{node.label}</div>
          {hasChildren && <Caret open={open} />}
        </div>
        {node.note && <div className="text-xs opacity-90 mt-0.5">{node.note}</div>}
      </button>
      {open && hasChildren && (
        <div className="sm:pl-0 pl-3 sm:border-0 border-l" style={childrenBorder(colorMode, myColor)}>
          <div className="flex sm:flex-row flex-col sm:items-start sm:gap-6 gap-1.5">
            {filteredChildren.map((c, i) => (
              <NodeBox key={c.id} node={c} level={level + 1} idx={i} colorMode={colorMode} motherColor={myColor} expandAllSeq={expandAllSeq} collapseAllSeq={collapseAllSeq} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────
// Vista principal con Pan & Zoom + export HTML interactivo
// ────────────────────────────────────────────────────────────────
type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  colorMode: MindMapColorMode;
  onBack: () => void;
};

const MindMapView: React.FC<Props> = ({ data, summaryTitle, colorMode, onBack }) => {
  const [expandAllSeq, setExpandAllSeq] = useState(0);
  const [collapseAllSeq, setCollapseAllSeq] = useState(0);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);

  const isPanning = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const pageTitle = useMemo(() => summaryTitle || data.root.label || "Mapa mental", [summaryTitle, data.root.label]);

  const onPointerDown = (e: React.PointerEvent) => { isPanning.current = true; last.current = { x: e.clientX, y: e.clientY }; };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTx(v => v + dx); setTy(v => v + dy);
  };
  const onPointerUp = () => { isPanning.current = false; };
  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); const factor = e.deltaY > 0 ? 0.9 : 1.1; setScale(s => clamp(s * factor, 0.5, 2.2)); };

  const downloadHTML = () => {
    const html = `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
<style>
  body{margin:0;background:#111827;color:#fff;font-family:sans-serif}
  .toolbar{display:flex;gap:8px;padding:8px;background:#222}
  button{background:#444;color:#fff;border:0;padding:6px 10px;border-radius:6px;cursor:pointer}
  #viewport{position:relative;width:100%;height:80vh;overflow:hidden;touch-action:none;cursor:grab}
  #world{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(1);transform-origin:0 0;padding:20px}
  .nb{display:flex;flex-direction:column;gap:6px;margin:4px 0}
  @media(min-width:640px){.nb{flex-direction:row;align-items:flex-start;gap:16px}}
  .children{margin-left:10px;border-left:1px solid #555;padding-left:10px}
  .tag{display:inline-block;background:#333;color:#fff;padding:6px 10px;border-radius:8px}
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="zoom(1.1)">＋</button>
  <button onclick="zoom(0.9)">−</button>
  <button onclick="center()">Centrar</button>
  <button onclick="expandAll()">Expandir</button>
  <button onclick="collapseAll()">Colapsar</button>
  <button onclick="window.print()">🖨 Imprimir</button>
</div>
<div id="viewport"><div id="world">${document.getElementById("world")?.innerHTML || ""}</div></div>
<script>
let scale=1,tx=0,ty=0,isPanning=false,last={x:0,y:0};
const world=document.getElementById("world"),viewport=document.getElementById("viewport");
function apply(){world.style.transform=\`translate(calc(-50% + \${tx}px), calc(-50% + \${ty}px)) scale(\${scale})\`;}
function zoom(f){scale=Math.max(0.5,Math.min(2.2,scale*f));apply();}
function center(){tx=0;ty=0;scale=1;apply();}
viewport.addEventListener("mousedown",e=>{isPanning=true;last={x:e.clientX,y:e.clientY}});
viewport.addEventListener("mousemove",e=>{if(!isPanning)return;tx+=e.clientX-last.x;ty+=e.clientY-last.y;last={x:e.clientX,y:e.clientY};apply();});
viewport.addEventListener("mouseup",()=>isPanning=false);
viewport.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY>0?0.9:1.1);});
function expandAll(){document.querySelectorAll(".nb").forEach(el=>el.style.display="block");}
function collapseAll(){document.querySelectorAll(".children").forEach(el=>el.style.display="none");}
</script>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${pageTitle}.html`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="flex gap-2 mb-3">
        <button onClick={() => setExpandAllSeq(v => v + 1)} className="bg-green-600 px-3 py-2 rounded">Expandir</button>
        <button onClick={() => setCollapseAllSeq(v => v + 1)} className="bg-red-600 px-3 py-2 rounded">Colapsar</button>
        <button onClick={downloadHTML} className="bg-indigo-600 px-3 py-2 rounded">💾 Descargar HTML</button>
      </div>
      <div id="viewport" className="relative w-full h-[70vh] overflow-hidden" style={{ touchAction: "none", cursor: "grab" }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
        <div id="world" className="absolute left-1/2 top-1/2" style={{ transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`, transformOrigin: "0 0" }}>
          <NodeBox node={data.root} level={0} idx={0} colorMode={colorMode} motherColor={null} expandAllSeq={expandAllSeq} collapseAllSeq={collapseAllSeq} />
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
