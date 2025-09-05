import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const goPro = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      const email  = user?.email || null;

      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      });

      if (!res.ok) throw new Error("No se pudo crear la sesión de pago");
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else throw new Error("Respuesta inválida de Checkout");
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error iniciando el pago.");
    } finally {
      setLoading(false);
    }
  };

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
          <button
            onClick={goPro}
            disabled={loading}
            className={`flex-1 text-center rounded-lg py-2 ${loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
            {loading ? "Abriendo pago..." : "Mejorar a PRO"}
          </button>
        </div>
      </div>
    </div>
  );
}
