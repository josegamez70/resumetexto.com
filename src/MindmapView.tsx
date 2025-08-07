import React from "react";

interface Node {
  label: string;
  children?: Node[];
}

interface MindmapProps {
  root: Node;
  onReset: () => void;
}

const renderNode = (node: Node, depth = 0) => {
  return (
    <div className="ml-4 border-l-2 border-yellow-400 pl-4">
      <details className="mb-2">
        <summary className="font-semibold text-yellow-300 cursor-pointer">
          {node.label}
        </summary>
        {node.children &&
          node.children.map((child, idx) => (
            <div key={idx}>{renderNode(child, depth + 1)}</div>
          ))}
      </details>
    </div>
  );
};

const MindmapView: React.FC<MindmapProps> = ({ root, onReset }) => {
  return (
    <div className="max-w-5xl mx-auto p-6 animate-fadeIn">
      <h1 className="text-3xl font-bold mb-4 text-center text-yellow-400">
        🧠 Mapa Mental Interactivo
      </h1>
      <p className="text-center text-gray-300 mb-6 italic">
        Haz clic sobre los conceptos para desplegar ramas
      </p>
      {renderNode(root)}
      <div className="mt-8 text-center">
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default MindmapView;
