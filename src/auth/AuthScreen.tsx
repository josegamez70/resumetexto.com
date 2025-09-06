// src/auth/AuthScreen.tsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import PrivacyPolicyView from "../components/PrivacyPolicyView";

type Mode = "signin" | "signup" | "forgot";

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        alert("Revisa tu correo para confirmar la cuenta.");
        setMode("signin");
      } else {
        // forgot
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`,
        });
        if (error) throw error;
        alert("Te hemos enviado un correo para restablecer la contraseña.");
        setMode("signin");
      }
    } catch (err: any) {
      setError(err?.message || "Ha ocurrido un error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Encabezado */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-3xl mb-3">
              <span>⚡</span>
              <span>+</span>
              <span>🖥️</span>
            </div>
            <h1 className="text-4xl font-extrabold text-yellow-400 tracking-wide">
              RESÚMELO!
            </h1>
            <p className="text-gray-300 mt-2">
              {mode === "signin" && "Bienvenido de Nuevo. Inicia sesión para continuar"}
              {mode === "signup" && "Crea tu cuenta para empezar"}
              {mode === "forgot" && "Restablece tu contraseña"}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-600/20 border border-red-500 text-red-200 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-gray-900/60 border border-gray-700 px-4 py-3 outline-none focus:border-indigo-500"
            />

            {mode !== "forgot" && (
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-gray-900/60 border border-gray-700 px-4 py-3 outline-none focus:border-indigo-500"
              />
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 py-3 font-semibold"
            >
              {mode === "signin" && (busy ? "Entrando…" : "Iniciar Sesión")}
              {mode === "signup" && (busy ? "Creando…" : "Crear Cuenta")}
              {mode === "forgot" && (busy ? "Enviando…" : "Enviar enlace")}
            </button>
          </form>

          {/* Acciones secundarias */}
          <div className="text-center mt-4 space-y-2">
            {mode !== "forgot" ? (
              <button
                onClick={() => setMode("forgot")}
                className="text-indigo-300 hover:text-indigo-200"
              >
                ¿Olvidaste tu contraseña?
              </button>
            ) : (
              <button
                onClick={() => setMode("signin")}
                className="text-indigo-300 hover:text-indigo-200"
              >
                Volver a iniciar sesión
              </button>
            )}

            <div className="text-gray-300">
              {mode === "signin" ? (
                <>
                  ¿No tienes una cuenta?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-indigo-300 hover:text-indigo-200 font-semibold"
                  >
                    Regístrate
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tienes cuenta?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-indigo-300 hover:text-indigo-200 font-semibold"
                  >
                    Inicia sesión
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Pie con enlace a la política (abre overlay) */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-sm text-gray-400 hover:text-gray-200 underline underline-offset-4"
            >
              Política de Privacidad, Cookies y Contacto
            </button>

            <div className="text-xs text-gray-500 mt-2">© 2024 J M GAMEZ</div>
          </div>
        </div>
      </div>

      {/* OVERLAY de Política de Privacidad */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <PrivacyPolicyView onGoBack={() => setShowPrivacy(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default AuthScreen;
