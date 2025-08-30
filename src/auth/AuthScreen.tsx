// src/auth/AuthScreen.tsx

import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
// 🚨 CORRECCIÓN CLAVE: Usamos un import más robusto para react-icons
// Esto puede depender de la versión de react-icons, pero esta forma suele ser más compatible
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Mantener esta importación para los componentes

export default function AuthScreen() {
  const { signIn, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña

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
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-fadeIn">
        
        {/* Logo al estilo QuizzMaker / Resumelo */}
        <div className="flex flex-col items-center justify-center mb-6">
          {/* Tu logo de RESÚMELO! */}
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
          <h1 className="text-3xl font-extrabold text-yellow-400 mb-2 tracking-wide">RESÚMELO!</h1>
          <p className="text-gray-300 text-center text-sm">
            Bienvenido de Nuevo. Inicia sesión para continuar
          </p>
        </div>

        {/* Mensajes de feedback */}
        {msg && <div className="mb-3 rounded bg-green-600/20 border border-green-600 px-3 py-2 text-sm text-green-200">{msg}</div>}
        {err && <div className="mb-3 rounded bg-red-600/20 border border-red-600 px-3 py-2 text-sm text-red-200">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Correo Electrónico"
            className="w-full rounded-lg bg-white text-gray-800 px-4 py-3 outline-none border border-gray-300 focus:border-indigo-500 transition-colors duration-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative"> {/* Contenedor para el input de contraseña y el icono */}
            <input
              type={showPassword ? "text" : "password"} // Cambiar tipo según el estado
              placeholder="Contraseña"
              className="w-full rounded-lg bg-white text-gray-800 px-4 py-3 outline-none border border-gray-300 focus:border-indigo-500 transition-colors duration-200 pr-10" // Añadir padding-right para el icono
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={mode === "register" || mode === "login"}
            />
            {/* Icono de visibilidad de contraseña (ojo) */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                // 🚨 CORRECCIÓN: Asegúrate de que los iconos se renderizan correctamente como componentes.
                // Si aún falla, puede ser un problema de caché o de la versión de react-icons.
                <FaEyeSlash className="h-5 w-5" /> 
              ) : (
                <FaEye className="h-5 w-5" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-lg px-4 py-3 font-semibold transition-colors duration-300 ${
              loading ? "bg-indigo-500/60 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700" // Botón principal indigo
            }`}
          >
            {loading ? "Cargando..." : mode === "login" ? "Iniciar Sesión" : "Registrarse"}
          </button>
        </form>

        {/* Enlace "¿Olvidaste tu contraseña?" */}
        {mode === "login" && (
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="mt-4 w-full text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-200 text-center"
          >
            {loading ? "Enviando correo..." : "¿Olvidaste tu contraseña?"}
          </button>
        )}

        {/* Enlace "¿No tienes cuenta? Regístrate" */}
        <div className="mt-4 text-sm text-gray-400 text-center">
          {mode === "login" ? (
            <>
              ¿No tienes una cuenta?{" "}
              <button
                onClick={() => { setMode("register"); setMsg(null); setErr(null); }}
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 font-semibold"
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes una cuenta?{" "}
              <button
                onClick={() => { setMode("login"); setMsg(null); setErr(null); }}
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200 font-semibold"
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>

        {/* Pie de página */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Política de Privacidad, Cookies y Contacto</p>
          <p>© 2024 J M GAMEZ</p>
        </div>
      </div>
    </div>
  );
}