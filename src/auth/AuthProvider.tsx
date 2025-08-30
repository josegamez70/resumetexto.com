import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
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
    if (!user) return;
    const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (data) return;
    await supabase.from("profiles").upsert(
      [{ id: user.id, email: user.email, plan: "free", attempts: 0 }],
      { onConflict: "id" }
    );
  } catch (e) {
    console.warn("ensureProfile:", e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const s = data.session ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) ensureProfile(s.user);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      const u = newSession?.user ?? null;
      setSession(newSession ?? null);
      setUser(u);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      if (u) ensureProfile(u);
    });

    return () => sub?.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data?.user) ensureProfile(data.user);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: siteUrl },
    });
    if (data?.user) ensureProfile(data.user);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setRecovering(false);
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: siteUrl },
    });
    return { error };
  };

  const signInWithOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: siteUrl },
    });
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
