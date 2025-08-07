import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import SummaryView from "./views/SummaryView";
import PresentationView from "./views/PresentationView";
import { summarizeContent, generateSummaryTitle } from "./services/geminiService";
import { ViewState, SummaryType } from "./types";
import MindmapView from "./components/MindmapView";

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOAD);
  const [summary, setSummary] = useState("");
  const [presentation, setPresentation] = useState("");
  const [mindmap, setMindmap] = useState("");
  const [summaryType, setSummaryType] = useState<SummaryType>("summary");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleFileUpload = async (file: File, type: SummaryType) => {
    setSummaryType(type);
    setView(ViewState.LOADING);
    setError("");

    try {
      const summaryText = await summarizeContent(file, type);
      setSummary(summaryText);

      if (type === "presentation") {
        setPresentation(summaryText);
        const generatedTitle = await generateSummaryTitle(summaryText);
        setTitle(generatedTitle);
        setView(ViewState.PRESENTATION);
      } else {
        setView(ViewState.SUMMARY);
      }
    } catch (err) {
      console.error(err);
      setError("Error al procesar el archivo.");
      setView(ViewState.UPLOAD);
    }
  };

  const handleReset = () => {
    setView(ViewState.UPLOAD);
    setSummary("");
    setPresentation("");
    setMindmap("");
    setTitle("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {view === ViewState.UPLOAD && (
        <FileUploader onFileUpload={handleFileUpload} error={error} />
      )}
      {view === ViewState.SUMMARY && (
        <SummaryView summary={summary} onReset={handleReset} />
      )}
      {view === ViewState.PRESENTATION && (
        <PresentationView
          presentation={presentation}
          onReset={handleReset}
          summary={summary}
          setMindmap={setMindmap}
          setView={setView}
        />
      )}
      {view === ViewState.MINDMAP && (
        <MindmapView mindmap={mindmap} onReset={handleReset} title={title} />
      )}
    </div>
  );
};

export default App;
