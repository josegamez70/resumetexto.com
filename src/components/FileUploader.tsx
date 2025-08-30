import React, { useState } from 'react';
import { SummaryType } from '../types';

export interface FileUploaderProps {
  onFileUpload: (file: File, summaryType: SummaryType) => Promise<void>;
  isProcessing?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, isProcessing }) => {
  const [file, setFile] = useState<File | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.Short);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = () => {
    if (file) {
      onFileUpload(file, summaryType);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-brand-surface p-6 rounded-2xl shadow-lg max-w-md mx-auto animate-fadeIn">
      {/* Encabezado */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span className="text-xl font-bold text-yellow-400 mr-2">+</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="14" rx="2" ry="2" strokeWidth="2" />
            <path strokeWidth="2" d="M8 20h8" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">RESÚMELO!</h1>
        <p className="text-gray-300 text-sm max-w-sm">
          Sube un <strong>PDF</strong> o una <strong>foto</strong> y deja que la IA cree un <strong>resumen</strong>, 
          que después puedes convertir en un <strong>Mapa Mental</strong>, como esquema interactivo, 
          para acelerar tu aprendizaje.
        </p>
      </div>

      {/* Área de subida */}
      <label
        htmlFor="fileInput"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
          ${dragActive ? 'border-yellow-400 bg-gray-700/50' : 'border-gray-500'}
          p-6 sm:p-10
          max-w-[280px] sm:max-w-full
          mx-auto`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-yellow-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115 8h1a5 5 0 011 9.9M12 12v9m0 0l-3-3m3 3l3-3"/>
        </svg>
        <span className="text-lg font-semibold text-gray-200 mb-1">
          {file ? file.name : "Haz clic o arrastra tu archivo aquí"}
        </span>
        <span className="text-sm text-gray-400">PDF o Imagen</span>
        <input
          id="fileInput"
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Selector de tipo de resumen */}
      <div className="mt-6">
        <label className="block mb-2 text-gray-300 font-medium">Tipo de resumen:</label>
        <select
          value={summaryType}
          onChange={(e) => setSummaryType(e.target.value as SummaryType)}
          className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none text-sm sm:text-base"
        >
          <option value={SummaryType.Short}>📄 Corto</option>
          <option value={SummaryType.Long}>📜 Largo</option>
          <option value={SummaryType.Bullets}>🔹 Por Puntos</option>
        </select>
      </div>

      {/* Botón de acción */}
      <button
        onClick={handleUpload}
        disabled={!file || isProcessing}
        className={`mt-8 w-full px-4 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
          isProcessing
            ? 'bg-yellow-500 cursor-wait'
            : file
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? "Procesando..." : "Subir y Resumir"}
      </button>
    </div>
  );
};

export default FileUploader;
