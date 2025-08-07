import React, { useState } from "react";
import { generateMindmap } from "../services/geminiService";
import { ViewState } from "../types";

interface Props {
  presentation: string;
  onReset: () => void;
  summary: string;
  setMindmap: (mindmapHtml: string) => void;
  setView: (view: ViewState) => void;
}

const PresentationView: React.FC<Props> = ({
  presentation,
  onReset,
  summary,
  setMindmap,
  setView,
}) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateMindmap = async () => {
    setGenerating(true);
    setError("");

    try {
      const generatedMindmap = await generateMindmap(summary);
      setMindmap(generatedMindmap);
      setView(ViewState.MINDMAP);
    } catch (err) {
      console.error(err);
      setError("Error al generar el mapa mental.");
    }

    setGenerating(false);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Presentación Generada</h1>
      <div
        className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
        dangerouslySetInnerHTML={{ __html: presentation }}
      />
      {error && <p className="text-red-600 mt-2">{error}</p>}

      <div className="flex gap-4 mt-6">
        <button
          onClick={onReset}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Volver al inicio
        </button>
        <button
          onClick={handleGenerateMindmap}
          disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          {generating ? "Generando..." : "Ver Mapa Mental"}
        </button>
      </div>
    </div>
  );
};

export default PresentationView;
