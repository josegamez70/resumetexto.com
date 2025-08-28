import React, { useState } from "react";
import { useAuth } from "./AuthProvider";

const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithMagicLink, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const doSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      alert(err.message ?? "No se pudo iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  const doSignUp = async () => {
    setBusy(true);
    try {
      await signUp(email, password);
      alert("Cuenta creada. Revisa tu email para confirmar la dirección.");
    } catch (err: any) {
      alert(err.message ?? "No se pudo crear la cuenta");
    } finally {
      setBusy(false);
    }
  };

  const doMagic = async () => {
    setBusy(true);
    try {
      await signInWithMagicLink(email);
      alert("Te hemos enviado un enlace mágico. Revisa tu correo.");
    } catch (err: any) {
      alert(err.message ?? "No se pudo enviar el enlace");
    } finally {
      setBusy(false);
    }
  };

  const doGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      alert(err.message ?? "No se pudo iniciar con Google");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-900 text-slate-100">
      <div className="w-[92vw] max-w-lg rounded-xl bg-slate-800/70 p-6 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold mb-6">Acceder</h1>

        <form onSubmit={doSignIn} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={doSignUp}
              disabled={busy}
              className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-60"
            >
              Crear cuenta
            </button>

            <button
              type="button"
              onClick={doMagic}
              disabled={busy}
              className="px-4 py-2 rounded-md bg-teal-700 hover:bg-teal-600 disabled:opacity-60"
            >
              Magic link
            </button>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={doGoogle}
              disabled={busy}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-60"
            >
              Google
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-4">
            Anonymous sign-ins are disabled
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;
