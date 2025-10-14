// --- START OF FILE MindMapView.tsx ---

import React, { useEffect, useMemo, useState } from "react";
import { MindMapData, MindMapNode, MindMapColorMode } from "../types";

type Props = {
  data: MindMapData;
  summaryTitle?: string | null;
  colorMode: MindMapColorMode;
  onBack: () => void;
  onHome?: () => void; // NUEVO
};

// ancho razonable para evitar “texto en columna”
const maxWidthCh = (level: number) =>
  level === 0 ? 34 : level === 1 ? 28 : level === 2 ? 26 : 24;

const isContentful = (n?: Partial<MindMapNode>) =>
  Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

// Mejoraremos los estilos para que se parezcan más a un esquema y menos a botones
function styleTag(level: number): React.CSSProperties {
  const common = {
    display: "inline-block", // Para controlar el ancho y la alineación
    maxWidth: `${maxWidthCh(level)}ch`,
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    hyphens: "auto" as const,
    lineHeight: 1.3, // Un poco más de espacio entre líneas
    textAlign: "left" as const, // Asegurar que el texto esté alineado a la izquierda
    backgroundColor: "transparent", // Hacer el fondo transparente para parecer más texto
    color: "#e2e8f0", // Un color de texto ligeramente más claro para contraste
    border: "none", // Eliminar bordes para parecer más texto
    fontWeight: 400, // Menos negrita por defecto para parecer más texto
    padding: "2px 0", // Reducir padding
    borderRadius: "0px", // Sin bordes redondeados
    cursor: "pointer", // Mantener cursor de puntero para interactividad
    // Añadiremos indentación vía `margin-left` en el NodeBox si es necesario, o en el padre
  };

  // Estilos específicos para niveles para dar jerarquía visual
  if (level === 0) {
    return {
      ...common,
      color: "#f8fafc", // Un poco más blanco para el root
      fontWeight: 700, // Más negrita para el tema central
      fontSize: "1.25rem", // Tamaño de fuente más grande
      padding: "8px 0", // Más padding para el título
      borderBottom: "1px solid #475569", // Una línea debajo para separar el título
      marginBottom: "10px", // Espacio después del título
      maxWidth: "none", // Root puede ser más ancho
    };
  } else if (level === 1) {
    return {
      ...common,
      fontWeight: 600, // Negrita para ideas principales
      fontSize: "1.1rem",
      padding: "4px 0",
      color: "#cbd5e1", // Color para el nivel 1
    };
  } else if (level === 2) {
    return {
      ...common,
      fontWeight: 500, // Menos negrita para subtemas
      fontSize: "1rem",
      color: "#a0aec0", // Color para el nivel 2
    };
  } else { // Nivel 3 y superiores si existieran (aunque el back-end limita a 3)
    return {
      ...common,
      fontWeight: 400,
      fontSize: "0.9rem",
      color: "#718096", // Color para el nivel 3
    };
  }
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
      verticalAlign: "middle", // Alineación con el texto
      transformOrigin: "center center", // Asegurar rotación correcta
    }}
  />
);

interface NodeBoxProps { // Define las props de NodeBox
  node: MindMapNode;
  level: number;
  idx: number;
  expandAllSeq: number;
  collapseAllSeq: number;
  accordionIndex: number | null;
  setAccordionIndex: (idx: number | null) => void;
  rootNote: string | undefined; // Nueva prop: la nota del nodo raíz global
}

