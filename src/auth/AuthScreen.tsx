import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

const inputCls =
  "w-full rounded-lg bg-[#161b22] border border-[#2b3140] text-slate-200 px-4 py-3 outline-none focus:border-indigo-500";
const btn = "rounded-lg px-4 py-2 font-medium";
const btnSolid = "bg-indigo-600 hover:bg-indigo-500 text-white";
const btnGhost = "bg-[#1f2633] hover:bg-[#242b3a] text-slate-200 border border-[#2b3140]";

const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithOtp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState<"in" | "up" | "otp" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const doSignIn = async () => {
    setError(null); setMsg(null); setLoading("in");
    const { error } = await signIn(email.trim(), password);
    setLoading(null);
    if (error) setError(error);
  };

  const doSignUp = async () => {
    setError(null); setMsg(null); setLoading("up");
    const { error, needsEmailConfirm } = await signUp(email.trim(), password);
    setLoading(null);
    if (error) setError(error);
    else if (needsEmailConfirm) {
      setMsg("¡Te enviamos un correo para confirmar tu cuenta! Revisa tu bandeja (y Spam).");
    } else {
      setMsg("Cuenta creada y sesión iniciada.");
    }
  };

  const doMagic = async () => {
    setError(null); setMsg(null); setLoading("otp");
    const { error } = await signInWithOtp(email.trim());
    setLoading(null);
    if (error) setError(error);
    else setMsg("Te enviamos un enlace mágico a tu email.");
  };

  const doGoogle = async () => {
    setError(null); setMsg(null); setLoading("google");
    const { error } = await signInWithGoogle();
    setLoading(null);
    if (error) setError(error);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[#0d1117]">
      <div className="w-full max-w-md bg-[#0f1420] border border-[#22283a] rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-100 mb-6">Acceder</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">
            {error}
          </div>
        )}
        {msg && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-4 py-3">
            {msg}
          </div>
        )}

        <label className="block text-slate-300 text-sm mb-2">Email</label>
        <input
          className={`${inputCls} mb-4`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@dominio.com"
          type="email"
          autoComplete="email"
        />

        <label className="block text-slate-300 text-sm mb-2">Contraseña</label>
        <input
          className={`${inputCls} mb-6`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          type="password"
          autoComplete="current-password"
        />

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={doSignIn}
            disabled={loading !== null}
            className={`${btn} ${btnSolid}`}
          >
            {loading === "in" ? "Entrando…" : "Entrar"}
          </button>

          <button
            onClick={doSignUp}
            disabled={loading !== null}
            className={`${btn} ${btnGhost}`}
            title="Crea una cuenta con email y contraseña"
          >
            {loading === "up" ? "Creando…" : "Crear cuenta"}
          </button>

          <button
            onClick={doMagic}
            disabled={loading !== null}
            className={`${btn} ${btnGhost}`}
          >
            {loading === "otp" ? "Enviando…" : "Magic link"}
          </button>
        </div>

        <div className="mt-4">
          <button
            onClick={doGoogle}
            disabled={loading !== null}
            className={`${btn} ${btnGhost}`}
          >
            {loading === "google" ? "Abriendo Google…" : "Google"}
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Anonymous sign-ins are disabled
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
