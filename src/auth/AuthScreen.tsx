import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (p) => (
  <input {...p}
    className="w-full rounded-lg border border-gray-600 bg-gray-800 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
);

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (fn: () => Promise<any>) => {
    setLoading(true); setMsg(null);
    const { error } = await fn();
    setLoading(false);
    if (error) setMsg(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md space-y-4 bg-gray-800/60 border border-gray-700 p-5 rounded-2xl">
        <h1 className="text-2xl font-bold">Acceder</h1>

        <div className="space-y-2">
          <label className="text-sm">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Contraseña</label>
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => run(() => supabase.auth.signInWithPassword({ email, password: pass }))}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">
            Entrar
          </button>

          <button
            onClick={() => run(() => supabase.auth.signUp({ email, password: pass }))}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">
            Crear cuenta
          </button>

          <button
            onClick={() => run(() => supabase.auth.signInWithOtp({
              email, options: { emailRedirectTo: window.location.origin },
            }))}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700">
            Magic link
          </button>

          <button
            onClick={() => run(() => supabase.auth.signInWithOAuth({
              provider: "google", options: { redirectTo: window.location.origin },
            }))}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700">
            Google
          </button>
        </div>

        {msg && <p className="text-sm text-amber-300">{msg}</p>}
        {loading && <p className="text-sm opacity-70">Procesando…</p>}
      </div>
    </div>
  );
}
