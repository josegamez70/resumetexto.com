import React, { useEffect, useMemo, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

type Props = { data: MindMapData; summaryTitle?: string | null; colorMode: MindMapColorMode; onBack: () => void };

// ancho razonable para evitar “texto en columna”
const maxWidthCh = (level: number) => (level === 0 ? 34 : level === 1 ? 28 : level === 2 ? 26 : 24);

const isContentful = (n?: Partial<MindMapNode>) =>
  Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

function styleTag(level: number): React.CSSProperties {
  const common = {
    display: "inline-block",
    maxWidth: `${maxWidthCh(level)}ch`,
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    hyphens: "auto" as const,
    lineHeight: 1.15,
  };
  if (level === 0) {
    return { ...common, backgroundColor: "#0b1220", color: "#fff", border: "2px solid #6b7280", fontWeight: 800, padding: "10px 16px", borderRadius: "12px" };
  }
  return { ...common, backgroundColor: "#1f2937", color: "#fff", border: "1px solid #4b5563", fontWeight: 600, padding: "8px 14px", borderRadius: "10px" };
}

function styleChildrenBorder(): React.CSSProperties {
  return { borderLeft: "1px solid #374151" };
}

const Caret: React.FC<{ open: boolean }> = ({ open }) => (
  <span aria-hidden="true" className={`inline-block transition-transform ${open ? "rotate-90" : "rotate-0"}`}
        style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid currentColor", marginLeft: 6 }} />
);

const NodeBox: React.FC<{
  node: MindMapNode; level: number; idx: number;
  expandAllSeq: number; collapseAllSeq: number;
  accordionIndex: number | null; setAccordionIndex: (idx: number | null) => void;
}> = ({ node, level, idx, expandAllSeq, collapseAllSeq, accordionIndex, setAccordionIndex }) => {
  const [open, setOpen] = useState(level === 0);
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);
  useEffect(() => { if (level === 1 && accordionIndex !== null) setOpen(idx === accordionIndex); }, [accordionIndex, level, idx]);

  const children = (node.children || []).filter(isContentful);
  const hasChildren = children.length > 0;

  const handleClick = () => {
    if (!hasChildren) return;
    if (level === 1) { const willOpen = !open; setAccordionIndex(willOpen ? idx : null); setOpen(willOpen); return; }
    setOpen(v => !v);
  };

  return (
    <div className={`flex flex-col sm:flex-row items-start gap-1.5 sm:gap-3 my-0.5`}>
      <button style={styleTag(level)} className="shrink-0 text-left w-full sm:w-auto" onClick={handleClick}>
        <div className="flex items-start sm:items-center">
          <div className="leading-tight">{node.label}</div>
          {hasChildren && <Caret open={open} />}
        </div>
        {node.note && <div className="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-tight">{node.note}</div>}
      </button>

      {open && hasChildren && <span className="sm:hidden inline-block" style={{ width: 16, height: 10, borderLeft: "1px solid #4b5563", borderBottom: "1px solid #4b5563", marginLeft: "1rem", borderBottomLeftRadius: 8 }} />}

      {open && hasChildren && (
        <div className="pl-3 sm:pl-4 flex flex-col gap-1.5 sm:gap-2 w-full" style={styleChildrenBorder()}>
          {children.map((c, i) => (
            <NodeBox key={c.id} node={c} level={level + 1} idx={i}
                     expandAllSeq={expandAllSeq} collapseAllSeq={collapseAllSeq}
                     accordionIndex={accordionIndex} setAccordionIndex={setAccordionIndex}/>
          ))}
        </div>
      )}
    </div>
  );
};

