import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import SummaryView from "./components/SummaryView";
import PresentationView from "./components/PresentationView";
import { summarizeContent, createPresentation } from "./services/geminiService";
import {
  ViewState,
  SummaryType,
  PresentationData,
  PresentationType,
} from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOADER);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(PresentationType.Extensive);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileUpload = async (file: File, summaryType: SummaryType) => {
    setError(null);
    setIsProcessing(true);
    setLoadingMessage("⏳ Generando resumen, puede tardar unos minutos...");
    try {
      const generatedSummary = await summarizeContent(file, summaryType);
      setSummary(generatedSummary);
      setView(ViewState.SUMMARY);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al generar el resumen."
      );
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (!summary) return;
    setIsProcessing(true);
    setLoadingMessage("⏳ Generando presentación, puede tardar unos minutos...");
    try {
      const generatedPresentation = await createPresentation(summary, presentationType);
      setPresentation(generatedPresentation);
      setView(ViewState.PRESENTATION);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al generar la presentación."
      );
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSummary(null);
    setPresentation(null);
    setView(ViewState.UPLOADER);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white p-6 relative">
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>
      )}

      {/* Mensaje de carga centrado */}
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
          summaryTitle={summaryTitle || ''}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ''}
          setPresentationType={setPresentationType}
          onGeneratePresentation={handleGeneratePresentation}
          onReset={handleReset}
        />
      )}

      {view === ViewState.PRESENTATION && presentation && (
        <PresentationView
          presentation={presentation}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ''}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default App;
