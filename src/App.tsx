import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import SummaryView from "./components/SummaryView";
import PresentationView from "./components/PresentationView";
import MindMapView from "./components/MindMapView";

import {
  summarizeContent,
  createPresentation,
  createMindMapFromText,
  flattenPresentationToText,
} from "./services/geminiService";

import {
  ViewState,
  SummaryType,
  PresentationData,
  PresentationType,
  MindMapData,
  MindMapColorMode,
} from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOADER);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(PresentationType.Extensive);
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [mindMapColorMode, setMindMapColorMode] = useState<MindMapColorMode>(MindMapColorMode.Color);

  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleResetAll = () => {
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
    setError(null);
    setLoadingMessage(null);
    setView(ViewState.UPLOADER);
  };

  const handleBackToSummary = () => {
    setView(ViewState.SUMMARY); // ← vuelve al resumen (no se borra nada)
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
          onOpenMindMap={handleOpenMindMap} // ← ahora recibe colorMode
          onReset={handleResetAll}
        />
      )}

      {view === ViewState.PRESENTATION && presentation && (
        <PresentationView
          presentation={presentation}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ""}
          onBackToSummary={handleBackToSummary} // ← vuelve a resumen
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
    </div>
  );
};

export default App;
