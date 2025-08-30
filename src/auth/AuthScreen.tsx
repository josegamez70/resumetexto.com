// src/auth/AuthScreen.tsx

import React, { useState } from "react";
import { useAuth } from "./AuthProvider";
// No se importan iconos de react-icons aquí para evitar el problema de compilación

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
    console.log("[AuthScreen] handleResetPassword: Clicked.");
    if (!email) {
      console.log("[AuthScreen] handleResetPassword: Email is empty.");
      setErr("Introduce tu email primero.");
      return;
    }
    setLoading(true);
    setErr(null);
    setMsg(null);
    console.log(`[AuthScreen] handleResetPassword: Sending password reset for ${email}...`);

    const { error } = await sendPasswordReset(email);

    setLoading(false);
    if (error) {
      console.error("[AuthScreen] handleResetPassword: Error sending reset email:", error);
      setErr(error.message || "No se pudo enviar el correo de recuperación.");
    } else {
      console.log("[AuthScreen] handleResetPassword: Reset email sent successfully.");
      setMsg("📩 Revisa tu correo, hemos enviado un enlace de recuperación.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    console.log(`[AuthScreen] handleSubmit: Mode=${mode}, Attempting auth for ${email}...`); // Log para inicio de sesión/registro

    const action = mode === "login" ? signIn : signUp;
    const { error } = await action(email, password);

    setLoading(false);
    if (error) {
      console.error(`[AuthScreen] handleSubmit: Auth error in ${mode} mode:`, error);
      setErr(error.message || "Error de autenticación.");
    } else {
      console.log(`[AuthScreen] handleSubmit: Auth successful in ${mode} mode.`);
      // En un caso real, aquí no se establecería un mensaje, sino que el AuthProvider
      // redirigiría o actualizaría el estado global de autenticación.
      // Aquí puedes añadir un msg si el AuthProvider no redirige automáticamente.
      if (mode === "register") {
        setMsg("✅ Registro exitoso. Revisa tu email para confirmar tu cuenta y luego inicia sesión.");
        // Opcional: setMode("login") para que intenten iniciar sesión inmediatamente
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4"> {/* Fondo oscuro */}
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-fadeIn"> {/* Tarjeta central */}
        
        {/* Logo al estilo QuizzMaker / Resumelo */}
        <div className="flex flex-col items-center justify-center mb-6">
          {/* Tu logo de RESÚMELO! */}
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span className="text-xl font-bold text-yellow-400 mr-2">+</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="4" width="18" height="14" rx="2" ry="2" strokeWidth={2} />
              <path strokeWidth={2} d="M8 20h8" />
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
            {/* Icono de visibilidad de contraseña (ojo) - VOLVEMOS AL SVG GENÉRICO QUE SÍ COMPILABA */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                // Icono de ojo tachado (SVG genérico)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414L5.586 7.5l-2.293 2.293a1 1 0 001.414 1.414L7 8.414l2.293 2.293a1 1 0 101.414-1.414L8.414 7l2.293-2.293a1 1 0 00-1.414-1.414L7 5.586 4.707 3.293a1 1 0 00-1.414 0z" clipRule="evenodd" />
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.027 12c.797.648 1.413 1.252 1.834 1.815A1 1 0 002.583 14h14.834a1 1 0 00.722-.415c.421-.563 1.037-1.167 1.834-1.815.011-.009.023-.016.035-.023a.994.994 0 00.16-.255c.036-.08.069-.163.099-.251.047-.138.077-.282.09-.434.015-.178.015-.357 0-.535-.013-.152-.043-.296-.09-.434a.994.994 0 00-.099-.251.994.994 0 00-.16-.255c-.012-.007-.024-.014-.035-.023a8.885 8.085 0 00-1.834-1.815 1 1 0 00-.722-.415H2.583a1 1 0 00-.722.415A8.885 8.085 0 00.027 12c.011.009.023.016.035.023zM10 8a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                </svg>
              ) : (
                // Icono de ojo normal (SVG genérico)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.027 12c.797.648 1.413 1.252 1.834 1.815A1 1 0 002.583 14h14.834a1 1 0 00.722-.415c.421-.563 1.037-1.167 1.834-1.815.011-.009.023-.016.035-.023a.994.994 0 00.16-.255c.036-.08.069-.163.099-.251.047-.138.077-.282.09-.434.015-.178.015-.357 0-.535-.013-.152-.043-.296-.09-.434a.994.994 0 00-.099-.251.994.994 0 00-.16-.255c-.012-.007-.024-.014-.035-.023a8.885 8.085 0 00-1.834-1.815 1 1 0 00-.722-.415H2.583a1 1 0 00-.722.415A8.885 8.085 0 00.027 12c.011.009.023.016.035.023z" clipRule="evenodd" />
                </svg>
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
            {loading ? "Cargando..." : mode === "login" ? "Iniciar Sesión" : "Registrarse"} {/* 🚨 CORREGIDO EL TEXTO DEL BOTÓN */}
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