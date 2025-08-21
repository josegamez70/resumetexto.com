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

  // --- MODIFICADO: Función para IMPRIMIR todas las flashcards ---
  const handlePrintFlashcards = () => {
    const pageTitle = summaryTitle || "Flashcards";
    // Construir solo el contenido imprimible (sin el body completo, para incrustar en un iframe temporal)
    const printableContent = shuffledFlashcards.map((card) => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; color: #333; page-break-inside: avoid;">
        <p style="font-weight: bold; margin-bottom: 5px; line-height: 1.5;">Q: ${esc(card.question)}</p>
        <p style="line-height: 1.5;">A: ${esc(card.answer)}</p>
      </div>
    `).join("");

    const printHtml = `
      <style>
          body { font-family: sans-serif; margin: 20px; color: #333; }
          h1 { text-align: center; margin-bottom: 30px; }
          @media print {
              body { margin: 0; }
          }
      </style>
      <h1>${esc(pageTitle)} - Flashcards para Imprimir</h1>
      <p style="text-align: center; margin-bottom: 20px;">
          Preguntas y respuestas de las flashcards.
      </p>
      ${printableContent}
    `;

    // Usar un iframe temporal para imprimir sin abrir una ventana nueva
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none'; // Ocultar el iframe
    document.body.appendChild(iframe);

    iframe.contentDocument?.open();
    iframe.contentDocument?.write(printHtml);
    iframe.contentDocument?.close();

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Error printing:", err);
        alert("Hubo un problema al imprimir. Puede que tu navegador bloquee la impresión desde iframes. Intenta la descarga HTML y luego imprímelo.");
      } finally {
        document.body.removeChild(iframe); // Eliminar el iframe después de imprimir
      }
    };
  };

  // --- HTML Descargado Interactivo (AJUSTADO: Eliminado botón "Volver a Inicio") ---
  const downloadHTMLFlashcards = () => {
    // Limpiar el título para la descarga
    let cleanSummaryTitle = summaryTitle || "Flashcards";
    try {
        cleanSummaryTitle = decodeURIComponent(cleanSummaryTitle);
    } catch (e) {
        console.error("Error decoding summaryTitle for filename, using as is.", e);
    }
    cleanSummaryTitle = cleanSummaryTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-_.]/g, '').trim();
    const safeTitle = cleanSummaryTitle || "Flashcards";

    const allFlashcardsData = shuffledFlashcards.map(card => ({
      q: esc(card.question),
      a: esc(card.answer)
    }));

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(safeTitle)} - Flashcards</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #1a1a2e; /* Fondo oscuro similar al de tu app */
            color: #e0e0e0; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            min-height: 100vh; 
        }
        h1 { 
            color: #facc15; /* Amarillo brillante para el título */
            text-align: center; 
            margin-bottom: 20px; 
        }
        .flashcard-wrapper {
            perspective: 1000px;
            width: 95%; /* Más ancho */
            max-width: 800px; /* Ancho máximo AUMENTADO para el HTML descargado */
            margin: 20px auto;
            position: relative;
            /* Altura flexible, se adapta al contenido */
            display: flex; /* Para centrar la tarjeta */
            align-items: center;
            justify-content: center;
        }
        .flashcard-inner {
            position: relative;
            width: 100%;
            height: auto; /* IMPORTANTE: Altura automática para adaptarse al contenido */
            min-height: 250px; /* Altura mínima para que no sea diminuta con textos cortos */
            text-align: center;
            transition: transform 0.6s ease-in-out;
            transform-style: preserve-3d;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: stretch; /* Estirar hijos para ocupar toda la altura */
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            background: #2b2e41; /* Fondo de la tarjeta, por si las caras no cubren todo */
        }
        .flashcard-inner.is-flipped {
            transform: rotateY(180deg);
        }
        .flashcard-face {
            position: absolute;
            width: 100%;
            height: 100%; /* Ocupa el 100% de la altura del inner */
            backface-visibility: hidden;
            display: flex;
            flex-direction: column; /* Centrado vertical en columna */
            align-items: center;
            justify-content: center;
            padding: 15px;
            box-sizing: border-box;
            word-wrap: break-word;
            text-align: center;
            font-size: 1.3rem;
            line-height: 1.8;
            /* overflow-y: auto; REMOVIDO DE LAS CARAS */
        }
        .flashcard-front {
            background: #FFC0CB; /* Fondo rosado para la pregunta */
            color: #333; /* Texto oscuro para contrastar con el fondo claro */
            transform: rotateY(0deg);
            z-index: 2; /* Para que siempre esté encima cuando visible */
        }
        .flashcard-back {
            background: #90EE90; /* Fondo verde claro para la respuesta */
            color: #333; /* Texto oscuro para contrastar con el fondo claro */
            transform: rotateY(180deg);
            z-index: 1; /* Para que esté detrás inicialmente */
        }
        .flashcard-face p {
            margin: 0;
            padding: 10px;
            width: 100%; /* Asegurar que el párrafo ocupe el ancho */
        }
        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 95%;
            max-width: 700px;
            margin-top: 20px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .counter {
            color: #adb5bd;
            font-size: 0.9rem;
            flex-basis: 100%;
            text-align: center;
            margin-bottom: 10px;
        }
        @media (min-width: 600px) {
            .controls {
                justify-content: space-between;
            }
            .counter {
                flex-basis: auto;
                margin-bottom: 0;
            }
        }
        button {
            padding: 10px 18px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
            color: #fff;
            transition: background-color 0.3s ease;
            margin: 5px;
            min-width: 120px;
        }
        .btn-flip { background: #8b5cf6; }
        .btn-flip:hover { background: #7c3aed; }
        .btn-nav { background: #3b82f6; }
        .btn-nav:hover { background: #2563eb; }
        .btn-secondary { background: #ef4444; }
        .btn-secondary:hover { background: #dc2626; }
        .hidden-card {
            visibility: hidden;
            opacity: 0;
            transition: visibility 0s 0.6s, opacity 0.6s linear;
        }
        .visible-card {
            visibility: visible;
            opacity: 1;
            transition: opacity 0.6s linear;
        }
    </style>
</head>
<body>
    <h1>${esc(safeTitle)} - Flashcards</h1>
    <div class="flashcard-wrapper" id="flashcard-wrapper">
        <div class="flashcard-inner" id="flashcard-inner">
            <div class="flashcard-face flashcard-front" id="flashcard-question">
                <p></p>
            </div>
            <div class="flashcard-face flashcard-back" id="flashcard-answer">
                <p></p>
            </div>
        </div>
    </div>
    <div class="controls">
        <button class="btn-nav" id="prev-btn">⬅️ Anterior</button>
        <span class="counter" id="card-counter"></span>
        <button class="btn-nav" id="next-btn">Siguiente ➡️</button>
    </div>
    <button class="btn-flip" id="flip-btn">Mostrar Respuesta</button>
    <!-- ELIMINADO: BOTÓN "Volver a Inicio" -->

    <script>
        const flashcards = ${JSON.stringify(allFlashcardsData)};
        let currentCardIndex = 0;
        let isFlipped = false;

        const flashcardInner = document.getElementById('flashcard-inner');
        const flashcardQuestion = document.querySelector('#flashcard-question p');
        const flashcardAnswer = document.querySelector('#flashcard-answer p');
        const cardCounter = document.getElementById('card-counter');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const flipBtn = document.getElementById('flip-btn');
        // const backBtn = document.getElementById('back-btn'); REMOVIDO backBtn
        const flashcardWrapper = document.getElementById('flashcard-wrapper');

        function updateFlashcardDisplay() {
            if (flashcards.length === 0) {
                flashcardWrapper.classList.remove('visible-card');
                flashcardWrapper.classList.add('hidden-card');
                flashcardInner.innerHTML = '<p style="font-size:1.5rem; color:#adb5bd;">No hay flashcards para mostrar.</p>';
                return;
            } else {
                flashcardWrapper.classList.remove('hidden-card');
                flashcardWrapper.classList.add('visible-card');
            }

            const card = flashcards[currentCardIndex];
            flashcardQuestion.innerHTML = card.q;
            flashcardAnswer.innerHTML = card.a;
            cardCounter.textContent = \`\${currentCardIndex + 1} / \${flashcards.length}\`;

            if (isFlipped) {
                flashcardInner.classList.add('is-flipped');
                flipBtn.textContent = 'Mostrar Pregunta';
            } else {
                flashcardInner.classList.remove('is-flipped');
                flipBtn.textContent = 'Mostrar Respuesta';
            }
        }

        flashcardInner.addEventListener('click', () => {
            isFlipped = !isFlipped;
            updateFlashcardDisplay();
        });

        flipBtn.addEventListener('click', () => {
            isFlipped = !isFlipped;
            updateFlashcardDisplay();
        });

        prevBtn.addEventListener('click', () => {
            isFlipped = false;
            currentCardIndex = (currentCardIndex === 0) ? flashcards.length - 1 : currentCardIndex - 1;
            updateFlashcardDisplay();
        });

        nextBtn.addEventListener('click', () => {
            isFlipped = false;
            currentCardIndex = (currentCardIndex === flashcards.length - 1) ? 0 : currentCardIndex + 1;
            updateFlashcardDisplay();
        });

        // backBtn.addEventListener('click', ... REMOVIDO LISTENER DE backBtn

        document.addEventListener('DOMContentLoaded', updateFlashcardDisplay);
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle}_flashcards.html`;
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
      <div className="flashcard-container w-full mb-6">
        <div
          className={`flashcard-inner relative w-full h-[280px] sm:h-[350px] md:h-[400px] 
                      rounded-lg shadow-lg cursor-pointer 
                      flex items-center justify-center p-4 sm:p-6 ${isFlipped ? 'is-flipped' : ''}`}
          onClick={handleFlip}
        >
          {/* Parte frontal (pregunta) */}
          <div className="flashcard-face flashcard-front absolute inset-0 backface-hidden flex items-center justify-center text-center text-xl sm:text-2xl overflow-y-auto p-4">
            {/* Pregunta con fondo rosado, texto oscuro */}
            <p className="p-2 sm:p-4 text-center text-gray-900 font-semibold leading-[1.8]">{currentCard.question}</p>
          </div>

          {/* Parte trasera (respuesta) */}
          <div className="flashcard-face flashcard-back absolute inset-0 backface-hidden flex items-center justify-center text-center text-xl sm:text-2xl overflow-y-auto p-4">
            {/* Respuesta con fondo verde claro, texto oscuro */}
            <p className="p-2 sm:p-4 text-center text-gray-900 font-semibold leading-[1.8]">{currentCard.answer}</p>
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

      {/* ESTILOS CSS INLINE para controlar el volteo 3D de forma estricta */}
      <style>
        {`
        /* Este estilo asegura que el contexto 3D esté bien definido */
        .flashcard-container {
          perspective: 1000px;
          position: relative;
        }

        .flashcard-inner {
          transform-style: preserve-3d;
          transition: transform 0.5s ease-in-out;
          will-change: transform;
          position: relative;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
          /* Quitado el background de aquí, se define en las caras */
        }

        .flashcard-inner.is-flipped {
          transform: rotateY(180deg);
        }

        .flashcard-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit; /* Hereda el border-radius del flashcard-inner */
          padding: 20px;
          box-sizing: border-box;
          text-align: center;
          transform: translateZ(0); /* Forzar aceleración de hardware */
        }

        .flashcard-front {
          background: #FFC0CB; /* Fondo rosado */
          color: #333; /* Texto oscuro para contrastar */
          transform: rotateY(0deg);
        }

        .flashcard-back {
          background: #90EE90; /* Fondo verde claro */
          color: #333; /* Texto oscuro para contrastar */
          transform: rotateY(180deg);
        }
        
        /* Ajustes de tipografía para el contenido de la flashcard */
        .flashcard-face p {
          margin: 0;
          line-height: 1.8; /* Asegura un buen espaciado */
          white-space: pre-wrap;
          word-break: break-word;
          hyphens: auto;
          font-size: inherit; /* Hereda de text-xl sm:text-2xl */
          text-align: center;
          font-weight: inherit;
          /* Color de texto se hereda de la cara (.flashcard-front o .flashcard-back) */
        }
        `}
      </style>
    </div>
  );
};

export default FlashcardView;