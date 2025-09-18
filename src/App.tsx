import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import {
  summarizeContent,
  summarizeContents,
  createPresentation,
  createMindMapFromText,
  flattenPresentationToText,
  generateFlashcards,
} from "./services/geminiService";
import {
  ViewState,
  SummaryType,
  PresentationData,
  PresentationType,
  MindMapData,
  MindMapColorMode,
  Flashcard,
} from "./types";

// Si ya existen estos componentes en tu proyecto, se usarán.
// Si no, puedes comentar sus usos o reemplazarlos.
import SummaryView from "./components/SummaryView";
import PresentationView from "./components/PresentationView";
import MindMapView from "./components/MindMapView";
import MindMapDiagramView from "./components/MindMapDiagramView";
import FlashcardView from "./components/FlashcardView";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOADER);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);

  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(
    PresentationType.Extensive
  );

  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [mindMapColorMode, setMindMapColorMode] = useState<MindMapColorMode>(
    MindMapColorMode.Color
  );

  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAll() {
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
    setFlashcards(null);
    setError(null);
    setView(ViewState.UPLOADER);
  }

  async function handleUpload(files: File[], type: SummaryType) {
    try {
      setIsProcessing(true);
      setError(null);

      const text =
        files.length === 1
          ? await summarizeContent(files[0], type)
          : await summarizeContents(files, type);

      setSummary(text);
      setSummaryTitle(text.split(/\s+/).slice(0, 6).join(" "));
      setView(ViewState.SUMMARY);
    } catch (e: any) {
      setError(e?.message || "Error al generar el resumen.");
    } finally {
      setIsProcessing(false);
    }
  }

  const handleGeneratePresentation = async () => {
    if (!summary) return;
    setIsProcessing(true);
    try {
      const generated = await createPresentation(summary, presentationType);
      setPresentation(generated);
      setView(ViewState.PRESENTATION);
    } catch (e: any) {
      setError(e?.message || "No se pudo generar la presentación.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenMindMap = async (mode: MindMapColorMode) => {
    if (!summary && !presentation) return;
    setIsProcessing(true);
    try {
      const base = presentation ? flattenPresentationToText(presentation) : (summary || "");
      const mm = await createMindMapFromText(base);
      setMindMapColorMode(mode);
      setMindmap(mm);
      setView(ViewState.MINDMAP);
    } catch (e: any) {
      setError(e?.message || "Error al generar el mapa mental.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!summary) return;
    setIsProcessing(true);
    try {
      const cards = await generateFlashcards(summary);
      setFlashcards(cards);
      setView(ViewState.FLASHCARDS);
    } catch (e: any) {
      setError(e?.message || "Error al generar las flashcards.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToSummary = () => setView(ViewState.SUMMARY);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-5xl mx-auto">
        {error && (
          <div className="mb-3 px-4 py-2 rounded border border-red-500 bg-red-500/10 text-red-200">
            {error}
          </div>
        )}

        {view === ViewState.UPLOADER && (
          <FileUploader onUpload={handleUpload} isProcessing={isProcessing} />
        )}

        {view === ViewState.SUMMARY && summary && (
          <SummaryView
            summary={summary}
            summaryTitle={summaryTitle || ""}
            presentationType={presentationType}
            setPresentationType={setPresentationType}
            onGeneratePresentation={handleGeneratePresentation}
            onOpenMindMap={handleOpenMindMap}
            onGenerateFlashcards={handleGenerateFlashcards}
            onReset={resetAll}
          />
        )}

        {view === ViewState.PRESENTATION && presentation && (
          <PresentationView
            presentation={presentation}
            presentationType={presentationType}
            summaryTitle={summaryTitle || ""}
            onBackToSummary={handleBackToSummary}
            onHome={resetAll}
          />
        )}

        {view === ViewState.MINDMAP && mindmap && (
          <>
            {mindMapColorMode === MindMapColorMode.BlancoNegro ? (
              <MindMapDiagramView
                data={mindmap}
                summaryTitle={summaryTitle}
                onBack={() =>
                  setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)
                }
                onHome={resetAll}
              />
            ) : (
              <MindMapView
                data={mindmap}
                summaryTitle={summaryTitle}
                colorMode={mindMapColorMode}
                onBack={() =>
                  setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)
                }
                onHome={resetAll}
              />
            )}
          </>
        )}

        {view === ViewState.FLASHCARDS && flashcards && (
          <FlashcardView
            flashcards={flashcards}
            summaryTitle={summaryTitle}
            onBack={handleBackToSummary}
          />
        )}
      </div>

      {/* Overlay de procesamiento */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center">
          <div className="text-yellow-300">Procesando…</div>
        </div>
      )}
    </div>
  );
};

export default App;
