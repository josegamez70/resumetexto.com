// App.tsx

import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import SummaryView from "./components/SummaryView";
import PresentationView from "./components/PresentationView";
import MindMapView from "./components/MindMapView";
import FlashcardView from "./components/FlashcardView"; // <-- NUEVO COMPONENTE

import {
  summarizeContent,
  createPresentation,
  createMindMapFromText,
  flattenPresentationToText,
  generateFlashcards, // <-- NUEVA FUNCIÓN
} from "./services/geminiService";

import {
  ViewState, // <-- Usa tus ViewState numéricos
  SummaryType,
  PresentationData,
  PresentationType,
  MindMapData,
  MindMapColorMode,
  Flashcard, // <-- NUEVO TIPO
} from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOADER); // Inicia con UPLOADER (0)

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(PresentationType.Extensive);
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [mindMapColorMode, setMindMapColorMode] = useState<MindMapColorMode>(MindMapColorMode.Color);
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null); // <-- NUEVO ESTADO

  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleResetAll = () => {
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
    setFlashcards(null); // <-- Resetear flashcards
    setError(null);
    setLoadingMessage(null);
    setView(ViewState.UPLOADER);
  };

  const handleBackToSummary = () => {
    setView(ViewState.SUMMARY);
  };

  const handleFileUpload = async (file: File, summaryType: SummaryType) => {
    setError(null);
    setIsProcessing(true);
    setLoadingMessage("⏳ Generando resumen, puede tardar unos minutos...");
    try {
      const generatedSummary = await summarizeContent(file, summaryType);
      setSummary(generatedSummary);
      setSummaryTitle(generatedSummary.split(" ").slice(0, 6).join(" "));
      setView(ViewState.SUMMARY);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error desconocido al generar el resumen.");
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (!summary) return;
    setIsProcessing(true);
    setLoadingMessage("⏳ Generando mapa conceptual, puede tardar unos minutos...");
    try {
      const generatedPresentation = await createPresentation(summary, presentationType);
      setPresentation(generatedPresentation);
      setView(ViewState.PRESENTATION);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error desconocido al generar el mapa conceptual.");
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleOpenMindMap = async (colorMode: MindMapColorMode) => {
    setMindMapColorMode(colorMode);
    setIsProcessing(true);
    setLoadingMessage("🧠 Generando mapa mental (extendido)...");
    try {
      const baseText =
        (presentation && flattenPresentationToText(presentation)) ||
        summary ||
        "";
      if (!baseText) throw new Error("No hay contenido para generar el mapa mental.");
      const data = await createMindMapFromText(baseText /* extendido por defecto */);
      setMindmap(data);
      setView(ViewState.MINDMAP);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al generar el mapa mental.");
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  // NUEVA FUNCIÓN: Generar Flashcards
  const handleGenerateFlashcards = async () => {
    if (!summary) return;
    setIsProcessing(true);
    setLoadingMessage("📇 Generando flashcards, un momento por favor...");
    try {
      const generatedFlashcards = await generateFlashcards(summary);
      setFlashcards(generatedFlashcards);
      setView(ViewState.FLASHCARDS); // <-- Cambiar vista a flashcards
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al generar las flashcards.");
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 overflow-x-hidden">
      {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}

      {loadingMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-yellow-500 text-black p-4 rounded-lg text-center font-semibold animate-pulse max-w-xs">
            {loadingMessage}
          </div>
        </div>
      )}

      {view === ViewState.UPLOADER && (
        <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
      )}

      {view === ViewState.SUMMARY && summary && (
        <SummaryView
          summary={summary}
          summaryTitle={summaryTitle || ""}
          presentationType={presentationType}
          setPresentationType={setPresentationType}
          onGeneratePresentation={handleGeneratePresentation}
          onOpenMindMap={handleOpenMindMap}
          onGenerateFlashcards={handleGenerateFlashcards} // <-- Pasar la nueva función
          onReset={handleResetAll}
        />
      )}

      {view === ViewState.PRESENTATION && presentation && (
        <PresentationView
          presentation={presentation}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ""}
          onBackToSummary={handleBackToSummary}
        />
      )}

      {view === ViewState.MINDMAP && mindmap && (
        <MindMapView
          data={mindmap}
          summaryTitle={summaryTitle}
          colorMode={mindMapColorMode}
          onBack={() => setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)}
        />
      )}

      {/* NUEVA VISTA: Flashcards */}
      {view === ViewState.FLASHCARDS && flashcards && (
        <FlashcardView
          flashcards={flashcards}
          summaryTitle={summaryTitle}
          onBack={handleBackToSummary} // Volver al resumen
        />
      )}
    </div>
  );
};

export default App;