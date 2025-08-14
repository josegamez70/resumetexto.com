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
} from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOADER);

  // Archivo original subido
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Resumen
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);

  // Presentación
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(
    PresentationType.Extensive
  );

  // Mapa mental
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);

  // UI
  const [isProcessing, setIsProcessing] = useState(false);

  const handleReset = () => {
    setView(ViewState.UPLOADER);
    setOriginalFile(null);
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
  };

  // 1) Subida y resumen
  const handleFileUpload = async (file: File, summaryType: SummaryType) => {
    try {
      setIsProcessing(true);
      setOriginalFile(file);
      const { summary, title } = await summarizeContent(file, summaryType);
      setSummary(summary);
      setSummaryTitle(title);
      setView(ViewState.SUMMARY);
    } catch (err: any) {
      alert(err?.message || "Error al resumir.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2) Generar presentación (llamado desde SummaryView)
  const handleGeneratePresentation = async () => {
    try {
      if (!originalFile) {
        alert("No hay archivo original para generar la presentación.");
        return;
      }
      setIsProcessing(true);
      const p = await createPresentation(originalFile, presentationType);
      setPresentation(p);
      setView(ViewState.PRESENTATION);
    } catch (err: any) {
      alert(err?.message || "Error al generar presentación.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3) Abrir mapa mental (desde presentación; si no hay, usa el resumen)
  const handleOpenMindMap = async () => {
    try {
      setIsProcessing(true);
      const baseText =
        (presentation && flattenPresentationToText(presentation)) ||
        summary ||
        "";

      if (!baseText) {
        alert("No hay contenido para generar el mapa mental.");
        return;
      }

      const data = await createMindMapFromText(baseText);
      setMindmap(data);
      setView(ViewState.MINDMAP);
    } catch (err: any) {
      alert(err?.message || "Error al generar mapa mental.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">resumetexto.com</h1>

      {view === ViewState.UPLOADER && (
        <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
      )}

      {view === ViewState.SUMMARY && summary && (
        <SummaryView
          summary={summary}
          summaryTitle={summaryTitle || ""}
          presentationType={presentationType}
          setPresentationType={setPresentationType}
          onGeneratePresentation={handleGeneratePresentation}  // ✅ nombre correcto
          onReset={handleReset}
        />
      )}

      {view === ViewState.PRESENTATION && presentation && (
        <PresentationView
          presentation={presentation}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ""}
          onMindMap={handleOpenMindMap}           // ✅ botón mapa mental
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
