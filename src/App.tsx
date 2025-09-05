import React, { useEffect, useState } from "react";

/* ─── Auth ─────────────────────────────────────────────────────────────── */
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import AuthScreen from "./auth/AuthScreen";
import UpdatePasswordView from "./auth/UpdatePasswordView";

/* ─── UI / Views ──────────────────────────────────────────────────────── */
import FileUploader from "./components/FileUploader";
import SummaryView from "./components/SummaryView";
import PresentationView from "./components/PresentationView";
import MindMapView from "./components/MindMapView";
import MindMapDiagramView from "./components/MindMapDiagramView";
import FlashcardView from "./components/FlashcardView";
import UpgradeModal from "./components/UpgradeModal";

/* ─── Servicios IA ────────────────────────────────────────────────────── */
import {
  summarizeContent,
  createPresentation,
  createMindMapFromText,
  flattenPresentationToText,
  generateFlashcards,
} from "./services/geminiService";

/* ─── Types ───────────────────────────────────────────────────────────── */
import {
  ViewState,
  SummaryType,
  PresentationData,
  PresentationType,
  MindMapData,
  MindMapColorMode,
  Flashcard,
} from "./types";

/* ─── Paywall helpers ─────────────────────────────────────────────────── */
import { getAttempts, incAttempt } from "./lib/attempts";

/* ─── Supabase client ─────────────────────────────────────────────────── */
import { supabase } from "./lib/supabaseClient";

/* ────────────────────────────────────────────────────────────────────────
   Gate: si no hay usuario => AuthScreen; si viene de reset => UpdatePassword
   + Cabecera fija con Logo→Home, Badge PRO y botón Salir
────────────────────────────────────────────────────────────────────────── */
function Gate({ children }: { children: React.ReactNode }) {
  const auth = useAuth() as any;
  const { user, loading, signOut } = auth;
  const recovering = !!auth?.recovering;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        Cargando sesión…
      </div>
    );
  }

  if (recovering) return <UpdatePasswordView />;
  if (!user) return <AuthScreen />;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-3 py-2">
          {/* Logo → Home */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("go-home"))}
            className="flex items-center gap-2 group"
          >
            <div className="h-8 w-8 rounded-xl bg-yellow-400 text-black font-extrabold grid place-items-center group-active:scale-95">
              R
            </div>
            <span className="text-white/90 font-semibold">Resumetexto</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Badge PRO: lo actualiza AppInner vía localStorage */}
            {typeof window !== "undefined" &&
              localStorage.getItem("rtx_is_pro") === "1" && (
                <span className="text-xs px-2 py-1 rounded-full border border-emerald-500 text-emerald-300 bg-emerald-500/10">
                  PRO
                </span>
              )}
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Empuje para que el contenido no quede bajo la barra */}
      <div className="pt-14">{children}</div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   App real: límite 4 intentos (free) + modal Upgrade + lógica IA