const MindMapView: React.FC<Props> = ({ data, summaryTitle, onBack }) => {
  const [expandAllSeq, setExpandAllSeq] = useState(0);
  const [collapseAllSeq, setCollapseAllSeq] = useState(0);
  const [accordionIndex, setAccordionIndex] = useState<number | null>(null);

  const pageTitle = useMemo(() => summaryTitle || data.root.label || "Mapa mental", [summaryTitle, data.root.label]);
  const esc = (s = "") => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // === Descarga HTML que se ve igual que la presentación ===
  const downloadHTML = () => {
    const isContentfulLocal = (n?: Partial<MindMapNode>) =>
      Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

    const serialize = (node: MindMapNode, level = 0): string => {
      const kids = (node.children || []).filter(isContentfulLocal);
      const has = kids.length > 0;
      const label = esc(String(node.label ?? ""));
      const note = esc(String(node.note ?? ""));
      return `
<div class="node lvl-${level}">
  <button class="tag lvl-${level}" data-has="${has ? "1" : "0"}">
    <div class="row">
      <span class="label">${label}</span>
      ${has ? `<span class="caret"></span>` : ""}
    </div>
    ${note ? `<div class="note">${note}</div>` : ""}
  </button>
  ${has ? `<div class="children">${kids.map(c => serialize(c, level + 1)).join("")}</div>` : ""}
</div>`;
    };

    // ✅ Generamos el HTML del árbol fuera del template para evitar `${${...}}`
    const treeHtml = serialize(data.root);

    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title>
<style>
  :root{color-scheme:light dark}
  body{margin:0;background:#111827;color:#fff;font-family:system-ui,Segoe UI,Roboto,Ubuntu,"Noto Sans",sans-serif}
  .wrap{padding:16px;max-width:1200px;margin:0 auto}
  .hdr{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.75rem}
  .title{font-weight:800;font-size:20px}
  .controls{display:flex;flex-wrap:wrap;gap:.5rem}
  .btn{background:#2563eb;border:0;color:#fff;padding:.5rem .75rem;border-radius:.6rem;cursor:pointer}
  .btn.secondary{background:#374151}
  .tree{background:rgba(31,41,55,.5);border:1px solid #374151;border-radius:12px;padding:.75rem .9rem}

  .node{display:flex;flex-direction:column;gap:.4rem;margin:.2rem 0}
  .row{display:flex;align-items:flex-start;gap:.4rem}
  .note{font-size:11px;opacity:.9;margin-top:.25rem;line-height:1.2}
  .children{border-left:1px solid #374151;padding-left:.75rem}
  @media(min-width:640px){.children{padding-left:1rem}}

  /* Tarjetas como la presentación (mismos colores/medidas) */
  .tag{display:inline-block; text-align:left; background:#1f2937; color:#fff; border:1px solid #4b5563; border-radius:10px; padding:.5rem .9rem; line-height:1.15; max-width:26ch}
  .tag.lvl-0{background:#0b1220; border:2px solid #6b7280; font-weight:800; max-width:34ch; padding:.625rem 1rem; border-radius:12px}
  .tag.lvl-1{max-width:28ch}
  .tag.lvl-2{max-width:26ch}
  .tag.lvl-3{max-width:24ch}

  .caret{display:inline-block; width:0; height:0; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:7px solid currentColor; margin-left:6px; transition:transform .15s ease; transform:rotate(0)}
  .node.open > .tag .caret{transform:rotate(90deg)}

  /* Imprimir “tal como está” (mantiene abiertos/cerrados) */
  @media print{ .hdr{display:none} }
</style>
<div class="wrap">
  <div class="hdr">
    <div class="title">🧠 ${esc(pageTitle)} — más detalle</div>
    <div class="controls">
      <button class="btn secondary" onclick="expandAll()">Expandir todos</button>
      <button class="btn secondary" onclick="collapseAll()">Colapsar todos</button>
      <button class="btn" onclick="window.print()">Imprimir</button>
    </div>
  </div>
  <div class="tree" id="tree">
    ${treeHtml}
  </div>
</div>
<script>
  // Estado inicial como en la presentación: raíz abierta, resto cerrado
  (function initOpen(){
    const root = document.querySelector('.node.lvl-0');
    if(root){
      root.classList.add('open');
    }
  })();

  // Toggle de nodos; en nivel 1 se comporta tipo acordeón (como en la app)
  document.getElementById('tree').addEventListener('click', function(e){
    const tag = e.target.closest('.tag'); if(!tag || tag.dataset.has!=="1") return;
    const node = tag.parentElement;
    const level = Array.from(node.classList).find(c=>c.startsWith('lvl-'));
    const isLvl1 = level === 'lvl-1';

    if(isLvl1){
      // cerrar hermanos
      const siblings = Array.from(node.parentElement.children).filter(el => el !== node && el.classList && el.classList.contains('node'));
      siblings.forEach(s => s.classList.remove('open'));
    }
    node.classList.toggle('open');
  });

  function expandAll(){
    document.querySelectorAll('.node').forEach(n => n.classList.add('open'));
  }
  function collapseAll(){
    document.querySelectorAll('.node').forEach((n,i) => {
      if(n.classList.contains('lvl-0')) n.classList.add('open'); else n.classList.remove('open');
    });
  }
</script>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${pageTitle}.html`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-stretch sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental — más detalle</h2>
          <button onClick={onBack} className="border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm">Volver</button>
        </div>

        <div className="flex flex-wrap gap-2 justify-start mb-3 sm:mb-5">
          <button onClick={() => { setAccordionIndex(null); setExpandAllSeq(v=>v+1); }} className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm">Desplegar todos</button>
          <button onClick={() => { setAccordionIndex(null); setCollapseAllSeq(v=>v+1); }} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm">Colapsar todos</button>
          <button onClick={downloadHTML} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">Descargar HTML</button>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
          <NodeBox
            node={data.root} level={0} idx={0}
            expandAllSeq={expandAllSeq} collapseAllSeq={collapseAllSeq}
            accordionIndex={accordionIndex} setAccordionIndex={setAccordionIndex}
          />
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
