// components/FlashcardView.tsx
import React, { useState } from "react";
import { Flashcard } from "../types";

interface FlashcardViewProps {
  flashcards: Flashcard[];
  summaryTitle: string | null;
  onBack: () => void; // Para volver a la vista anterior (resumen)
}

const FlashcardView: React.FC<FlashcardViewProps> = ({
  flashcards,
  summaryTitle,
  onBack,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Mezclar las tarjetas al iniciar (opcional)
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

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">📚 Flashcards</h2>
          {summaryTitle && (
            // Aumentar tamaño de fuente en móvil para el título del resumen si es muy corto
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

      {/* Contenedor de la tarjeta */}
      <div className="perspective-1000 w-full mb-6"> {/* Eliminar h-80 para altura flexible */}
        <div
          className={`relative w-full min-h-[200px] sm:min-h-[280px] md:min-h-[300px] flex items-center justify-center 
                      bg-gray-800 rounded-lg shadow-lg cursor-pointer 
                      transform-style-3d transition-transform duration-500 p-4 sm:p-6 ${ // Añadir padding
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={handleFlip}
          style={{ backfaceVisibility: 'hidden' }} // Asegurarse de que el contenedor principal también lo tenga si es necesario
        >
          {/* Parte frontal (pregunta) */}
          <div className="absolute inset-0 backface-hidden flex items-center justify-center text-center text-base sm:text-lg overflow-y-auto px-4 py-2 leading-relaxed">
            <p className="p-2 sm:p-4 leading-relaxed">{currentCard.question}</p> {/* Más padding y espaciado de línea */}
          </div>

          {/* Parte trasera (respuesta) */}
          <div className="absolute inset-0 backface-hidden flex items-center justify-center text-center text-base sm:text-lg overflow-y-auto px-4 py-2 leading-relaxed rotate-y-180">
            <p className="p-2 sm:p-4 leading-relaxed">{currentCard.answer}</p> {/* Más padding y espaciado de línea */}
          </div>
        </div>
      </div>

      {/* Navegación y botones */}
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

      {/* NOTA: Ya no necesitamos la etiqueta <style jsx> si todas las clases son de Tailwind o CSS global */}
      {/* Si aún necesitas estilos CSS no-Tailwind aquí, considera moverlos a index.css */}
    </div>
  );
};

export default FlashcardView;