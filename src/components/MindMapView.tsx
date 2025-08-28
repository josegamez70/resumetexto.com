import React, { useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode } from "../types";

// Utils
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const hasKids = (n: MindMapNode) => (n.children || []).some(c => String(c?.label ?? "").trim());

// ──────────────────────────────────────────────
// Caja “Más detalle” (no simplifica el texto)
// ──────────────────────────────────────────────
const DetailBox: React.FC<{
  level: number;
  clickable?: boolean;
  open?: boolean;
  children: React.ReactNode;
}> = ({ level, clickable, open, children }) => (
  <div
    className={`${clickable ? "cursor-pointer" : ""} select-none`}
    style={{
      background: level === 0 ? "#0b1220" : "#111827",
      color: "#fff",
      border: "1px solid rgba(255,255,255,.18)",
      borderRadius: 14,
      padding: level === 0 ? "16px 20px" : "14px 18px",
      fontWeight: level === 0 ? 800 : 600,
      minWidth: level === 0 ? "22ch" : "20ch",
      maxWidth: level === 0 ? "42ch" : "40ch",
      lineHeight: 1.25,
      wordBreak: "normal",
      overflowWrap: "anywhere",
    }}
    data-open={open ? "1" : "0"}
  >
    {children}
  </div>
);

const Caret: React.FC<{ open: boolean }> = ({ open }) => (
  <span
    aria-hidden="true"
    className={`inline-block ml-2 transition-transform ${open ? "rotate-90" : "rotate-0"}`}
    style={{
      width: 0,
      height: 0,
      borderTop: "6px solid transparent",
      borderBottom: "6px solid transparent",
      borderLeft: "8px solid currentColor",
    }}
  />
);

const HookRight: React.FC = () => (
  <svg width="46" height="32" viewBox="0 0 46 32" className="hidden sm:block shrink-0" aria-hidden="true">
    <path d="M2 2 C 2 20, 44 2, 44 30" stroke="rgba(148,163,184,.55)" strokeWidth="1.6" fill="none" />
  </svg>
);

// ──────────────────────────────────────────────
// Nodo “Más detalle” (abre hijos debajo)
// ──────────────────────────────────────────────
type NodeDetailedProps = {
  node: MindMapNode;
  level: number;
  openIds: Set<string | number>;
  toggle: (id: string | number) => void;
};

