// components/FlashcardView.tsx
import React, { useState } from "react";
import { Flashcard } from "../types";

interface FlashcardViewProps {
  flashcards: Flashcard[];
  summaryTitle: string | null;
  onBack: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({
  flashcards,
  summaryTitle,
  onBack,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [shuffledFlashcards] = useState(() => {
    const arr = [...flashcards];
    if (arr.length > 1) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    return arr;
  });

  if (!shuffledFlashcards || shuffledFlashcards.length === 0) {
    return (
      <div className="text-center p-6 animate-fadeIn">
        <p className="text-gray-300">No hay flashcards para mostrar.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 rounded-lg"
        >
          Volver
        </button>
      </div>
    );
  }

  const currentCard = shuffledFlashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % shuffledFlashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? shuffledFlashcards.length - 1 : prevIndex - 1
    );
  };

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const esc = (s: string = "") =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const handlePrintFlashcards = () => {
    const flashcardsHtml = shuffledFlashcards.map((card) => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; color: #333;">
        <p style="font-weight: bold; margin-bottom: 5px;">Q: ${esc(card.question)}</p>
        <p>A: ${esc(card.answer)}</p>
      </div>
    `).join("");

    const pageTitle = summaryTitle || "Flashcards";
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(pageTitle)} - Flashcards</title>
    <style>
        body { font-family: sans-serif; margin: 20px; color: #333; }
        h1 { text-align: center; margin-bottom: 30px; }
        @media print {
            .no-print { display: none; }
            body { margin: 0; }
            div { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <h1 class="no-print">${esc(pageTitle)} - Flashcards</h1>
    <p class="no-print" style="text-align: center; margin-bottom: 20px;">
        Esta es una lista imprimible de tus flashcards.
    </p>
    ${flashcardsHtml}
    <script>window.addEventListener('load', () => { window.print(); });</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  const downloadHTMLFlashcards = () => {
    const flashcardsHtml = shuffledFlashcards.map((card) => `
      <div class="flashcard-item" style="margin-bottom: 20px; padding: 15px; border: 1px solid #4b5563; border-radius: 8px; background: #1f2937; color: #f8f9fa;">
        <p style="font-weight: bold; margin-bottom: 5px;">Q: ${esc(card.question)}</p>
        <p>A: ${esc(card.answer)}</p>
      </div>
    `).join("");

    const pageTitle = (summaryTitle || "flashcards").replace(/[^a-z0-9_\- .]/gi, "").trim() || "flashcards";
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(pageTitle)} - Flashcards</title>
    <style>
        body { font-family: sans-serif; margin: 20px; background: #111827; color: #f8f9fa; }
        h1 { text-align: center; margin-bottom: 30px; color: #facc15; }
        .flashcard-item {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #4b5563;
            border-radius: 8px;
            background: #1f2937;
            color: #f8f9fa;
        }
        .flashcard-item p {
            margin: 0;
            line-height: 1.5;
        }
        .flashcard-item p:first-child {
            font-weight: bold;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>
    <h1>${esc(pageTitle)} - Flashcards</h1>
    <p style="text-align: center; margin-bottom: 20px; color: #adb5bd;">
        Estas son tus flashcards. Puedes imprimir esta página a PDF desde tu navegador.
    </p>
    <div style="max-width: 800px; margin: 0 auto;">
      ${flashcardsHtml}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pageTitle}_flashcards.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">📚 Flashcards</h2>
          {summaryTitle && (
            <h3 className="text-base sm:text-lg italic text-yellow-400">
              {summaryTitle}
            </h3>
          )}
        </div>
        <button
          onClick={onBack}
          className="border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm"
        >
          Volver
        </button>
      </div>

      <div className="flex flex-wrap gap-2 justify-start mb-6">
        <button onClick={handlePrintFlashcards} className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm">
          🖨 Imprimir todas
        </button>
        <button onClick={downloadHTMLFlashcards} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm">
          💾 Descargar HTML
        </button>
      </div>

      {/* Contenedor de la tarjeta principal (con perspectiva para 3D) */}
      <div className="perspective-1000 w-full mb-6">
        <div
          className={`relative w-full h-[280px] sm:h-[350px] md:h-[400px] 
                      bg-gray-800 rounded-lg shadow-lg cursor-pointer 
                      transform-style-3d transition-transform duration-500 
                      flex items-center justify-center p-4 sm:p-6`} 
          onClick={handleFlip}
          // Asegúrate de que no haya style={{ backfaceVisibility: 'hidden' }} aquí
          // Ya lo eliminamos, ¡pero doble comprobación!
        >
          {/* Parte frontal (pregunta) */}
          <div className="flashcard-face absolute inset-0 backface-hidden flex items-center justify-center text-center text-xl sm:text-2xl overflow-y-auto p-4 leading-relaxed z-10"> {/* <-- Añadido z-10 */}
            <p className="p-2 sm:p-4 leading-relaxed">{currentCard.question}</p>
          </div>

          {/* Parte trasera (respuesta) */}
          <div className="flashcard-face absolute inset-0 backface-hidden flex items-center justify-center text-center text-xl sm:text-2xl overflow-y-auto p-4 leading-relaxed rotate-y-180">
            <p className="p-2 sm:p-4 leading-relaxed">{currentCard.answer}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} / {shuffledFlashcards.length}
        </span>
        <button
          onClick={handleFlip}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm"
        >
          {isFlipped ? "Mostrar Pregunta" : "Mostrar Respuesta"}
        </button>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handlePrev}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
        >
          ⬅️ Anterior
        </button>
        <button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
        >
          Siguiente ➡️
        </button>
      </div>
    </div>
  );
};

export default FlashcardView;