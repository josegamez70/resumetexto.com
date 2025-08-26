import React, { useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode } from "../types";

// ──────────────────────────────────────────────
// Utils
// ──────────────────────────────────────────────
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const STOP = new Set([
  "de","del","la","el","los","las","y","o","u","en","a","al","con","por","para","un","una","uno","unos","unas",
  "que","se","su","sus","es","son","como","si","no","más","menos","lo","las","les","le","e"
]);

/** Reduce un label largo a un concepto corto (2–4 palabras clave) */
function simplifyLabel(raw: string, maxWords = 4) {
  const clean = (raw || "")
    .replace(/[().,:;/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const tokens = clean.split(" ").filter(Boolean);

  const picked: string[] = [];
  for (const t of tokens) {
    const w = t.toLowerCase();
    if (STOP.has(w) || w.length <= 2) continue;
    picked.push(t);
    if (picked.length >= maxWords) break;
  }
  if (picked.length === 0) picked.push(...tokens.slice(0, Math.min(3, tokens.length)));
  return picked.join(" ");
}

const hasKids = (n: MindMapNode) => (n.children || []).some(c => String(c?.label ?? "").trim());

// ──────────────────────────────────────────────
// UI
// ──────────────────────────────────────────────
const Caret: React.FC<{ open: boolean }> = ({ open }) => (
  <span
    aria-hidden="true"
    className={`inline-block ml-2 transition-transform ${open ? "rotate-90" : "rotate-0"}`}
    style={{
      width: 0, height: 0,
      borderTop: "5px solid transparent",
      borderBottom: "5px solid transparent",
      borderLeft: "7px solid currentColor",
    }}
  />
);

/** Tarjeta compacta (evita texto en columna) */
const Box: React.FC<{ level: number; open?: boolean; clickable?: boolean; children: React.ReactNode }> = ({ level, open, clickable, children }) => (
  <div
    className={`select-none ${clickable ? "cursor-pointer" : ""}`}
    style={{
      background: level === 0 ? "#0b1220" : "#111827",
      color: "#fff",
      border: "1px solid rgba(255,255,255,.15)",
      borderRadius: 12,
      padding: level === 0 ? "14px 18px" : "12px 16px",
      fontWeight: level === 0 ? 800 : 600,
      minWidth: level === 0 ? "18ch" : "16ch",
      maxWidth: level === 0 ? "32ch" : "26ch",
      whiteSpace: "normal",
      wordBreak: "normal",
      overflowWrap: "break-word",
      lineHeight: 1.15
    }}
    data-open={open ? "1" : "0"}
  >
    {children}
  </div>
);

/** Conector curvo de raíz→primer nivel (horizontal) */
const ConnectorRight: React.FC = () => (
  <svg width="42" height="30" viewBox="0 0 42 30" className="hidden sm:block shrink-0" aria-hidden="true">
    <path d="M2 2 C 2 18, 40 2, 40 28" stroke="rgba(148,163,184,.6)" strokeWidth="1.5" fill="none" />
  </svg>
);

// ──────────────────────────────────────────────
// Nodo interactivo
//  - Nivel 0 muestra hijos en FILA (horizontal, colapsados)
//  - Niveles ≥1 abren hacia ABAJO al tocar
// ──────────────────────────────────────────────
const NodeInteractive: React.FC<{ node: MindMapNode; level: number }> = ({ node, level }) => {
  // Hook siempre al inicio (no condicional)
  const [open, setOpen] = useState(false);

  const kids = (node.children || []).filter(c => String(c?.label ?? "").trim());

  if (level === 0) {
    // Fila horizontal de conceptos principales (todos colapsados)
    return (
      <div className="flex sm:flex-row flex-col sm:items-center items-stretch gap-4">
        <Box level={0}>{simplifyLabel(node.label)}</Box>
        {kids.length > 0 && <ConnectorRight />}
        {kids.length > 0 && (
          <div className="flex flex-row gap-4 flex-nowrap">
            {kids.map((k) => (
              <NodeInteractive key={k.id} node={k} level={1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Niveles ≥1: caja clicable; hijos verticales (abajo) al abrir
  const toggle = () => hasKids(node) && setOpen(v => !v);

  return (
    <div className="flex flex-col items-center">
      <div onClick={toggle}>
        <Box level={level} open={open} clickable>
          <div className="flex items-center justify-center">
            <span>{simplifyLabel(node.label)}</span>
            {hasKids(node) && <Caret open={open} />}
          </div>
        </Box>
      </div>

      {open && hasKids(node) && (
        <>
          {/* Conector vertical desde la tarjeta hacia las ramas */}
          <div className="h-4 w-px bg-slate-500/70 my-2" />
          {/* Ramas hacia abajo */}
          <div className="flex flex-col gap-3">
            {kids.map((k) => (
              <div key={k.id} className="flex flex-col items-center">
                <NodeInteractive node={k} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────
// Vista principal con Pan/Zoom + export HTML interactivo
// ──────────────────────────────────────────────
type Props = { data: MindMapData; summaryTitle?: string | null; onBack: () => void };

const MindMapDiagramView: React.FC<Props> = ({ data, summaryTitle, onBack }) => {
  // Pan & Zoom
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [s, setS] = useState(1);
  const panRef = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const title = useMemo(() => summaryTitle || data.root.label || "Mapa mental", [summaryTitle, data.root.label]);

  const onDown = (e: React.PointerEvent) => { panRef.current = true; last.current = { x: e.clientX, y: e.clientY }; };
  const onMove = (e: React.PointerEvent) => {
    if (!panRef.current) return;
    const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setTx(v => v + dx); setTy(v => v + dy);
  };
  const onUp = () => { panRef.current = false; };
  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); setS(v => clamp(v * (e.deltaY > 0 ? 0.9 : 1.1), 0.6, 2)); };
  const center = () => { setTx(0); setTy(0); setS(1); };

  // ===== Export HTML (interactivo con el mismo comportamiento) =====
  const esc = (x = "") => x.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const serialize = (n: MindMapNode, level = 0): string => {
    const kids = (n.children || []).filter(c => String(c?.label ?? "").trim());
    const label = esc(simplifyLabel(n.label));
    if (level === 0) {
      return `<div class="row">
  <div class="box lvl-0">${label}</div>
  ${kids.length ? `<svg class="conn" viewBox="0 0 42 30"><path d="M2 2 C 2 18, 40 2, 40 28" /></svg>` : ""}
  ${kids.length ? `<div class="row nowrap">${kids.map(k=>serialize(k,1)).join("")}</div>` : ""}
</div>`;
    }
    const has = kids.length > 0;
    return `<div class="node" data-level="${level}">
  <button class="box lvl-${level}" data-toggle="${has ? "1" : "0"}">${label}${has ? `<span class="caret"></span>` : ""}</button>
  ${has ? `<div class="vline"></div><div class="down">${kids.map(k=>serialize(k, level+1)).join("")}</div>` : ""}
</div>`;
  };

  const downloadHTML = () => {
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  body{margin:0;background:#0f172a;color:#fff;font-family:system-ui,Segoe UI,Roboto,Ubuntu,"Noto Sans",sans-serif}
  .toolbar{display:flex;gap:8px;padding:8px;background:#1f2937;position:sticky;top:0}
  button.ctrl{background:#374151;color:#fff;border:0;border-radius:10px;padding:8px 12px;cursor:pointer}
  #vp{position:relative;height:80vh;overflow:hidden;touch-action:none;cursor:grab}
  #world{position:absolute;left:50%;top:50%;transform:translate(calc(-50% + 0px),calc(-50% + 0px)) scale(1);transform-origin:0 0}

  .row{display:flex;gap:16px;align-items:flex-start}
  .row.nowrap{flex-wrap:nowrap}
  .node{display:flex;flex-direction:column;align-items:center;gap:8px;margin:4px 0}
  .down{display:flex;flex-direction:column;gap:12px}
  .vline{width:1px;height:14px;background:rgba(148,163,184,.7);margin:4px 0}
  .conn{width:42px;height:30px;display:none}
  @media(min-width:640px){ .conn{display:block} }
  .conn path{stroke:rgba(148,163,184,.6);stroke-width:1.5;fill:none}

  .box{background:#111827;border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:12px 16px;min-width:16ch;max-width:26ch;font-weight:600;line-height:1.15;color:#fff}
  .box.lvl-0{background:#0b1220;border-color:#6b7280;font-weight:800;min-width:18ch;max-width:32ch}
  .box[data-toggle="1"]{cursor:pointer}
  .caret{display:inline-block;margin-left:8px;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:7px solid currentColor;vertical-align:middle;transform:rotate(0);transition:transform .15s ease}
  .node.open > .box .caret{transform:rotate(90deg)}
  @media print {.toolbar{display:none}}
</style>
<div class="toolbar">
  <button class="ctrl" onclick="zoom(1.1)">＋</button>
  <button class="ctrl" onclick="zoom(0.9)">−</button>
  <button class="ctrl" onclick="center()">Centrar</button>
  <button class="ctrl" onclick="window.print()">Imprimir</button>
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

// toggle apertura hacia abajo en niveles >=1
world.addEventListener('click', function(e){
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

// por defecto, todo cerrado salvo la fila raíz
Array.from(world.querySelectorAll('.node')).forEach(n=>{
  n.classList.remove('open');
  const d=n.querySelector(':scope > .down'); if(d) d.style.display='none';
  const v=n.querySelector(':scope > .vline'); if(v) v.style.display='none';
});
</script>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${title}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-3">
        <button onClick={()=>setS(v=>clamp(v*1.1,.6,2))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">＋</button>
        <button onClick={()=>setS(v=>clamp(v*0.9,.6,2))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">−</button>
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
          {/* Raíz + fila horizontal de conceptos; cada uno despliega ramas hacia abajo */}
          <NodeInteractive node={data.root} level={0} />
        </div>
      </div>
    </div>
  );
};

export default MindMapDiagramView;
