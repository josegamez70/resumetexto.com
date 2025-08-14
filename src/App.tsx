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
  MindMapMode,
} from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOADER);

  // Datos
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(PresentationType.Extensive);
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);

  // UI
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleReset = () => {
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
    setView(ViewState.UPLOADER);
    setError(null);
    setLoadingMessage(null);
  };

  // 1) Subida + resumen
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

  // 2) Generar "Mapa conceptual"
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

  // 3) Generar "Mapa mental" (resumido o extendido)
  const handleOpenMindMap = async (mode: MindMapMode) => {
    setIsProcessing(true);
    setLoadingMessage(mode === MindMapMode.Resumido
      ? "🧠 Generando mapa mental (resumido)..."
      : "🧠 Generando mapa mental (extendido)...");
    try {
      const baseText =
        (presentation && flattenPresentationToText(presentation)) ||
        summary ||
        "";
      if (!baseText) {
        throw new Error("No hay contenido para generar el mapa mental.");
      }
      const data = await createMindMapFromText(baseText, mode);
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
    <div className="min-h-screen bg-brand-bg text-white p-6 relative">
      {/* Error */}
      {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}

      {/* Overlay de carga */}
      {loadingMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
          onReset={handleReset}
        />
      )}

      {view === ViewState.PRESENTATION && presentation && (
        <PresentationView
          presentation={presentation}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ""}
          onMindMap={() => handleOpenMindMap(MindMapMode.Resumido)} // acceso rápido desde aquí
          onReset={handleReset}
        />
      )}

      {view === ViewState.MINDMAP && mindmap && (
        <MindMapView
          data={mindmap}
          summaryTitle={summaryTitle}
          onBack={() => setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)}
        />
      )}
    </div>
  );
};

export default App;
