import React, { useRef } from "react";
import { PresentationData, PresentationType } from "../types";

interface PresentationViewProps {
  presentation: PresentationData;
  presentationType: PresentationType;
  summaryTitle: string;
  onBackToSummary: () => void; // ← ya lo tenías
  onHome?: () => void;         // no se usa aquí
}

const BackToSummaryFab: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-lg hover:bg-yellow-300"
    aria-label="Volver al resumen"
  >
    ← Volver
  </button>
);

const PresentationView: React.FC<PresentationViewProps> = ({
  presentation,
  presentationType,
  summaryTitle,
  onBackToSummary,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!presentation || !presentation.sections) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-fadeIn text-center">
        <p>No hay datos para mostrar.</p>
        <BackToSummaryFab onClick={onBackToSummary} />
      </div>
    );
  }

  const expandAll = () => {
    containerRef.current?.querySelectorAll("details").forEach((d) => d.setAttribute("open", "true"));
  };

  const collapseAll = () => {
    containerRef.current?.querySelectorAll("details").forEach((d) => d.removeAttribute("open"));
  };

  const printPDF = () => window.print();

  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const sanitizeFilename = (s: string) =>
    (s || "presentacion")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60);

  // 💾 Descargar HTML de la presentación (resumen + secciones con niveles)
  const downloadHTML = () => {
    const toHTML = (section: any, level = 1): string => {
      const titleTag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      const border =
        level === 1
          ? "border:1px solid #e5e7eb;background:#111827;color:#fff;border-radius:10px;"
          : level === 2
          ? "border:1px solid #e5e7eb;background:#1f2937;color:#fff;border-radius:10px;margin-left:8px;"
          : "border:1px solid #e5e7eb;background:#374151;color:#fff;border-radius:10px;margin-left:16px;";
      const headBg =
        level === 1
          ? "background:#facc15;color:#000"
          : level === 2
          ? "background:#2563eb;color:#fff"
          : "background:#fde68a;color:#111827";
      const emoji = section.emoji ? `${section.emoji} ` : "";
      const content = section.content ? `<p style="margin:0;padding:12px">${esc(section.content)}</p>` : "";
      const kids = Array.isArray(section.subsections)
        ? section.subsections.map((s: any) => toHTML(s, level + 1)).join("")
        : "";
      return `
        <section style="margin:10px 0;${border}">
          <${titleTag} style="margin:0;padding:10px 12px;${headBg};font-weight:800">${emoji}${esc(section.title || "")}</${titleTag}>
          ${content}
          ${kids}
        </section>
      `;
    };

    const html = `<!doctype html><html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(summaryTitle || "Presentación")}</title>
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial;margin:0;background:#0b1220;color:#fff;padding:16px;">
  <header style="margin-bottom:12px">
    <h1 style="margin:0 0 4px;font-size:24px;">Mapa conceptual (desplegables)</h1>
    <div style="color:#facc15;font-style:italic">${esc(summaryTitle || "")}</div>
    <div style="color:#9ca3af;margin-top:4px">Tipo: ${esc(String(presentationType))}</div>
  </header>
  <main>
    ${presentation.sections.map((s: any) => toHTML(s, 1)).join("")}
  </main>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${sanitizeFilename(summaryTitle || "presentacion")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleTopSummaryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const detailsEl = (e.currentTarget as HTMLElement).parentElement as HTMLDetailsElement;
    const isOpen = detailsEl.hasAttribute("open");
    const wrapper = containerRef.current;
    if (!wrapper) return;
    if (isOpen) {
      detailsEl.removeAttribute("open");
    } else {
      wrapper.querySelectorAll("details.lvl1").forEach((d) => d.removeAttribute("open"));
      detailsEl.setAttribute("open", "true");
    }
  };

  const renderSection = (section: any, level = 1) => {
    let summaryClass =
      "bg-yellow-500 text-black px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
    let contentClass = "p-3 sm:p-4 whitespace-pre-line text-sm sm:text-base break-words";
    if (level === 2) {
      summaryClass =
        "bg-blue-600 text-white px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
      contentClass =
        "p-3 sm:p-4 bg-blue-100 text-black whitespace-pre-line text-sm sm:text-base break-words";
    }
    if (level >= 3) {
      summaryClass =
        "bg-yellow-200 text-gray-800 px-3 sm:px-4 py-2 font-semibold cursor-pointer select-none text-sm sm:text-base break-words";
      contentClass =
        "p-3 sm:p-4 bg-yellow-50 text-gray-800 whitespace-pre-line text-sm sm:text-base break-words";
    }
    const isTop = level === 1;

    return (
      <details
        className={`border rounded-lg overflow-hidden w-full max-w-full ${
          isTop
            ? "lvl1 bg-gray-800 border-gray-700"
            : level === 2
            ? "bg-gray-700 border-gray-600 pl-2 sm:pl-4"
            : "bg-gray-600 border-gray-500 pl-3 sm:pl-6"
        }`}
      >
        <summary
          className={summaryClass}
          onClick={isTop ? handleTopSummaryClick : undefined}
        >
          {section.emoji} {section.title}
        </summary>
        {section.content && <p className={contentClass}>{section.content}</p>}
        {Array.isArray(section.subsections) &&
          section.subsections.map((sub: any) => renderSection(sub, level + 1))}
      </details>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Mapa conceptual (desplegables)</h1>
          <h3 className="text-base sm:text-lg italic text-yellow-400">{summaryTitle}</h3>
          <p className="text-xs sm:text-sm text-gray-400 italic">Tipo: {presentationType}</p>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap gap-2 justify-start mb-3 sm:mb-6">
        <button onClick={expandAll} className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm">
          📂 Desplegar todos
        </button>
        <button onClick={collapseAll} className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm">
          📁 Colapsar todos
        </button>
        <button onClick={printPDF} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm">
          🖨 Imprimir
        </button>
        {/* 💾 Descargar HTML (restaurado) */}
        <button onClick={downloadHTML} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm">
          💾 Descargar HTML
        </button>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 sm:p-4 overflow-x-hidden">
        <div ref={containerRef} className="space-y-3">
          {presentation.sections.map((section) => renderSection(section, 1))}
        </div>
      </div>

      {/* FAB Volver */}
      <BackToSummaryFab onClick={onBackToSummary} />
    </div>
  );
};

export default PresentationView;