────────────────────────────────────────────────────────────────────────── */
const AppInner: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.UPLOADER);

  const [summary, setSummary] = useState<string | null>(null);
  const [summaryTitle, setSummaryTitle] = useState<string | null>(null);

  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [presentationType, setPresentationType] = useState<PresentationType>(
    PresentationType.Extensive
  );

  const [mindmap, setMindmap] = useState<MindMapData | null>(null);
  const [mindMapColorMode, setMindMapColorMode] = useState<MindMapColorMode>(
    MindMapColorMode.Color
  );

  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Paywall modal
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Límite gratis y clave de usuario
  const auth = useAuth() as any;
  const user = auth?.user || null;

  // PRO dinámico: si es PRO, sin límite
  const [isPro, setIsPro] = useState(false);
  const FREE_LIMIT = isPro ? Infinity : 4;
  const userKey = user?.id ?? "anon";

  // Cargar plan desde Supabase y sincronizar badge
  const loadPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setIsPro(false);
        localStorage.setItem("rtx_is_pro", "0");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      const pro = !error && data?.plan === "pro";
      setIsPro(!!pro);
      localStorage.setItem("rtx_is_pro", pro ? "1" : "0");
    } catch {
      setIsPro(false);
      localStorage.setItem("rtx_is_pro", "0");
    }
  };

  useEffect(() => {
    loadPlan();
    // si volvemos de Checkout con ?paid=1, recarga plan
    if (typeof window !== "undefined" && window.location.search.includes("paid=1")) {
      loadPlan();
    }
  }, []);

  // Listener para ir a Home cuando se toca el logo
  useEffect(() => {
    const goHome = () => handleResetAll();
    window.addEventListener("go-home" as any, goHome as any);
    return () => window.removeEventListener("go-home" as any, goHome as any);
  }, []);

  const handleResetAll = () => {
    setError(null);
    setLoadingMessage(null);
    setIsProcessing(false);
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
    setFlashcards(null);
    setView(ViewState.UPLOADER);
  };

  async function recordAttemptInSupabase() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("attempts")
        .eq("id", user.id)
        .maybeSingle();
      if (error) return;

      const current = (data?.attempts as number | null) ?? 0;
      await supabase.from("profiles").update({ attempts: current + 1 }).eq("id", user.id);
    } catch {
      /* no-op */
    }
  }

  /** Subir y resumir (consume intento tras éxito) */
  const handleFileUpload = async (file: File, selectedSummaryType: SummaryType) => {
    setError(null);

    // Pre-check de intentos local
    const attempts = getAttempts(userKey);
    if (attempts >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    setIsProcessing(true);
    setLoadingMessage("⏳ Generando resumen, puede tardar unos minutos...");

    try {
      const generatedSummary = await summarizeContent(file, selectedSummaryType);
      setSummary(generatedSummary);
      setSummaryTitle(generatedSummary.split(" ").slice(0, 6).join(" "));
      setView(ViewState.SUMMARY);

      // +1 intento (local + BD)
      incAttempt(userKey);
      await recordAttemptInSupabase();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error desconocido al generar el resumen."
      );
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (!summary) return;
    setIsProcessing(true);
    setLoadingMessage("⏳ Generando mapa conceptual, puede tardar unos minutos...");
    try {
      const generatedPresentation = await createPresentation(summary, presentationType);
      setPresentation(generatedPresentation);
      setView(ViewState.PRESENTATION);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar la presentación.");
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleOpenMindMap = async (colorMode: MindMapColorMode) => {
    setMindMapColorMode(colorMode);
    setIsProcessing(true);
    setLoadingMessage(
      colorMode === MindMapColorMode.BlancoNegro
        ? "🧠 Generando mapa mental (clásico)..."
        : "🧠 Generando mapa mental (más detalle)..."
    );

    try {
      const baseText =
        (presentation && flattenPresentationToText(presentation)) ||
        summary ||
        "";
      if (!baseText) {
        throw new Error("No hay contenido para generar el mapa mental.");
      }

      const data = await createMindMapFromText(baseText);
      setMindmap(data);
      setView(ViewState.MINDMAP);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al generar el mapa mental."
      );
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!summary) return;
    setIsProcessing(true);
    setLoadingMessage("📇 Generando flashcards, un momento por favor...");
    try {
      const cards = await generateFlashcards(summary);
      setFlashcards(cards);
      setView(ViewState.FLASHCARDS);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al generar las flashcards."
      );
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  };

  const handleBackToSummary = () => setView(ViewState.SUMMARY);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 overflow-x-hidden">
      {error && (
        <div className="bg-red-600/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-3">
          {error}
        </div>
      )}

      {loadingMessage && (
        <div className="bg-indigo-600/20 border border-indigo-500 text-indigo-200 px-4 py-2 rounded mb-3">
          {loadingMessage}
        </div>
      )}

      {view === ViewState.UPLOADER && (
        <div className="max-w-3xl mx-auto">
          <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
        </div>
      )}

      {view === ViewState.SUMMARY && summary && (
        <SummaryView
          summary={summary}
          summaryTitle={summaryTitle || ""}
          presentationType={presentationType}
          setPresentationType={setPresentationType}
          onGeneratePresentation={handleGeneratePresentation}
          onOpenMindMap={handleOpenMindMap}
          onGenerateFlashcards={handleGenerateFlashcards}
          onReset={handleResetAll}
        />
      )}

      {view === ViewState.PRESENTATION && presentation && (
        <PresentationView
          presentation={presentation}
          presentationType={presentationType}
          summaryTitle={summaryTitle || ""}
          onBackToSummary={handleBackToSummary}
          onHome={handleResetAll}            // ← botón Inicio
        />
      )}

      {view === ViewState.MINDMAP && mindmap && (
        <>
          {mindMapColorMode === MindMapColorMode.BlancoNegro ? (
            <MindMapDiagramView
              data={mindmap}
              summaryTitle={summaryTitle}
              onBack={() =>
                setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)
              }
              onHome={handleResetAll}        // ← botón Inicio
            />
          ) : (
            <MindMapView
              data={mindmap}
              summaryTitle={summaryTitle}
              colorMode={mindMapColorMode}
              onBack={() =>
                setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)
              }
              onHome={handleResetAll}        // ← botón Inicio
            />
          )}
        </>
      )}

      {view === ViewState.FLASHCARDS && flashcards && (
        <FlashcardView
          flashcards={flashcards}
          summaryTitle={summaryTitle}
          onBack={handleBackToSummary}
        />
      )}

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────
   Export final: App envuelta con AuthProvider + Gate
─────────────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <Gate>
        <AppInner />
      </Gate>
    </AuthProvider>
  );
}
