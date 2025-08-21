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
    // Evitar mutación directa si el estado de las flashcards puede ser el mismo en el futuro
    // y quieres mezclar solo una vez al cargar el componente.
    // Si quieres mezclar cada vez que entras a la vista, esta lógica está bien.
    if (arr.length > 1) { // Solo mezcla si hay más de una tarjeta
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
            <h3 className="text-lg italic text-yellow-400">{summaryTitle}</h3>
          )}
        </div>
        <button
          onClick={onBack}
          className="border border-red-500 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg text-sm"
        >
          Volver
        </button>
      </div>

      <div className="perspective-1000">
        <div
          className={`relative w-full h-80 bg-gray-800 rounded-lg shadow-lg mb-6 cursor-pointer transform-style-3d transition-transform duration-500 ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          onClick={handleFlip}
        >
          {/* Parte frontal (pregunta) */}
          <div className="flashcard-face absolute inset-0 backface-hidden flex items-center justify-center p-6 text-center text-lg overflow-auto">
            <p className="leading-relaxed">{currentCard.question}</p> {/* Añadir leading-relaxed */}
          </div>

          {/* Parte trasera (respuesta) */}
          <div className="flashcard-face absolute inset-0 backface-hidden flex items-center justify-center p-6 text-center text-lg overflow-auto rotate-y-180">
            <p className="leading-relaxed">{currentCard.answer}</p> {/* Añadir leading-relaxed */}
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

      {/* Tailwind CSS para las transformaciones 3D */}
      {/* Las siguientes reglas CSS aseguran que la rotación inicial de la cara trasera
          sea 180deg y que la cara frontal no tenga esa rotación,
          y que la transición solo afecte al contenedor principal de la tarjeta.
          Esto debería estar ya cubierto por las clases de Tailwind y tu config.js.
          Si aún hay superposición, es posible que necesitemos una clase `transform-hidden` o similar
          que aplique `transform: rotateY(90deg)` para ocultar completamente la cara no visible durante la transición.
      */}
      <style jsx>{`
        /* Este estilo asegura que la cara trasera esté volteada inicialmente para no superponerse */
        .flashcard-face {
          transform: rotateY(var(--tw-rotate-y, 0)); /* fallback para asegurarse */
        }
        .flashcard-face.absolute:first-child {
          z-index: 2; /* Asegura que la cara frontal esté por encima cuando no está volteada */
        }
        .flashcard-face.absolute:last-child {
          transform: rotateY(180deg) var(--tw-rotate-y, 0); /* La cara trasera siempre empieza volteada */
        }
        /* Cuando el contenedor principal rota, estas caras giran con él */
        .rotate-y-180 .flashcard-face.absolute:first-child {
          transform: rotateY(-180deg); /* La frontal gira para irse */
        }
        .rotate-y-180 .flashcard-face.absolute:last-child {
          transform: rotateY(0deg); /* La trasera gira para mostrarse */
        }
        /* Asegura que los textos no se desborden de su caja */
        .overflow-auto {
            display: flex; /* Para centrar contenido */
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
        }
      `}</style>
    </div>
  );
};

export default FlashcardView;