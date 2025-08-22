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
  // Número de la tarjeta actual (basado en 1)
  const cardNumber = currentIndex + 1;

  const handleNext = () => {
    setIsFlipped(false); // <-- Asegura que la siguiente tarjeta se muestra por la pregunta
    setCurrentIndex((prevIndex) => (prevIndex + 1) % shuffledFlashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false); // <-- Asegura que la tarjeta anterior se muestra por la pregunta
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
    const pageTitle = summaryTitle || "Flashcards";
    const printableItems = shuffledFlashcards.map((card, index) => `
      <div class="flashcard-print-item" style="margin-bottom: 25px; padding: 15px; border: 1px solid #e0e0e0; border-radius: 8px; background: #ffffff; color: #333; page-break-inside: avoid; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <p style="font-weight: bold; margin-bottom: 8px; line-height: 1.6; font-size: 1.1rem;">${index + 1}. Pregunta: ${esc(card.question)}</p>
        <p style="margin-bottom: 0; line-height: 1.6; font-size: 1.0rem;">Respuesta: ${esc(card.answer)}</p>
      </div>
    `).join("");

    const printHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(pageTitle)} - Flashcards para Imprimir</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #333; background: #f0f2f5; }
        h1 { text-align: center; margin-bottom: 30px; color: #212529; }
        p { text-align: center; font-style: italic; color: #6c757d; margin-bottom: 20px; }
        .flashcards-container { max-width: 800px; margin: 0 auto; padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
        @media print {
            body { margin: 0; padding: 0; background: #fff; }
            h1, p { color: #000; }
            .flashcards-container { box-shadow: none; border-radius: 0; padding: 0; }
            .flashcard-print-item { border-color: #ccc !important; }
        }
    </style>
</head>
<body>
    <h1>${esc(pageTitle)} - Lista de Flashcards</h1>
    <p>Una herramienta de estudio rápido para repasar conceptos clave.</p>
    <div class="flashcards-container">
        ${printableItems}
    </div>
    <script>window.addEventListener('load', () => { window.print(); });</script>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
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
        alert("Hubo un problema al imprimir. Puede que tu navegador bloquee la impresión desde iframes. Intenta la descarga HTML interactiva y luego imprímelo desde allí si es posible.");
      } finally {
        setTimeout(() => document.body.removeChild(iframe), 1000); 
      }
    };
  };

  // --- HTML Descargado Interactivo (AJUSTADO) ---
  const downloadHTMLFlashcards = () => {
    let cleanSummaryTitle = summaryTitle || "Flashcards";
    try {
        cleanSummaryTitle = decodeURIComponent(cleanSummaryTitle);
    } catch (e) {
        console.error("Error decoding summaryTitle for filename, using as is.", e);
    }
    cleanSummaryTitle = cleanSummaryTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-_.]/g, '').trim();
    const safeTitle = cleanSummaryTitle || "Flashcards";

    const allFlashcardsData = shuffledFlashcards.map((card, index) => ({ // <-- Añadimos index aquí
      q: `Pregunta ${index + 1}: ${esc(card.question)}`, // <-- Añadir "Pregunta N:"
      a: `Respuesta ${index + 1}: ${esc(card.answer)}`   // <-- Añadir "Respuesta N:"
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
            background: #1a1a2e;
            color: #e0e0e0; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            min-height: 100vh; 
        }
        h1 { 
            color: #facc15; 
            text-align: center; 
            margin-bottom: 20px; 
            width: 100%; 
        }
        .flashcard-wrapper {
            perspective: 1000px;
            width: 75%; /* ANCHO REDUCIDO AL 75% */
            max-width: 600px; /* Nuevo max-width efectivo para la tarjeta */
            margin: 20px auto;
            position: relative;
            display: flex; 
            align-items: center; 
            justify-content: center;
        }
        .flashcard-inner {
            position: relative;
            width: 100%;
            height: auto; 
            min-height: 250px; 
            text-align: center;
            transition: transform 0.6s ease-in-out;
            transform-style: preserve-3d;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: stretch; 
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
            background: #2b2e41; /* Fondo de la tarjeta por defecto, antes de que las caras lo cubran */
            /* max-width: 640px; Ya no es necesario aquí si se controla desde wrapper */
            /* margin-left: auto; margin-right: auto; Ya no es necesario aquí si se controla desde wrapper */
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
            flex-direction: column; 
            align-items: center;
            justify-content: center;
            padding: 15px;
            box-sizing: border-box;
            word-wrap: break-word;
            text-align: center;
            font-size: 1.3rem;
            line-height: 1.8;
            transform: translateZ(0); 
        }
        .flashcard-front {
            background: #FFC0CB; /* Fondo rosado para la pregunta */
            color: #333; /* Texto oscuro para contrastar con el fondo claro */
            transform: rotateY(0deg);
            z-index: 2; 
        }
        .flashcard-back {
            background: #90EE90; /* Fondo verde claro para la respuesta */
            color: #333; /* Texto oscuro para contrastar con el fondo claro */
            transform: rotateY(180deg);
            z-index: 1; 
        }
        .flashcard-face p {
            margin: 0;
            padding: 10px;
            width: 100%; 
            height: 100%; 
            display: flex; 
            align-items: center;
            justify-content: center;
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
            .controls { justify-content: space-between; }
            .counter { flex-basis: auto; margin-bottom: 0; }
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
        .btn-print-html { background: #008080; }
        .btn-print-html:hover { background: #006666; }
        .hidden-card { visibility: hidden; opacity: 0; transition: visibility 0s 0.6s, opacity 0.6s linear; }
        .visible-card { visibility: visible; opacity: 1; transition: opacity 0.6s linear; }
        /* Estilos para el div oculto con la lista de impresión */
        #printable-list-container {
            display: none; 
            max-width: 800px;
            margin: 30px auto;
            background: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            color: #333;
        }
        #printable-list-container h2 {
            text-align: center;
            color: #212529;
            margin-bottom: 20px;
        }
        .printable-item {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 5px;
            background: #fdfdfd;
        }
        .printable-item p {
            margin: 0;
            line-height: 1.4;
            font-size: 0.9rem;
            text-align: left;
            color: #333;
        }
        .printable-item p:first-child { font-weight: bold; margin-bottom: 5px; }

        @media print {
            body { background: #fff; color: #000; padding: 0; margin: 0; }
            #flashcard-wrapper, .controls, #flip-btn, .btn-print-html { display: none !important; }
            #printable-list-container { display: block !important; box-shadow: none; padding: 0; margin: 0 auto; }
            .printable-item { border-color: #ccc !important; background: #fff !important; }
            .printable-item p { color: #000 !important; }
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
    <button class="btn-print-html" id="print-all-btn" style="margin-top: 20px;">🖨 Imprimir todas (lista)</button>

    <!-- Contenedor oculto para la lista imprimible -->
    <div id="printable-list-container">
        <h2>${esc(safeTitle)} - Lista de Flashcards</h2>
        <p>Una herramienta de estudio rápido para repasar conceptos clave.</p>
        <div class="flashcards-content">
            ${printableItemsHtml}
        </div>
    </div>

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
        const flashcardWrapper = document.getElementById('flashcard-wrapper');
        const printAllBtn = document.getElementById('print-all-btn');
        const printableListContainer = document.getElementById('printable-list-container');


        function updateFlashcardDisplay() {
            if (flashcards.length === 0) {
                flashcardWrapper.style.display = 'none';
                document.querySelector('.controls').style.display = 'none';
                flipBtn.style.display = 'none';
                printAllBtn.style.display = 'none';

                const message = document.createElement('p');
                message.textContent = 'No hay flashcards para mostrar.';
                message.style.cssText = 'font-size:1.5rem; color:#adb5bd; text-align:center;';
                document.body.insertBefore(message, document.querySelector('h1').nextSibling); 
                return;
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
            isFlipped = false; // <-- IMPORTANTE: Reiniciar volteo
            currentCardIndex = (currentCardIndex === 0) ? flashcards.length - 1 : currentCardIndex - 1;
            updateFlashcardDisplay();
        });

        nextBtn.addEventListener('click', () => {
            isFlipped = false; // <-- IMPORTANTE: Reiniciar volteo
            currentCardIndex = (currentCardIndex === flashcards.length - 1) ? 0 : currentCardIndex + 1;
            updateFlashcardDisplay();
        });
        
        printAllBtn.addEventListener('click', () => {
            flashcardWrapper.style.display = 'none';
            document.querySelector('.controls').style.display = 'none';
            flipBtn.style.display = 'none';
            printAllBtn.style.display = 'none'; 

            printableListContainer.style.display = 'block';

            window.print();

            setTimeout(() => { 
                printableListContainer.style.display = 'none';
                flashcardWrapper.style.display = 'flex';
                document.querySelector('.controls').style.display = 'flex';
                flipBtn.style.display = 'block';
                printAllBtn.style.display = 'block';
                updateFlashcardDisplay(); 
            }, 500); 
        });

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
            <p className="p-2 sm:p-4 text-center text-gray-900 font-semibold leading-[1.8]">
              Pregunta ${cardNumber}: {currentCard.question} {/* <-- AÑADIDO NÚMERO */}
            </p>
          </div>

          {/* Parte trasera (respuesta) */}
          <div className="flashcard-face flashcard-back absolute inset-0 backface-hidden flex items-center justify-center text-center text-xl sm:text-2xl overflow-y-auto p-4">
            {/* Respuesta con fondo verde claro, texto oscuro */}
            <p className="p-2 sm:p-4 text-center text-gray-900 font-semibold leading-[1.8]">
              Respuesta ${cardNumber}: {currentCard.answer} {/* <-- AÑADIDO NÚMERO */}
            </p>
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