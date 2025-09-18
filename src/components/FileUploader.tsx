import React, { useMemo, useState } from "react";
import { SummaryType } from "../types";

export interface FileUploaderProps {
  onUpload: (fileOrFiles: any, summaryType: SummaryType) => Promise<void> | void;
  isProcessing?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload, isProcessing }) => {
  const [selected, setSelected] = useState<File[]>([]);
  const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.Short);
  const [dragActive, setDragActive] = useState(false);
  const [msg, setMsg] = useState("");

  const isValid = useMemo(() => {
    if (!selected.length) return false;
    const hasPDF = selected.some(f => /^application\/pdf$/i.test(f.type));
    const hasIMG = selected.some(f => /^image\//i.test(f.type));
    if (hasPDF && hasIMG) return false;
    if (hasPDF && selected.length !== 1) return false;
    if (!hasPDF && hasIMG && selected.length > 6) return false;
    return true;
  }, [selected]);

  function appendImages(newImages: File[]) {
    const hadPDF = selected.some(f => /^application\/pdf$/i.test(f.type));
    if (hadPDF) {
      setMsg("Has elegido fotos, he reemplazado el PDF por las fotos.");
      setSelected(newImages.slice(0, 6));
      return;
    }
    const currentImages = selected.filter(f => /^image\//i.test(f.type));
    let next = [...currentImages, ...newImages];
    if (next.length > 6) {
      next = next.slice(0, 6);
      setMsg("Máximo 6 fotos. He mantenido las primeras 6.");
    }
    setSelected(next);
  }

  function pickFiles(filesList: FileList | null) {
    setMsg("");
    const incoming = Array.from(filesList ?? []);
    if (!incoming.length) return;

    const pdfs   = incoming.filter(f => /^application\/pdf$/i.test(f.type));
    const images = incoming.filter(f => /^image\//i.test(f.type));

    if (pdfs.length > 0) {
      const hadOnlyImages = selected.length && selected.every(f => /^image\//i.test(f.type));
      if (hadOnlyImages) setMsg("Has elegido un PDF, he reemplazado las fotos por el PDF.");
      if (pdfs.length > 1) setMsg("Solo se admite 1 PDF. He seleccionado el primero.");
      setSelected([pdfs[0]]);
      return;
    }

    if (images.length > 0) {
      appendImages(images);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    pickFiles(e.target.files);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(true);
  }
  function handleDragLeave() {
    setDragActive(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      pickFiles(e.dataTransfer.files);
    }
  }

  async function handleGenerate() {
    if (!isValid || isProcessing) {
      if (!isValid) setMsg("Selecciona 1 PDF o hasta 6 fotos (no mezcles).");
      return;
    }
    const hasPDF = selected.some(f => /^application\/pdf$/i.test(f.type));
    if (hasPDF) {
      await onUpload(selected[0], summaryType);
    } else {
      await onUpload(selected, summaryType);
    }
  }

  return (
    <div className="bg-brand-surface p-6 rounded-2xl shadow-lg max-w-md mx-auto animate-fadeIn">
      {/* Área de subida */}
      <label
        htmlFor="fileInput"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
          ${dragActive ? 'border-yellow-400 bg-gray-700/50' : 'border-gray-500'}
          p-10 sm:p-12
          max-w-[280px] sm:max-w-full
          mx-auto
          relative`}
      >
        {/* Icono central */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-yellow-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115 8h1a5 5 0 011 9.9M12 12v9m0 0l-3-3m3 3l3-3"/>
        </svg>

        {/* Texto dinámico */}
        <span className="text-lg font-semibold text-gray-200 mb-1">
          {selected.length
            ? selected.length === 1
              ? selected[0].name
              : `${selected.length} archivos seleccionados`
            : "Haz clic o arrastra tus archivos aquí"}
        </span>
        <span className="text-sm text-gray-400">PDF o Imágenes (máx. 6)</span>

        {/* Mensaje contador en el centro */}
        {selected.length > 0 &&
         selected.every(f => /^image\//i.test(f.type)) &&
         selected.length < 6 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-200 font-bold text-lg pointer-events-none">
            Puedes tomar hasta {6 - selected.length} fotos más
          </div>
        )}

        <input
          id="fileInput"
          type="file"
          accept=".pdf,image/*"
          multiple
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />
      </label>

      {/* Aviso dinámico */}
      {msg && <div className="text-yellow-300 text-sm mt-2 text-center">{msg}</div>}

      {/* Thumbnails */}
      {selected.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {selected.map((f, idx) => (
            <div key={idx} className="border border-gray-600 rounded-lg p-2 text-xs text-gray-300">
              {/^image\//i.test(f.type) ? (
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-full h-24 object-cover rounded"
                />
              ) : (
                <div className="w-full h-24 grid place-items-center bg-gray-800 rounded">
                  📄 PDF
                </div>
              )}
              <div className="truncate mt-1" title={f.name}>{f.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tipo de resumen */}
      <div className="mt-6">
        <label className="block mb-2 text-gray-300 font-medium">Tipo de resumen:</label>
        <select
          value={summaryType}
          onChange={(e) => setSummaryType(e.target.value as SummaryType)}
          className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-yellow-400 focus:outline-none text-sm sm:text-base"
        >
          <option value={SummaryType.Short}>📄 Corto</option>
          <option value={SummaryType.Detailed}>📜 Largo</option>
          <option value={SummaryType.Bullet}>🔹 Por Puntos</option>
        </select>
      </div>

      {/* Botón de acción */}
      <button
        onClick={handleGenerate}
        disabled={!isValid || !!isProcessing}
        className={`mt-6 w-full px-4 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
          isProcessing
            ? "bg-yellow-500 cursor-wait"
            : isValid
            ? "bg-green-500 hover:bg-green-600"
            : "bg-gray-500 cursor-not-allowed"
        }`}
      >
        {isProcessing ? "Procesando..." : "Generar"}
      </button>
    </div>
  );
};

export default FileUploader;
