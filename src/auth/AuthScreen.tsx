import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

type Mode = "signin" | "signup" | "magic";

const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithOtp, signInWithGoogle, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const disabled = loading || !email.trim() || (mode !== "magic" && !password);

  const handleSignIn = async () => {
    try {
      const { error } = await signIn(email, password);
      if (error) alert(error.message);
    } catch (e: any) {
      alert(e.message ?? "Error al iniciar sesión");
    }
  };

  const handleSignUp = async () => {
    if (password !== confirm) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    try {
      const { error } = await signUp(email, password);
      if (error) {
        alert(error.message);
      } else {
        alert("Revisa tu correo para confirmar la cuenta.");
        setMode("signin");
      }
    } catch (e: any) {
      alert(e.message ?? "Error al crear la cuenta");
    }
  };

  const handleMagic = async () => {
    try {
      const { error } = await signInWithOtp(email);
      if (error) alert(error.message);
      else alert("Te hemos enviado un enlace mágico a tu correo.");
    } catch (e: any) {
      alert(e.message ?? "Error al enviar el enlace mágico");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a]">
      <div className="w-[92%] max-w-[620px] bg-[#111827] rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-6">
          {mode === "signin" && "Acceder"}
          {mode === "signup" && "Crear cuenta"}
          {mode === "magic" && "Acceder con Magic link"}
        </h1>

        <label className="text-sm text-gray-300">Email</label>
        <input
          className="w-full mt-1 mb-4 rounded-lg bg-[#0b1220] text-white px-4 py-3 outline-none border border-[#1f2937] focus:border-[#6d28d9]"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode !== "magic" && (
          <>
            <label className="text-sm text-gray-300">Contraseña</label>
            <input
              className="w-full mt-1 mb-4 rounded-lg bg-[#0b1220] text-white px-4 py-3 outline-none border border-[#1f2937] focus:border-[#6d28d9]"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </>
        )}

        {mode === "signup" && (
          <>
            <label className="text-sm text-gray-300">Confirmar contraseña</label>
            <input
              className="w-full mt-1 mb-6 rounded-lg bg-[#0b1220] text-white px-4 py-3 outline-none border border-[#1f2937] focus:border-[#6d28d9]"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </>
        )}

        <div className="flex flex-wrap gap-3">
          {mode === "signin" && (
            <>
              <button
                className="px-5 py-3 rounded-lg bg-[#5b21b6] text-white hover:bg-[#6d28d9] disabled:opacity-50"
                onClick={handleSignIn}
                disabled={disabled}
              >
                Entrar
              </button>
              <button
                className="px-5 py-3 rounded-lg bg-[#374151] text-white hover:bg-[#4b5563]"
                onClick={() => setMode("signup")}
              >
                Crear cuenta
              </button>
              <button
                className="px-5 py-3 rounded-lg bg-[#0f766e] text-white hover:bg-[#115e59]"
                onClick={() => setMode("magic")}
              >
                Magic link
              </button>
            </>
          )}

          {mode === "signup" && (
            <>
              <button
                className="px-5 py-3 rounded-lg bg-[#5b21b6] text-white hover:bg-[#6d28d9] disabled:opacity-50"
                onClick={handleSignUp}
                disabled={disabled || !confirm}
              >
                Registrarme
              </button>
              <button
                className="px-5 py-3 rounded-lg bg-[#374151] text-white hover:bg-[#4b5563]"
                onClick={() => setMode("signin")}
              >
                Volver a login
              </button>
            </>
          )}

          {mode === "magic" && (
            <>
              <button
                className="px-5 py-3 rounded-lg bg-[#0f766e] text-white hover:bg-[#115e59] disabled:opacity-50"
                onClick={handleMagic}
                disabled={!email.trim() || loading}
              >
                Enviar enlace
              </button>
              <button
                className="px-5 py-3 rounded-lg bg-[#374151] text-white hover:bg-[#4b5563]"
                onClick={() => setMode("signin")}
              >
                Volver a login
              </button>
            </>
          )}
        </div>

        <div className="mt-6">
          <button
            className="px-5 py-3 rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c]"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            Google
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-400">
          Anonymous sign-ins are disabled
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
