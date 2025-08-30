import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthScreen() {
  const { signIn, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔑 Reset de contraseña con feedback
  const handleResetPassword = async () => {
    if (!email) {
      setErr("Introduce tu email primero.");
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);

    const { error } = await sendPasswordReset(email);

    setLoading(false);
    if (error) {
      setErr(error.message || "No se pudo enviar el correo de recuperación.");
    } else {
      setMsg("📩 Revisa tu correo, hemos enviado un enlace de recuperación.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    const action = mode === "login" ? signIn : signUp;
    const { error } = await action(email, password);

    setLoading(false);
    if (error) {
      setErr(error.message || "Error de autenticación.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1f2636] rounded-2xl shadow-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">
          {mode === "login" ? "Iniciar sesión" : "Registrarse"}
        </h1>

        {msg && <div className="mb-3 rounded bg-green-600/20 border border-green-600 px-3 py-2 text-sm">{msg}</div>}
        {err && <div className="mb-3 rounded bg-red-600/20 border border-red-600 px-3 py-2 text-sm">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full mt-1 rounded-lg bg-[#0b1220] text-white px-4 py-3 outline-none border border-[#1f2937] focus:border-[#6d28d9]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full mt-1 rounded-lg bg-[#0b1220] text-white px-4 py-3 outline-none border border-[#1f2937] focus:border-[#6d28d9]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === "register" || mode === "login"}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-1 rounded-lg px-4 py-3 font-semibold ${
              loading ? "bg-indigo-500/60 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {mode === "login" && (
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="mt-4 w-full text-sm text-indigo-400 hover:text-indigo-300"
          >
            {loading ? "Enviando correo..." : "¿Olvidaste tu contraseña?"}
          </button>
        )}

        <div className="mt-4 text-sm text-gray-400">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
