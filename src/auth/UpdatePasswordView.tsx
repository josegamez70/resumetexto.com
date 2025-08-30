// src/auth/UpdatePasswordView.tsx
import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function UpdatePasswordView() {
  const { updatePassword } = useAuth() as any;
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (password.length < 8) return setErr("La contraseña debe tener al menos 8 caracteres.");
    if (password !== password2) return setErr("Las contraseñas no coinciden.");

    setLoading(true);
    const res = await updatePassword(password);
    setLoading(false);

    if (res?.error) setErr(res.error.message || "No se pudo actualizar la contraseña.");
    else setMsg("✅ Contraseña actualizada. Ya puedes usarla para iniciar sesión.");
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2636] rounded-2xl shadow-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">Restablecer contraseña</h1>
        <p className="text-gray-300 mb-4">Introduce tu nueva contraseña para completar la recuperación.</p>

        {msg && <div className="mb-3 rounded bg-green-600/20 border border-green-600 px-3 py-2 text-sm">{msg}</div>}
        {err && <div className="mb-3 rounded bg-red-600/20 border border-red-600 px-3 py-2 text-sm">{err}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Nueva contraseña</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 rounded-lg bg-[#0b1220] text-white px-4 py-3 outline-none border border-[#1f2937] focus:border-[#6d28d9]"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-300">Repite la contraseña</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full mt-1 rounded-lg bg-[#0b1220] text-white px-4 py-3 outline-none border border-[#1f2937] focus:border-[#6d28d9]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-1 rounded-lg px-4 py-3 font-semibold ${
              loading ? "bg-indigo-500/60 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            Guardar nueva contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