const NodeBox: React.FC<NodeBoxProps> = ({ // Usa las props definidas
  node,
  level,
  idx,
  expandAllSeq,
  collapseAllSeq,
  accordionIndex,
  setAccordionIndex,
  rootNote, // Recibe la nueva prop
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

  // Calcular la indentación en base al nivel
  const indentPadding = level * 20; // 20px por nivel, ajusta según necesites

  // Para que el Root no tenga indentación y sus hijos empiecen con indentación
  const effectivePadding = level === 0 ? 0 : indentPadding;

  return (
    <div
      className="flex flex-col gap-0.5 sm:gap-1" // Reducir el gap vertical
      style={{ marginLeft: effectivePadding }} // Aplicar indentación aquí
    >
      <button
        style={styleTag(level)}
        className="shrink-0 text-left w-full sm:w-auto flex items-center" // Añadir flex para alinear label y caret
        onClick={handleClick}
      >
        <div className="leading-tight flex-grow">{node.label}</div> {/* flex-grow para que ocupe espacio */}
        {hasChildren && <Caret open={open} />}
      </button>

      {/* MODIFICACIÓN AQUÍ: Usar 'rootNote' en lugar de 'data.root.note' */}
      {node.note && (level !== 0 || !rootNote) && ( // Mostrar nota, pero no la del root si ya se mostró como parte del título
          <div className="text-[11px] sm:text-xs opacity-80 mt-0.5 leading-tight"
               style={{ marginLeft: level === 0 ? 0 : 20 }} // Indentación para la nota
          >
            {node.note}
          </div>
        )}

      {open && hasChildren && (
        <div
          className="flex flex-col gap-0.5 sm:gap-1 w-full"
          // style={styleChildrenBorder()} // Si quieres la línea vertical, deja esto o recrea con pseudo-elementos
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
              rootNote={rootNote} // Pasar la prop a los hijos
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MindMapView: React.FC<Props> = ({ data, summaryTitle, onBack, onHome }) => {
  const [expandAllSeq, setExpandAllSeq] = useState(0);
  const [collapseAllSeq, setCollapseAllSeq] = useState(0);
  const [accordionIndex, setAccordionIndex] = useState<number | null>(null);

  const pageTitle = useMemo(
    () => summaryTitle || data.root.label || "Mapa mental",
    [summaryTitle, data.root.label]
  );
  const esc = (s = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // === Función para generar texto tipo "Notebook LM" ===
  const generateNotebookLmText = () => {
    const lines: string[] = [];
    const indentChar = "  "; // 2 espacios por nivel

    const traverseForText = (node: MindMapNode, level: number) => {
      const currentIndent = indentChar.repeat(level);

      lines.push(`${currentIndent}- ${node.label.trim()}`);

      if (node.note && node.note.trim()) {
        lines.push(`${currentIndent}${indentChar}  ${node.note.trim()}`);
      }

      if (node.children && node.children.length > 0) {
        node.children.filter(isContentful).forEach((child) => traverseForText(child, level + 1));
      }
    };

    // Título principal para la raíz
    lines.push(`# ${data.root.label.trim()}`);
    if (data.root.note && data.root.note.trim()) {
      lines.push(`${data.root.note.trim()}`);
    }
    lines.push(''); // Línea en blanco después del título/nota de la raíz

    // Recorrer los hijos de la raíz (que serán el nivel 0 de la lista)
    if (data.root.children && data.root.children.length > 0) {
      data.root.children.filter(isContentful).forEach((child) => traverseForText(child, 0));
    }

    return lines.join("\n");
  };

  // === Descarga el texto generado ===
  const downloadNotebookLm = () => {
    const textContent = generateNotebookLmText();
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageTitle}_notebook.txt`; // Nombre de archivo sugerido
    a.click();
    URL.revokeObjectURL(url);
  };

  // === Descarga HTML estilo "notebook" ===
  const downloadHTML = () => {
    const isContentfulLocal = (n?: Partial<MindMapNode>) =>
      Boolean(String(n?.label ?? "").trim() || String(n?.note ?? "").trim());

    // Nueva función para serializar a HTML con estilo de notebook
    const serializeToNotebookHtml = (node: MindMapNode, level = 0): string => {
      const kids = (node.children || []).filter(isContentfulLocal);
      const has = kids.length > 0;
      const label = esc(String(node.label ?? ""));
      const note = esc(String(node.note ?? ""));
      // const indent = "  ".repeat(level); // Indentación en HTML para pre-formateado

      let nodeHtml = '';

      // El nivel 0 real en esta función es el primer hijo de la raíz
      const effectiveLevel = level + 1; // Para ajustar estilos si se prefiere

      if (level === 0) { // Los hijos directos de la raíz
        nodeHtml += `<li style="margin-left:${0}px; font-weight:600; font-size:1.1rem; color:#cbd5e1;">${label}\n`;
        if (note) nodeHtml += `<p style="margin-left:${20}px; font-size:12px; opacity:0.8; color:#a0aec0;">${note}</p>\n`;
        if (has) {
          nodeHtml += `<ul style="list-style:none; padding-left:0;">\n`;
        }
      } else { // Subniveles
        nodeHtml += `<li style="margin-left:${level * 20}px; font-weight:${700 - effectiveLevel * 100}; font-size:${18 - effectiveLevel * 2}px; color:${effectiveLevel === 1 ? '#cbd5e1' : effectiveLevel === 2 ? '#a0aec0' : '#718096'};">${label}\n`;
        if (note) nodeHtml += `<p style="margin-left:${(level + 1) * 20}px; font-size:12px; opacity:0.8; color:${effectiveLevel === 1 ? '#a0aec0' : '#718096'};">${note}</p>\n`;
        if (has) {
          nodeHtml += `<ul style="list-style:none; padding-left:0;">\n`;
        }
      }

      if (has) {
        nodeHtml += kids.map((c) => serializeToNotebookHtml(c, level + 1)).join("");
      }

      if (has) { // Cerrar ul si tiene hijos
        nodeHtml += `</ul>\n`;
      }
      nodeHtml += `</li>\n`; // Cerrar li

      return nodeHtml;
    };

    const rootChildrenHtml = (data.root.children || []).filter(isContentfulLocal).map(c => serializeToNotebookHtml(c, 0)).join("");

    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pageTitle)}</title>
<style>
  body{margin:0;background:#111827;color:#fff;font-family:system-ui,Segoe UI,Roboto,Ubuntu,"Noto Sans",sans-serif; padding:20px;}
  h1 { color:#f8fafc; font-weight:700; font-size:1.5rem; border-bottom:1px solid #475569; padding-bottom:8px; margin-bottom:15px; margin-top:0;}
  p { margin:5px 0; }
  ul { list-style:none; padding-left:0; margin:0; }
  li { margin:5px 0; line-height:1.3; }
  /* Otros estilos básicos para simular el notebook */
</style>
<body>
  <h1>${esc(data.root.label)}</h1>
  ${data.root.note ? `<p>${esc(data.root.note)}</p>` : ''}
  <ul>
    ${rootChildrenHtml}
  </ul>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageTitle}_notebook.html`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">🧠 Mapa mental — más detalle</h2>
          <div className="w-full sm:w-auto flex justify-center">
            <button
              onClick={onHome || onBack}
              className="inline-flex items-center justify-center gap-2 border border-gray-600 text-gray-100 hover:bg-gray-700/40 px-4 py-2 rounded-lg w-full sm:w-auto"
              aria-label="Inicio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3l9 8h-3v7h-5v-5H11v5H6v-7H3l9-8z"/>
              </svg>
              <span>Inicio</span>
            </button>
          </div>
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
          <button
            onClick={downloadHTML} // Este ahora descarga el HTML estilo "notebook"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            Descargar HTML (Esquema)
          </button>
          <button
            onClick={downloadNotebookLm}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
          >
            Descargar como Texto
          </button>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4">
           {/* La nota del root la mostramos como parte del título principal */}
           <h3 className="text-2xl font-bold text-gray-100 mb-2">
             {data.root.label}
           </h3>
           {data.root.note && (
             <p className="text-gray-400 text-sm mb-4">{data.root.note}</p>
           )}
          <div className="flex flex-col gap-1"> {/* Contenedor para los hijos del root */}
            {(data.root.children || []).filter(isContentful).map((c, i) => (
              <NodeBox
                key={c.id}
                node={c}
                level={1} // Los hijos de la raíz son nivel 1
                idx={i}
                expandAllSeq={expandAllSeq}
                collapseAllSeq={collapseAllSeq}
                accordionIndex={accordionIndex}
                setAccordionIndex={setAccordionIndex}
                rootNote={data.root.note} // ¡AQUÍ ESTÁ LA CORRECCIÓN! Pasamos la nota del root
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMapView;