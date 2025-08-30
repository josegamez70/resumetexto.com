// src/auth/AuthProvider.tsx

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

// 🚨 CORRECCIÓN: Volvemos al tipo User de Supabase, no UserWithProfile
// El plan y los attempts se manejarán por separado o se cargarán de forma asíncrona.
type AuthContextValue = {
  session: Session | null;
  user: User | null; // <-- Tipo de usuario restaurado a 'User | null'
  loading: boolean;
  recovering: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signInWithOtp: (email: string) => Promise<{ error: any | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const siteUrl =
  (process.env.REACT_APP_SITE_URL as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "");

/* Asegura fila en public.profiles */
async function ensureProfile(user: User | null) {
  try {
    if (!user) {
      console.log("[AuthProvider] ensureProfile: No user, returning."); // Log para depuración
      return;
    }
    console.log(`[AuthProvider] ensureProfile: Checking profile for user ${user.id}...`); // Log para depuración

    const { data, error } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();

    if (error) {
      console.warn("[AuthProvider] ensureProfile: Error selecting profile:", error); // Log de error
      return;
    }

    if (data) {
      console.log("[AuthProvider] ensureProfile: Profile found.", data); // Log para depuración
      return;
    }

    console.log("[AuthProvider] ensureProfile: Profile not found, attempting to upsert."); // Log para depuración
    await supabase.from("profiles").upsert(
      [{ id: user.id, email: user.email, plan: "free", attempts: 0 }],
      { onConflict: "id" }
    );
    console.log("[AuthProvider] ensureProfile: Profile upserted successfully."); // Log para depuración
  } catch (e) {
    console.warn("[AuthProvider] ensureProfile exception:", e); // Log de excepción
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null); // <-- Tipo de usuario restaurado a 'User | null'
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let mounted = true;
    console.log("[AuthProvider] useEffect: Initializing AuthProvider..."); // Log para depuración

    const init = async () => {
      setLoading(true);
      console.log("[AuthProvider] init: Calling supabase.auth.getSession()..."); // Log para depuración
      const { data } = await supabase.auth.getSession();
      console.log("[AuthProvider] init: getSession() returned.", data); // Log para depuración

      if (!mounted) {
        console.log("[AuthProvider] init: Component unmounted, returning."); // Log para depuración
        return;
      }
      const s = data.session ?? null;
      setSession(s);
      setUser(s?.user ?? null); // Establecer el user base de Supabase

      console.log("[AuthProvider] init: Session and User set. Calling ensureProfile()..."); // Log para depuración
      if (s?.user) ensureProfile(s.user); // Llamar ensureProfile SIN esperar el retorno extendido

      setLoading(false);
      console.log("[AuthProvider] init: Loading set to false. AuthProvider initialized."); // Log final
    };
    init();

    console.log("[AuthProvider] useEffect: Setting up onAuthStateChange listener..."); // Log para depuración
    // 🚨 CORRECCIÓN: Se eliminan los tipos explícitos aquí para evitar errores de compilación TS
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[AuthProvider] onAuthStateChange: Event=${event}, Session user ID=${newSession?.user?.id || 'null'}`); // Log para depuración
      const u = newSession?.user ?? null;
      setSession(newSession ?? null);
      setUser(u); // Establecer el user base de Supabase
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (u) ensureProfile(u); // Llamar ensureProfile
    });

    return () => {
      console.log("[AuthProvider] useEffect cleanup: Unsubscribing from auth state changes."); // Log para depuración
      sub?.subscription.unsubscribe();
    };
  }, []); // Dependencias vacías, solo se ejecuta una vez

  const signIn = async (email: string, password: string) => {
    console.log(`[AuthProvider] signIn: Attempting to sign in with ${email}...`); // Log para depuración
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[AuthProvider] signIn: Error:", error); // Log de error
    } else {
      console.log("[AuthProvider] signIn: Success, user:", data?.user); // Log de éxito
      if (data?.user) ensureProfile(data.user);
    }
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log(`[AuthProvider] signUp: Attempting to sign up with ${email}...`); // Log para depuración
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: siteUrl },
    });
    if (error) {
      console.error("[AuthProvider] signUp: Error:", error); // Log de error
    } else {
      console.log("[AuthProvider] signUp: Success, user:", data?.user); // Log de éxito
      if (data?.user) ensureProfile(data.user);
    }
    return { error };
  };

  const signOut = async () => {
    console.log("[AuthProvider] signOut: Attempting to sign out..."); // Log para depuración
    await supabase.auth.signOut();
    setUser(null); // Limpiar el usuario al cerrar sesión
    setSession(null); // Limpiar la sesión al cerrar sesión
    console.log("[AuthProvider] signOut: Successfully signed out."); // Log de éxito
  };

  const sendPasswordReset = async (email: string) => {
    console.log(`[AuthProvider] sendPasswordReset: Requesting reset for ${email}...`); // Log para depuración
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl,
    });
    if (error) {
      console.error("[AuthProvider] sendPasswordReset: Error:", error); // Log de error
    } else {
      console.log("[AuthProvider] sendPasswordReset: Request successful."); // Log de éxito
    }
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    console.log("[AuthProvider] updatePassword: Attempting to update password..."); // Log para depuración
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setRecovering(false);
    if (error) {
      console.error("[AuthProvider] updatePassword: Error:", error); // Log de error
    } else {
      console.log("[AuthProvider] updatePassword: Password updated successfully."); // Log de éxito
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    console.log("[AuthProvider] signInWithGoogle: Requesting Google OAuth..."); // Log para depuración
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: siteUrl },
    });
    if (error) {
      console.error("[AuthProvider] signInWithGoogle: Error:", error); // Log de error
    }
    return { error };
  };

  const signInWithOtp = async (email: string) => {
    console.log(`[AuthProvider] signInWithOtp: Requesting OTP for ${email}...`); // Log para depuración
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: siteUrl },
    });
    if (error) {
      console.error("[AuthProvider] signInWithOtp: Error:", error); // Log de error
    }
    return { error };
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      loading,
      recovering,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      signInWithGoogle,
      signInWithOtp,
    }),
    [session, user, loading, recovering]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}