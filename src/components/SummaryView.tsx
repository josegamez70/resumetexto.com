// components/SummaryView.tsx
import React, { useState } from "react";
import { PresentationType, MindMapColorMode } from "../types";

interface SummaryViewProps {
  summary: string;
  summaryTitle: string;
  presentationType: PresentationType;
  setPresentationType: (type: PresentationType) => void;
  onGeneratePresentation: () => void;
  onOpenMindMap: (colorMode: MindMapColorMode) => void;
  onGenerateFlashcards: () => void;
  onReset: () => void;
}

/**
 * Solo cambia:
 *  - Barra GENERAR centrada (amarillo parpadeante)
 *  - Botón Atrás/Inicio debajo
 * El resto de la funcionalidad se mantiene.
 */
const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  summaryTitle,
  presentationType,
  setPresentationType,
  onGeneratePresentation,
  onOpenMindMap,
  onGenerateFlashcards,
  onReset,
}) => {
  // Mantenemos la selección local para decidir qué generar
  type Option = "conceptual" | "mindmap-color" | "mindmap-bw";
  const [option, setOption] = useState<Option>("conceptual");

  const handleGenerate = () => {
    if (option === "conceptual") {
      // no cambia: usa tu callback existente
      onGeneratePresentation();
    } else if (option === "mindmap-color") {
      onOpenMindMap(MindMapColorMode.Color);
    } else {
      onOpenMindMap(MindMapColorMode.BlancoNegro);
    }
  };

  const Card: React.FC<{
    id: Option;
    title: string;
    subtitle: string;
    emoji: string;
  }> = ({ id, title, subtitle, emoji }) => {
    const active = option === id;
    return (
      <button
        onClick={() => {
          setOption(id);
          if (id === "conceptual") {
            // mantener el tipo de presentación como antes
            try { setPresentationType(PresentationType.Extensive); } catch {}
          }
        }}
        className={`w-full text-left rounded-2xl p-4 sm:p-5 border transition
          ${active ? "border-yellow-400 ring-4 ring-yellow-400/30 bg-gray-800/60" : "border-gray-700 bg-gray-800/30 hover:bg-gray-800/60"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">{emoji}</div>
          <div>
            <div className="font-bold text-white text-lg">{title}</div>
            <div className="text-gray-300 text-sm">{subtitle}</div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      {/* Título */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Tu resumen</h1>
        <p className="text-yellow-400 italic text-sm sm:text-base">{summaryTitle}</p>
      </div>

      {/* Resumen */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sm:p-5 text-sm sm:text-base text-gray-100 whitespace-pre-line">
        {summary}
      </div>

      {/* Elección (misma lógica, solo estilos) */}
      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-3">¿Qué quieres generar?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card
            id="conceptual"
            emoji="🧩"
            title="Mapa conceptual (desplegables)"
            subtitle="Estructura en secciones con acordeones."
          />
          <Card
            id="mindmap-color"
            emoji="🧠"
            title="Mapa mental — más detalle"
            subtitle="Nodos en cascada, interactivo y descargable."
          />
          <Card
            id="mindmap-bw"
            emoji="🗺️"
            title="Mapa mental clásico"
            subtitle="Blanco y negro, más simple."
          />
        </div>

        {/* ───────── CAMBIO 1: Barra GENERAR centrada amarilla (mobile-first) ───────── */}
        <div className="mt-4 sm:mt-6 flex justify-center">
          <button
            onClick={handleGenerate}
            className="w-full sm:w-2/3 lg:w-1/2 py-3 sm:py-4 rounded-xl bg-yellow-400 text-black font-extrabold text-base sm:text-lg
                       shadow-lg animate-pulse hover:animate-none hover:bg-yellow-300"
            aria-label="Generar"
          >
            GENERAR
          </button>
        </div>

        {/* Acciones secundarias (no cambia la lógica) */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
          <button
            onClick={onGenerateFlashcards}
            className="px-4 py-2 rounded-lg border border-gray-600 text-white hover:bg-gray-700/40"
          >
            Generar flashcards
          </button>

          {/* ───────── CAMBIO 2: Botón Atrás/Inicio bien visible ───────── */}
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg border border-gray-600 text-white hover:bg-gray-700/40 inline-flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3l9 8h-3v7h-5v-5H11v5H6v-7H3l9-8z"/>
            </svg>
            Atrás / Inicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
