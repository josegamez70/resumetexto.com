import React, { useEffect, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  colorMode: MindMapColorMode;
  onBack: () => void;
  onHome?: () => void;
};

const BackToSummaryFab: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-lg hover:bg-yellow-300"
    aria-label="Volver al resumen"
  >
    ← Volver
  </button>
);

// Helpers
const maxWidthCh = (level: number) => (level === 0 ? 34 : level === 1 ? 28 : level === 2 ? 26 : 24);
const isContentful = (n?: Partial<MindMapNode>) => Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

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
    return {
      ...common,
      backgroundColor: "#0b1220",
      color: "#fff",
      border: "2px solid #6b7280",
      fontWeight: 800,
      padding: "10px 16px",
      borderRadius: "12px",
    };
  }
  return {
    ...common,
    backgroundColor: "#1f2937",
    color: "#fff",
    border: "1px solid #4b5563",
    fontWeight: 600,
    padding: "8px 14px",
    borderRadius: "10px",
  };
}
function styleChildrenBorder(): React.CSSProperties {
  return { borderLeft: "1px solid #374151" };
}
const Caret: React.FC<{ open: boolean }> = ({ open }) => (
  <span
    aria-hidden="true"
    className={`inline-block transition-transform ${open ? "rotate-90" : "rotate-0"}`}
    style={{
      width: 0,
      height: 0,
      borderTop: "5px solid transparent",
      borderBottom: "5px solid transparent",
      borderLeft: "7px solid currentColor",
      marginLeft: 6,
    }}
  />
);

const NodeBox: React.FC<{
  node: MindMapNode;
  level: number;
  idx: number;
  expandAllSeq: number;
  collapseAllSeq: number;
  accordionIndex: number | null;
  setAccordionIndex: (idx: number | null) => void;
}> = ({
  node,
  level,
  idx,
  expandAllSeq,
  collapseAllSeq,
  accordionIndex,
  setAccordionIndex,
}) => {
  const [open, setOpen] = useState(level === 0);
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);
  useEffect(() => {
    if (level === 1 && accordionIndex !== null) setOpen(idx === accordionIndex);
  }, [accordionIndex, level, idx]);

  const children = (node.children || []).filter(isContentful);
  const hasChildren = children.length > 0;

  const handleClick = () => {
    if (!hasChildren) return;
    if (level === 1) {
      const willOpen = !open;
      setAccordionIndex(willOpen ? idx : null);
      setOpen(willOpen);
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <div className={`flex flex-col sm:flex-row items-start gap-1.5 sm:gap-3 my-0.5`}>
      <button
        style={styleTag(level)}
        className="shrink-0 text-left w-full sm:w-auto"
        onClick={handleClick}
      >
        <div className="flex items-start sm:items-center">
          <div className="leading-tight">{node.label}</div>
          {hasChildren && <Caret open={open} />}
        </div>
        {node.note && (
          <div className="text-[11px] sm:text-xs opacity-90 mt-0.5 leading-tight">
            {node.note}
          </div>
        )}
      </button>

      {open && hasChildren && (
        <span
          className="sm:hidden inline-block"
          style={{
            width: 16,
            height: 10,
            borderLeft: "1px solid #4b5563",
            borderBottom: "1px solid #4b5563",
            marginLeft: "1rem",
            borderBottomLeftRadius: 8,
          }}
        />
      )}

      {open && hasChildren && (
        <div
          className="pl-3 sm:pl-4 flex flex-col gap-1.5 sm:gap-2 w-full"
          style={styleChildrenBorder()}
        >
          {children.map((c, i) => (
            <NodeBox
              key={c.id}
              node={c}
              level={level + 1}
              idx={i}
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

const MindMapView: React.FC<Props> = ({ data, summaryTitle, onBack }) => {
  const [expandAllSeq, setExpandAllSeq] = useState(0);
  const [collapseAllSeq, setCollapseAllSeq] = useState(0);
  const [accordionIndex, setAccordionIndex] = useState<number | null>(null);

  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const sanitizeFilename = (s: string) =>
    (s || "mapa_mental")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60);

  // 💾 Descargar HTML del mapa mental (estructura UL/LI)
  const downloadHTML = () => {
    const nodeToList = (n: MindMapNode): string => {
      const children = (n.children || []).filter(isContentful);
      const note = n.note ? `<div style="font-size:12px;opacity:.85;margin-top:2px">${esc(n.note)}</div>` : "";
      const kids = children.length ? `<ul>${children.map(nodeToList).join("")}</ul>` : "";
      return `<li><div style="font-weight:600">${esc(n.label)}</div>${note}${kids}</li>`;
    };

    const html = `<!doctype html><html lang="es">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(summaryTitle || "Mapa mental")}</title>
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial;margin:0;background:#0b1220;color:#fff;padding:16px;">
  <header style="margin-bottom:12px">
    <h1 style="margin:0 0 4px;font-size:24px;">🧠 Mapa mental — más detalle</h1>
    <div style="color:#facc15;font-style:italic">${esc(summaryTitle || "")}</div>
  </header>
  <main style="background:#111827;border:1px solid #374151;border-radius:10px;padding:16px;">
    <ul style="list-style:disc;margin-left:20px">${nodeToList(data.root)}</ul>
  </main>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${sanitizeFilename(summaryTitle || "mapa_mental")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental — más detalle</h2>
        </div>

        <div className="flex flex-wrap gap-2 justify-start mb-3 sm:mb-5">
          <button
            onClick={() => {
              setAccordionIndex(null);
              setExpandAllSeq((v) => v + 1);
            }}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm"
          >
            Desplegar todos
          </button>
          <button
            onClick={() => {
              setAccordionIndex(null);
              setCollapseAllSeq((v) => v + 1);
            }}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm"
          >
            Colapsar todos
          </button>
          {/* 💾 Descargar HTML (restaurado) */}
          <button
            onClick={downloadHTML}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm"
          >
            💾 Descargar HTML
          </button>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
          <NodeBox
            node={data.root}
            level={0}
            idx={0}
            expandAllSeq={expandAllSeq}
            collapseAllSeq={collapseAllSeq}
            accordionIndex={accordionIndex}
            setAccordionIndex={setAccordionIndex}
          />
        </div>
      </div>

      {/* FAB Volver sin tocar layout */}
      <BackToSummaryFab onClick={onBack} />
    </div>
  );
};

export default MindMapView;
