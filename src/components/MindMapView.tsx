// src/components/MindMapView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MindMapData, MindMapNode } from "../types";

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  onBack: () => void;
};

const NodeView: React.FC<{
  node: MindMapNode;
  level: number;
  expandAllSeq: number;
  collapseAllSeq: number;
}> = ({ node, level, expandAllSeq, collapseAllSeq }) => {
  const [open, setOpen] = useState(level === 0); // raíz abierta
  useEffect(() => setOpen(true), [expandAllSeq]);
  useEffect(() => setOpen(false), [collapseAllSeq]);

  const hasChildren = (node.children?.length || 0) > 0;

  return (
    <div className="my-1">
      <div
        className="flex items-start gap-2 cursor-pointer select-none"
        style={{ paddingLeft: level === 0 ? 0 : 16 }}
        onClick={(e) => {
          // Evita que al clicar sobre el texto de un hijo se dispare arriba
          if ((e.target as HTMLElement).closest("button")) return;
          if (hasChildren) setOpen((v) => !v);
        }}
      >
        <button
          className={`w-6 h-6 rounded text-sm leading-6 text-center ${
            hasChildren ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800"
          }`}
          onClick={() => hasChildren && setOpen((v) => !v)}
          title={hasChildren ? (open ? "Colapsar" : "Expandir") : "Hoja"}
        >
          {hasChildren ? (open ? "−" : "+") : "•"}
        </button>
        <div>
          <div className="font-semibold">{node.label}</div>
          {node.note && <div className="text-sm text-gray-400">{node.note}</div>}
        </div>
      </div>

      {open && hasChildren && (
        <div className="ml-4 pl-4 border-l border-gray-700">
          {node.children!.map((c) => (
            <NodeView
              key={c.id}
              node={c}
              level={level + 1}
              expandAllSeq={expandAllSeq}
              collapseAllSeq={collapseAllSeq}
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
  const containerRef = useRef<HTMLDivElement>(null);

  const pageTitle = useMemo(
    () => summaryTitle || data.root.label || "Mapa mental",
    [summaryTitle, data.root.label]
  );

  const downloadHTML = () => {
    if (!containerRef.current) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html, body { height: 100%; }
  body { max-width: 100%; overflow-x: hidden; }
  .tree { max-width: 100%; }
</style>
<script>
function expandAll(){ document.querySelectorAll('[data-node]').forEach(n => n.setAttribute('data-open','true')); }
function collapseAll(){ document.querySelectorAll('[data-node]').forEach(n => n.removeAttribute('data-open')); }
function printPDF(){ window.print(); }
</script>
</head>
<body class="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
  <h1 class="text-2xl sm:text-3xl font-bold mb-2">Mapa mental</h1>
  <h3 class="text-lg italic text-yellow-400 mb-6">${pageTitle}</h3>

  <div class="flex flex-wrap gap-2 sm:gap-4 mb-6">
    <button onclick="expandAll()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg">📂 Desplegar todos</button>
    <button onclick="collapseAll()" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg">📁 Colapsar todos</button>
    <button onclick="printPDF()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg">🖨 Imprimir a PDF</button>
  </div>

  <div class="tree space-y-2">
    ${containerRef.current.innerHTML}
  </div>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageTitle}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🧠 Mapa mental</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setExpandAllSeq((v) => v + 1)}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Desplegar todos
            </button>
            <button
              onClick={() => setCollapseAllSeq((v) => v + 1)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Colapsar todos
            </button>
            <button
              onClick={downloadHTML}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Descargar HTML
            </button>
            <button
              onClick={onBack}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              Volver
            </button>
          </div>
        </div>

        <div ref={containerRef}>
          <div data-node className="space-y-2">
            <NodeView
              node={data.root}
              level={0}
              expandAllSeq={expandAllSeq}
              collapseAllSeq={collapseAllSeq}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
