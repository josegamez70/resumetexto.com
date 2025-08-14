// src/App.tsx
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

  // Resumen
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);

  // Presentación
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(PresentationType.Extensive);

  // Mindmap
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleReset = () => {
    setView(ViewState.UPLOADER);
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
  };

  // Subir y resumir
  const handleFileUpload = async (file: File, summaryType: SummaryType) => {
    try {
      setIsProcessing(true);
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

  // Generar presentación
  const handleCreatePresentation = async (file: File, type: PresentationType) => {
    try {
      setIsProcessing(true);
      const p = await createPresentation(file, type);
      setPresentation(p);
      setPresentationType(type);
      setView(ViewState.PRESENTATION);
    } catch (err: any) {
      alert(err?.message || "Error al generar presentación.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Abrir mapa mental (desde summary o desde presentation)
  const handleOpenMindMap = async () => {
    try {
      setIsProcessing(true);
      let baseText = summary || (presentation ? flattenPresentationToText(presentation) : "");
      if (!baseText) {
        alert("No hay texto base para el mapa mental.");
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
          onReset={handleReset}
          onCreatePresentation={handleCreatePresentation}
          isProcessing={isProcessing}
          onOpenMindMap={handleOpenMindMap} // <-- botón en SummaryView si quieres
        />
      )}

      {view === ViewState.PRESENTATION && presentation && (
        <PresentationView
          presentation={presentation}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ""}
          onReset={handleReset}
          onMindMap={handleOpenMindMap} // <-- botón “Ver como Mapa Mental”
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