const NodeDetailed: React.FC<NodeDetailedProps> = ({ node, level, openIds, toggle }) => {
  const kids = (node.children || []).filter(c => String(c?.label ?? "").trim());
  const open = openIds.has(node.id!);

  if (level === 0) {
    return (
      <div className="flex sm:flex-row flex-col sm:items-center items-stretch gap-4">
        <DetailBox level={0}>{node.label}</DetailBox>
        {kids.length > 0 && <HookRight />}
        {!!kids.length && (
          <div className="flex flex-row gap-4 flex-nowrap">
            {kids.map(k => (
              <NodeDetailed key={k.id} node={k} level={1} openIds={openIds} toggle={toggle} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div onClick={() => hasKids(node) && toggle(node.id!)}>
        <DetailBox level={level} clickable open={open}>
          <div className="flex items-center justify-center">
            <span>{node.label}</span>
            {hasKids(node) && <Caret open={open} />}
          </div>
        </DetailBox>
      </div>

      {open && hasKids(node) && (
        <>
          <div className="h-4 w-px bg-slate-500/70 my-2" />
          <div className="flex flex-col gap-4">
            {kids.map(k => (
              <div key={k.id} className="flex flex-col items-center">
                <NodeDetailed node={k} level={level + 1} openIds={openIds} toggle={toggle} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Vista “Más detalle” con export que replica el estado
// ──────────────────────────────────────────────
type Props = { data: MindMapData; summaryTitle?: string | null; onBack: () => void };

const MindMapView: React.FC<Props> = ({ data, summaryTitle, onBack }) => {
  // Pan & Zoom + gestos
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [s, setS] = useState(1);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const panActive = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ active: boolean; startDist: number; startScale: number }>({
    active: false,
    startDist: 0,
    startScale: 1,
  });
  const MOVE_THRESHOLD = 3;

  const title = useMemo(() => summaryTitle || data.root.label || "Mapa mental (Más detalle)", [summaryTitle, data.root.label]);

  // Estado de despliegue (ids abiertos)
  const [openIds, setOpenIds] = useState<Set<string | number>>(new Set());
  const toggle = (id: string | number) =>
    setOpenIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const expandAll = () => {
    const ids = new Set<string | number>();
    const walk = (n: MindMapNode) => {
      if (hasKids(n)) ids.add(n.id!);
      (n.children || []).forEach(walk);
    };
    (data.root.children || []).forEach(walk);
    setOpenIds(ids);
  };
  const collapseAll = () => setOpenIds(new Set());

  // Gestos
  const getDist = () => {
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPan.current = { x: e.clientX, y: e.clientY };
    panActive.current = false;
    if (pointers.current.size === 2) {
      pinch.current.active = true;
      pinch.current.startDist = getDist();
      pinch.current.startScale = s;
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current.active && pointers.current.size >= 2) {
      const dist = getDist() || 1;
      const factor = dist / (pinch.current.startDist || 1);
      setS(clamp(pinch.current.startScale * factor, 0.43, 2)); // usa el mismo mínimo que Clásico si quieres
      return;
    }
    if (pointers.current.size === 1) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      const d = Math.hypot(dx, dy);
      if (!panActive.current && d > MOVE_THRESHOLD) panActive.current = true;
      if (panActive.current) {
        lastPan.current = { x: e.clientX, y: e.clientY };
        setTx(v => v + dx);
        setTy(v => v + dy);
      }
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current.active = false;
    if (pointers.current.size === 0) panActive.current = false;
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setS(v => clamp(v * (e.deltaY > 0 ? 0.9 : 1.1), 0.43, 2));
  };
  const center = () => {
    setTx(0);
    setTy(0);
    setS(1);
  };

  // ───────────── Descargar HTML que replica el estado ─────────────
  const esc = (x = "") => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const serialize = (n: MindMapNode, level = 0, openSet: Set<string | number>): string => {
    const kids = (n.children || []).filter(c => String(c?.label ?? "").trim());
    const open = openSet.has(n.id!);
    const label = esc(String(n.label ?? ""));
    if (level === 0) {
      return `<div class="row">
  <div class="box lvl-0">${label}</div>
  ${kids.length ? `<svg class="hook" viewBox="0 0 46 32"><path d="M2 2 C 2 20, 44 2, 44 30" /></svg>` : ""}
  ${kids.length ? `<div class="row nowrap">${kids.map(k => serialize(k, 1, openSet)).join("")}</div>` : ""}
</div>`;
    }
    const has = kids.length > 0;
    return `<div class="node ${open ? "open" : ""}" data-id="${esc(String(n.id ?? ""))}">
  <button class="box lvl-${level}" data-toggle="${has ? "1" : "0"}">${label}${has ? `<span class="caret"></span>` : ""}</button>
  ${has ? `<div class="vline"></div><div class="down" style="display:${open ? "flex" : "none"}">${kids
        .map(k => serialize(k, level + 1, openSet))
        .join("")}</div>` : ""}
</div>`;
  };

  const downloadHTML = () => {
    // empaquetamos el estado actual
    const openArr = Array.from(openIds);
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;background:#0f172a;color:#fff;font-family:system-ui,Segoe UI,Roboto,Ubuntu,"Noto Sans",sans-serif}
  .toolbar{display:flex;gap:8px;padding:8px;background:#1f2937;position:sticky;top:0;z-index:10}
  button.ctrl{background:#374151;color:#fff;border:0;border-radius:10px;padding:8px 12px;cursor:pointer}
  #vp{position:relative;height:80vh;overflow:hidden;touch-action:none;cursor:grab}
  #world{position:absolute;left:50%;top:50%;transform-origin:0 0}
  .title{margin:10px 12px 0 12px;font-weight:800;font-size:20px}

  .row{display:flex;gap:16px;align-items:flex-start}
  .row.nowrap{flex-wrap:nowrap}
  .node{display:flex;flex-direction:column;align-items:center;gap:10px;margin:4px 0}
  .down{display:flex;flex-direction:column;gap:14px}
  .vline{width:1px;height:16px;background:rgba(148,163,184,.7);margin:4px 0}
  .hook{width:46px;height:32px;display:none}
  @media(min-width:640px){ .hook{display:block} }
  .hook path{stroke:rgba(148,163,184,.55);stroke-width:1.6;fill:none}

  .box{background:#111827;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:14px 18px;min-width:20ch;max-width:40ch;font-weight:600;line-height:1.25;color:#fff}
  .box.lvl-0{background:#0b1220;border-color:#6b7280;font-weight:800;min-width:22ch;max-width:42ch}
  .box[data-toggle="1"]{cursor:pointer}
  .caret{display:inline-block;margin-left:8px;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:8px solid currentColor;vertical-align:middle;transform:rotate(0);transition:transform .15s ease}
  .node.open > .box .caret{transform:rotate(90deg)}

  /* Imprime tal cual se ve (mismo zoom/pan); solo oculto la toolbar */
  @media print{
    .toolbar{display:none}
    #vp{height:auto}
  }
</style>
<div class="toolbar">
  <button class="ctrl" onclick="zoom(1.1)">＋</button>
  <button class="ctrl" onclick="zoom(0.9)">−</button>
  <button class="ctrl" onclick="center()">Centrar</button>
  <button class="ctrl" onclick="expandAll()">Expandir</button>
  <button class="ctrl" onclick="collapseAll()">Colapsar</button>
  <button class="ctrl" onclick="window.print()">Imprimir</button>
</div>
<div class="title">${esc(title)}</div>
<div id="vp"><div id="world" style="transform:translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${s})">${serialize(
      data.root,
      0,
      new Set(openArr)
    )}</div></div>
<script>
let s=${s},tx=${tx},ty=${ty};
const pointers=new Map();
let panActive=false; let lastPan={x:0,y:0};
const pinch={active:false,startDist:0,startScale:1};
const MOVE_THRESHOLD=3;
const MIN=0.43, MAX=2;

const vp=document.getElementById('vp'), world=document.getElementById('world');
function apply(){ world.style.transform = \`translate(calc(-50% + \${tx}px), calc(-50% + \${ty}px)) scale(\${s})\`; }
function zoom(f){ s=Math.max(MIN, Math.min(MAX, s*f)); apply(); }
function center(){ tx=0; ty=0; s=1; apply(); }

function getDist(){ const a=[...pointers.values()]; if(a.length<2) return 0; const dx=a[0].x-a[1].x, dy=a[0].y-a[1].y; return Math.hypot(dx,dy); }
vp.addEventListener('pointerdown',e=>{ pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); lastPan={x:e.clientX,y:e.clientY}; panActive=false; if(pointers.size===2){ pinch.active=true; pinch.startDist=getDist(); pinch.startScale=s; }});
vp.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch.active && pointers.size>=2){ const dist=getDist()||1, factor=dist/(pinch.startDist||1); s=Math.max(MIN, Math.min(MAX, pinch.startScale*factor)); apply(); return; }
  if(pointers.size===1){ const dx=e.clientX-lastPan.x, dy=e.clientY-lastPan.y, d=Math.hypot(dx,dy); if(!panActive && d>MOVE_THRESHOLD) panActive=true; if(panActive){ lastPan={x:e.clientX,y:e.clientY}; tx+=dx; ty+=dy; apply(); } }
},{passive:false});
function endPointer(e){ pointers.delete(e.pointerId); if(pointers.size<2) pinch.active=false; if(pointers.size===0) panActive=false; }
vp.addEventListener('pointerup',endPointer); vp.addEventListener('pointercancel',endPointer); vp.addEventListener('pointerleave',endPointer);
vp.addEventListener('wheel',e=>{ e.preventDefault(); zoom(e.deltaY>0?0.9:1.1); }, {passive:false});

// Toggle
document.addEventListener('click', function(e){
  const btn = e.target.closest('.box');
  if(!btn || btn.dataset.toggle!=="1") return;
  const node = btn.parentElement;
  node.classList.toggle('open');
  const open = node.classList.contains('open');
  const down = node.querySelector(':scope > .down');
  const vline= node.querySelector(':scope > .vline');
  if(down){ down.style.display = open ? 'flex' : 'none'; }
  if(vline){ vline.style.display = open ? 'block' : 'none'; }
});

// Expand/Collapse
function expandAll(){
  document.querySelectorAll('.node').forEach(n=>{
    n.classList.add('open');
    const d=n.querySelector(':scope > .down'); if(d) d.style.display='flex';
    const v=n.querySelector(':scope > .vline'); if(v) v.style.display='block';
  });
}
function collapseAll(){
  document.querySelectorAll('.node').forEach(n=>{
    n.classList.remove('open');
    const d=n.querySelector(':scope > .down'); if(d) d.style.display='none';
    const v=n.querySelector(':scope > .vline'); if(v) v.style.display='none';
  });
}
</script>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={() => setS(v => clamp(v * 1.1, 0.43, 2))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">
          ＋
        </button>
        <button onClick={() => setS(v => clamp(v * 0.9, 0.43, 2))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">
          −
        </button>
        <button onClick={center} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">
          Centrar
        </button>
        <button onClick={expandAll} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">
          Expandir
        </button>
        <button onClick={collapseAll} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">
          Colapsar
        </button>
        <button onClick={downloadHTML} className="bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-2 text-sm">
          💾 Descargar HTML
        </button>
        <button onClick={() => window.print()} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">
          Imprimir
        </button>
        <button onClick={onBack} className="border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg px-3 py-2 text-sm ml-auto">
          Volver
        </button>
      </div>

      <div
        className="relative w-full h-[72vh] overflow-hidden rounded-xl border border-gray-700 bg-gray-800/40"
        style={{ touchAction: "none", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${s})`,
            transformOrigin: "0 0",
            padding: 12,
          }}
        >
          <NodeDetailed node={data.root} level={0} openIds={openIds} toggle={toggle} />
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
