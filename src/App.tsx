import React, { useState } from "react";

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

/* ─── Services ─────────────────────────────────────────────────────────── */
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

/* ─── Supabase client (para reflejar intentos en BD) ──────────────────── */
import { supabase } from "./lib/supabaseClient";

/* ────────────────────────────────────────────────────────────────────────
   Gate: si no hay usuario => AuthScreen; si viene de reset => UpdatePassword
────────────────────────────────────────────────────────────────────────── */
function Gate({ children }: { children: React.ReactNode }) {
  // 🔧 Tomamos el contexto como 'any' para no depender de que exponga 'recovering'
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

  // Si el usuario llega desde el email de recuperación de contraseña,
  // primero forzamos el cambio de contraseña (si el provider lo soporta).
  if (recovering) {
    return <UpdatePasswordView />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      <div className="fixed top-2 right-2 z-50">
        <button
          onClick={signOut}
          className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
        >
          Salir
        </button>
      </div>
      {children}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   App real: límite 4 intentos + modal Upgrade + lógica IA
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

  // Límite gratis (localStorage) y clave de usuario
  const auth = useAuth() as any;
  const user = auth?.user || null;
  const FREE_LIMIT = 4;
  const userKey = user?.id ?? "anon";

  const handleResetAll = () => {
    setSummary(null);
    setSummaryTitle(null);
    setPresentation(null);
    setMindmap(null);
    setFlashcards(null);
    setError(null);
    setLoadingMessage(null);
    setView(ViewState.UPLOADER);
  };

  const handleBackToSummary = () => setView(ViewState.SUMMARY);

  /** Refleja +1 intento en Supabase si hay usuario */
  async function recordAttemptInSupabase() {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("attempts")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("profiles select attempts error:", error);
        return;
      }

      const current = (data?.attempts as number | null) ?? 0;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ attempts: current + 1 })
        .eq("id", user.id);

      if (updErr) console.warn("profiles update attempts error:", updErr);
    } catch (e) {
      console.warn("recordAttemptInSupabase exception:", e);
    }
  }

  /** Subir y resumir (consume intento tras éxito) */
  const handleFileUpload = async (file: File, summaryType: SummaryType) => {
    setError(null);

    // Pre-check de intentos en local
    const attempts = getAttempts(userKey);
    if (attempts >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    setIsProcessing(true);
    setLoadingMessage("⏳ Generando resumen, puede tardar unos minutos...");

    try {
      const generatedSummary = await summarizeContent(file, summaryType);
      setSummary(generatedSummary);
      setSummaryTitle(generatedSummary.split(" ").slice(0, 6).join(" "));
      setView(ViewState.SUMMARY);

      // Consumir intento local y reflejar en Supabase si hay usuario
      incAttempt(userKey);
      await recordAttemptInSupabase();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al generar el resumen."
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
      const generatedPresentation = await createPresentation(
        summary,
        presentationType
      );
      setPresentation(generatedPresentation);
      setView(ViewState.PRESENTATION);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error desconocido al generar el mapa conceptual."
      );
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
      if (!baseText) throw new Error("No hay contenido para generar el mapa mental.");

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
      const generatedFlashcards = await generateFlashcards(summary);
      setFlashcards(generatedFlashcards);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 overflow-x-hidden">
      {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}

      {loadingMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-yellow-500 text-black p-4 rounded-lg text-center font-semibold animate-pulse max-w-xs">
            {loadingMessage}
          </div>
        </div>
      )}

      {view === ViewState.UPLOADER && (
        <FileUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
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
        />
      )}

      {view === ViewState.MINDMAP && mindmap && (
        mindMapColorMode === MindMapColorMode.BlancoNegro ? (
          <MindMapDiagramView
            data={mindmap}
            summaryTitle={summaryTitle}
            onBack={() =>
              setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)
            }
          />
        ) : (
          <MindMapView
            data={mindmap}
            summaryTitle={summaryTitle}
            colorMode={mindMapColorMode}
            onBack={() =>
              setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)
            }
          />
        )
      )}

      {view === ViewState.FLASHCARDS && flashcards && (
        <FlashcardView
          flashcards={flashcards}
          summaryTitle={summaryTitle}
          onBack={handleBackToSummary}
        />
      )}

      {/* Modal Upgrade cuando se acaban los 4 intentos */}
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
