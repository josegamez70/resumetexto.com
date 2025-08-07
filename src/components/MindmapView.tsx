import React from "react";

interface Props {
  mindmap: string;
  title: string;
  onReset: () => void;
}

const MindmapView: React.FC<Props> = ({ mindmap, title, onReset }) => {
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">{title}</h1>
      <div
        className="bg-white rounded-lg shadow p-6 overflow-auto border"
        dangerouslySetInnerHTML={{ __html: mindmap }}
      />
      <div className="mt-6 flex justify-center">
        <button
          onClick={onReset}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
};

export default MindmapView;
