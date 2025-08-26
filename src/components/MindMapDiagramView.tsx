import React, { useEffect, useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode } from "../types";

// Diagrama "clásico": bloques simples, sin notas largas, ramas hacia la derecha,
// pan/zoom y conectores curvos. Minimalista y responsive.

type HSL = { h: number; s: number; l: number };
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const PALETTE: HSL[] = [
  { h: 220, s: 9,  l: 18 }, // gris oscuro
  { h: 220, s: 9,  l: 18 },
  { h: 220, s: 9,  l: 18 },
];
const hsl = (c: HSL) => `hsl(${c.h}deg ${c.s}% ${c.l}%)`;
const lighten = (c: HSL, dl: number): HSL => ({ ...c, l: clamp(c.l + dl, 10, 92) });

const boxStyle = (level: number): React.CSSProperties => ({
  background: hsl(level === 0 ? lighten(PALETTE[0], 8) : PALETTE[level % PALETTE.length]),
  color: "#fff",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.15)",
  padding: level === 0 ? "14px 18px" : "12px 16px",
  fontWeight: level === 0 ? 800 : 600,
  maxWidth: level === 0 ? "28ch" : "22ch",
  lineHeight: 1.15,
  whiteSpace: "normal",
  wordBreak: "break-word",
});

const Connector: React.FC<{ color?: string }> = ({ color = "rgba(148,163,184,.7)" }) => (
  <svg width="40" height="28" viewBox="0 0 40 28" className="hidden sm:block shrink-0" aria-hidden="true">
    <path d="M2 2 C 2 18, 38 2, 38 26" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);

const NodeBox: React.FC<{ node: MindMapNode; level: number }> = ({ node, level }) => {
  const children = (node.children || []).filter(
    c => String(c?.label ?? "").trim()
  );
  const has = children.length > 0;

  return (
    <div className="flex sm:flex-row flex-col sm:items-start items-stretch sm:gap-4 gap-1.5">
      <div style={boxStyle(level)}>{node.label}</div>
      {has && <Connector />}
      {has && (
        <div className="sm:pl-0 pl-3 sm:border-0 border-l border-slate-600/50">
          <div className="flex sm:flex-row flex-col sm:gap-8 gap-1.5">
            {children.map((c) => (
              <NodeBox key={c.id} node={c} level={level + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  onBack: () => void;
};

const MindMapDiagramView: React.FC<Props> = ({ data, summaryTitle, onBack }) => {
  // Pan & Zoom muy simple
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [s, setS] = useState(1);
  const isPan = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const title = useMemo(() => summaryTitle || data.root.label || "Mapa mental", [summaryTitle, data.root.label]);

  const onDown = (e: React.PointerEvent) => { isPan.current = true; last.current = { x: e.clientX, y: e.clientY }; };
  const onMove = (e: React.PointerEvent) => {
    if (!isPan.current) return;
    const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTx(v => v + dx); setTy(v => v + dy);
  };
  const onUp = () => { isPan.current = false; };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setS(v => clamp(v * (e.deltaY > 0 ? 0.9 : 1.1), 0.6, 2.0));
  };
  const center = () => { setTx(0); setTy(0); setS(1); };

  // Export HTML simple (misma estética)
  const esc = (x = "") => x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const serialize = (n: MindMapNode, level = 0): string => {
    const kids = (n.children || []).filter(c => String(c?.label ?? "").trim());
    return `<div class="nb">
  <div class="box lvl-${level}">${esc(n.label)}</div>
  ${kids.length ? `<div class="children">${kids.map(c=>serialize(c, level+1)).join("")}</div>` : ""}
</div>`;
  };
  const downloadHTML = () => {
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  body{margin:0;background:#0f172a;color:#fff;font-family:system-ui,Segoe UI,Roboto,Ubuntu,"Noto Sans",sans-serif}
  .toolbar{display:flex;gap:8px;padding:8px;background:#1f2937;position:sticky;top:0}
  button{background:#374151;color:#fff;border:0;border-radius:10px;padding:8px 12px;cursor:pointer}
  #vp{position:relative;height:80vh;overflow:hidden;touch-action:none;cursor:grab}
  #world{position:absolute;left:50%;top:50%;transform:translate(calc(-50% + 0px),calc(-50% + 0px)) scale(1);transform-origin:0 0}
  .nb{display:flex;flex-direction:column;gap:6px;margin:4px 0}
  @media(min-width:640px){.nb{flex-direction:row;align-items:flex-start;gap:16px}}
  .children{margin-left:12px;border-left:1px solid rgba(148,163,184,.4);padding-left:12px}
  .box{background:#111827;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:12px 16px;max-width:22ch;font-weight:600}
  .box.lvl-0{background:#0b1220;border-color:#6b7280;font-weight:800;max-width:28ch}
</style>
<div class="toolbar">
  <button onclick="zoom(1.1)">＋</button>
  <button onclick="zoom(0.9)">−</button>
  <button onclick="center()">Centrar</button>
  <button onclick="window.print()">Imprimir</button>
</div>
<div id="vp"><div id="world">${serialize(data.root)}</div></div>
<script>
let s=1,tx=0,ty=0,pan=false,last={x:0,y:0};
const vp=document.getElementById('vp'), world=document.getElementById('world');
function apply(){ world.style.transform = \`translate(calc(-50% + \${tx}px), calc(-50% + \${ty}px)) scale(\${s})\`; }
function zoom(f){ s=Math.max(0.6, Math.min(2.0, s*f)); apply(); }
function center(){ tx=0; ty=0; s=1; apply(); }
vp.addEventListener('mousedown',e=>{ pan=true; last={x:e.clientX,y:e.clientY}; });
vp.addEventListener('mousemove',e=>{ if(!pan) return; tx+=e.clientX-last.x; ty+=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; apply(); });
vp.addEventListener('mouseup',()=>pan=false);
vp.addEventListener('mouseleave',()=>pan=false);
vp.addEventListener('wheel',e=>{ e.preventDefault(); zoom(e.deltaY>0?0.9:1.1); }, {passive:false});
</script>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${title}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setS(v => clamp(v*1.1, .6, 2))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">＋</button>
        <button onClick={() => setS(v => clamp(v*0.9, .6, 2))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">−</button>
        <button onClick={center} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">Centrar</button>
        <button onClick={downloadHTML} className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 text-sm">💾 Descargar HTML</button>
        <button onClick={onBack} className="border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg px-3 py-2 text-sm ml-auto">Volver</button>
      </div>
      <div
        className="relative w-full h-[72vh] overflow-hidden rounded-xl border border-gray-700 bg-gray-800/40"
        style={{ touchAction: "none", cursor: "grab" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onWheel={onWheel}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${s})`, transformOrigin: "0 0", padding: 12 }}
        >
          <NodeBox node={data.root} level={0} />
        </div>
      </div>
    </div>
  );
};

export default MindMapDiagramView;
