import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2636] text-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-2xl font-bold mb-2">Has agotado tus 4 intentos gratis</h2>
        <p className="text-gray-300 mb-5">
          <strong>Mejora a PRO</strong> para la funcionalidad completa:
          <br /> resume y crea mapas conceptuales ilimitadamente.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-600 rounded-lg py-2">
            Cerrar
          </button>
          <a
            href="/pro" // cámbialo a tu checkout cuando lo tengas
            className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 rounded-lg py-2"
          >
            Mejorar a PRO
          </a>
        </div>
      </div>
    </div>
  );
}
