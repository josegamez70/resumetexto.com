<div className="flex gap-4 mb-6 flex-wrap">
  <button
    onClick={expandAll}
    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
  >
    📂 Desplegar todos
  </button>
  <button
    onClick={collapseAll}
    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
  >
    📁 Colapsar todos
  </button>
  <button
    onClick={printPDF}
    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
  >
    🖨 Imprimir a PDF
  </button>
  <div>
    <button
      onClick={downloadHTML}
      className="bg-gray-300 hover:bg-gray-400 text-black border border-black px-4 py-2 rounded-lg"
    >
      💾 Descargar HTML Interactivo
    </button>
    <p className="text-gray-400 text-sm mt-1">Para más detalle, usa la opción "Completa".</p>
  </div>
</div>
