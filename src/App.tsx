import React, { useEffect, useState } from "react";

/* ─── Auth ─────────────────────────────────────────────────────────────── */
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import AuthScreen from "./auth/AuthScreen";
import UpdatePasswordView from "./auth/UpdatePasswordView";

/* ─── UI / Views ──────────────────────────────────────────────────────── */
// Eliminamos el FileUploader clásico y usamos un uploader integrado aquí
// import FileUploader from "./components/FileUploader";
import SummaryView from "./components/SummaryView";
import PresentationView from "./components/PresentationView";
import MindMapView from "./components/MindMapView";
import MindMapDiagramView from "./components/MindMapDiagramView";
import FlashcardView from "./components/FlashcardView";
import UpgradeModal from "./components/UpgradeModal";

/* ─── Servicios IA ────────────────────────────────────────────────────── */
import {
  summarizeContent,
  summarizeContents, // ⟵ nuevo multi-archivo
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
   + Cabecera fija con Logo→Home, Badge PRO, VOLVER (flecha) y botón Salir
────────────────────────────────────────────────────────────────────────── */
function Gate({ children }: { children: React.ReactNode }) {
  const auth = useAuth() as any;
  const { user, loading, signOut } = auth;
  const recovering = !!auth?.recovering;
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const onToggleBack = (e: any) => setShowBack(!!e.detail);
    window.addEventListener("rtx-show-back" as any, onToggleBack as any);
    return () => window.removeEventListener("rtx-show-back" as any, onToggleBack as any);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white p-6">Cargando sesión…</div>;
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
            {/* Badge PRO (refrescado por AppInner vía localStorage) */}
            {typeof window !== "undefined" &&
              localStorage.getItem("rtx_is_pro") === "1" && (
                <span className="text-xs px-2 py-1 rounded-full border border-emerald-500 text-emerald-300 bg-emerald-500/10">
                  PRO
                </span>
              )}

            {/* VOLVER a Resumen (flecha atrás) */}
            {showBack && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("rtx-back"))}
                className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 inline-flex items-center gap-2"
                aria-label="Volver a resumen"
              >
                {/* ← flecha (chevron-left) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
                <span>Volver</span>
              </button>
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
   App real: límite 4 intentos (free) / ilimitado (pro) + lógica IA
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
  }, []);

  // Mostrar/ocultar botón VOLVER según la vista
  useEffect(() => {
    const show =
      view === ViewState.PRESENTATION ||
      view === ViewState.MINDMAP ||
      view === ViewState.FLASHCARDS;
    window.dispatchEvent(new CustomEvent("rtx-show-back", { detail: show }));
  }, [view]);

  // “Volver” desde la barra
  useEffect(() => {
    const onBack = () => setView(ViewState.SUMMARY);
    window.addEventListener("rtx-back" as any, onBack as any);
    return () => window.removeEventListener("rtx-back" as any, onBack as any);
  }, []);

  // Verificar Checkout al volver con session_id (fallback al webhook)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) return;

    (async () => {
      try {
        const res = await fetch(
          "/.netlify/functions/check-session?session_id=" +
            encodeURIComponent(sessionId)
        );
        const data = await res.json();
        if (data?.paid) {
          await loadPlan();
        } else {
          console.warn("Checkout no pagado todavía:", data);
        }
      } catch (e) {
        console.error("verify checkout error", e);
      } finally {
        url.searchParams.delete("session_id");
        url.searchParams.delete("checkout_success");
        window.history.replaceState({}, "", url.toString());
      }
    })();
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

  // ⟵ Nuevo: estado para uploader integrado
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploaderMsg, setUploaderMsg] = useState<string>(""); // mensajes UX (punto 4)
  const [selectedSummaryType, setSelectedSummaryType] = useState<SummaryType>(SummaryType.Medium);

  function handleFilesSelection(filesList: FileList | null) {
    setUploaderMsg("");
    const incoming = Array.from(filesList ?? []);
    if (incoming.length === 0) {
      setSelectedFiles([]);
      return;
    }

    const pdfs   = incoming.filter((f) => /^application\/pdf$/i.test(f.type));
    const images = incoming.filter((f) => /^image\//i.test(f.type));

    // Regla: o 1 PDF o hasta 6 fotos, sin mezclar
    if (pdfs.length > 0) {
      // Si ya había imágenes seleccionadas, las reemplazamos por el PDF
      if (selectedFiles.length && selectedFiles.every(f => /^image\//i.test(f.type))) {
        setUploaderMsg("Has elegido un PDF, he reemplazado las fotos por el PDF.");
      }
      // Solo 1 PDF
      if (pdfs.length > 1) {
        setUploaderMsg("Solo se admite 1 PDF. He seleccionado el primero.");
      }
      setSelectedFiles([pdfs[0]]);
      return;
    }

    // No hay PDFs → aceptamos imágenes hasta 6
    if (images.length > 6) {
      setUploaderMsg("Máximo 6 fotos. He seleccionado las 6 primeras.");
      setSelectedFiles(images.slice(0, 6));
      return;
    }

    setSelectedFiles(images);
  }

  function selectionIsValid() {
    if (selectedFiles.length === 0) return false;
    const hasPDF = selectedFiles.some((f) => /^application\/pdf$/i.test(f.type));
    const hasIMG = selectedFiles.some((f) => /^image\//i.test(f.type));
    if (hasPDF && hasIMG) return false;
    if (hasPDF) return selectedFiles.length === 1;
    // solo imágenes
    return selectedFiles.length >= 1 && selectedFiles.length <= 6;
  }

  async function handleSummarizeFromUploader() {
    try {
      setError(null);
      setUploaderMsg("");

      // Pre-check de intentos local
      const attempts = getAttempts(userKey);
      if (attempts >= FREE_LIMIT) {
        setShowUpgrade(true);
        return;
      }

      if (!selectionIsValid()) {
        setUploaderMsg("Selecciona 1 PDF o hasta 6 fotos (sin mezclar).");
        return;
      }

      setIsProcessing(true);
      setLoadingMessage("⏳ Generando resumen, puede tardar unos minutos...");

      // Invoca multi-archivo si hay varias imágenes; si es un PDF, sirve igual
      const generatedSummary =
        selectedFiles.length === 1
          ? await summarizeContent(selectedFiles[0], selectedSummaryType)
          : await summarizeContents(selectedFiles, selectedSummaryType);

      setSummary(generatedSummary);
      setSummaryTitle(generatedSummary.split(" ").slice(0, 6).join(" "));
      setView(ViewState.SUMMARY);

      incAttempt(userKey);
      await recordAttemptInSupabase();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error desconocido al generar el resumen.");
    } finally {
      setLoadingMessage(null);
      setIsProcessing(false);
    }
  }

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
        ? "🧠 Generando mapa mental (clásico)... puede tardar unos minutos"
        : "🧠 Generando mapa mental (más detalle)... puede tardar unos minutos"
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
    setLoadingMessage("📇 Generando flashcards… puede tardar unos minutos");
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

  // Uploader integrado (sustituye al FileUploader clásico)
  const Uploader = (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-2">Sube 1 PDF o hasta 6 fotos</h1>
      <p className="text-gray-300 mb-4 text-sm">
        No mezcles PDF con fotos. Si eliges PDF tras fotos, reemplazaré la selección por el PDF.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Tipo de resumen</label>
          <select
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full"
            value={selectedSummaryType}
            onChange={(e) => setSelectedSummaryType(e.target.value as SummaryType)}
          >
            <option value={SummaryType.Short}>Breve (5–7 frases)</option>
            <option value={SummaryType.Medium}>Medio (1 página)</option>
            <option value={SummaryType.Detailed}>Detallado</option>
            <option value={SummaryType.Bullet}>Viñetas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Selecciona archivos</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            multiple
            capture="environment"
            onChange={(e) => handleFilesSelection(e.target.files)}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-2 w-full"
          />
        </div>
      </div>

      {uploaderMsg && <div className="text-yellow-300 text-sm mb-3">{uploaderMsg}</div>}

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-3">
          {selectedFiles.map((f, idx) => (
            <div key={idx} className="border border-gray-700 rounded p-2 text-xs text-gray-300">
              {/^image\//i.test(f.type) ? (
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-full h-24 object-cover rounded"
                />
              ) : (
                <div className="h-24 flex items-center justify-center bg-gray-900 rounded">
                  📄 PDF
                </div>
              )}
              <div className="truncate mt-1" title={f.name}>{f.name}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSummarizeFromUploader}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
          disabled={!selectionIsValid() || isProcessing}
        >
          Generar resumen
        </button>
        <button
          onClick={() => { setSelectedFiles([]); setUploaderMsg(""); }}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          Limpiar selección
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 overflow-x-hidden">
      {error && (
        <div className="bg-red-600/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-3">
          {error}
        </div>
      )}

      {/* OVERLAY: barra amarilla parpadeante en el centro */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="mb-3 text-yellow-300 font-semibold">
              {loadingMessage || "Procesando… puede tardar unos minutos"}
            </div>
            <div className="h-3 rounded-full bg-yellow-400 animate-pulse" />
          </div>
        </div>
      )}

      {view === ViewState.UPLOADER && (
        <div className="max-w-3xl mx-auto">
          {Uploader}
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
          onHome={handleResetAll}
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
              onHome={handleResetAll}
            />
          ) : (
            <MindMapView
              data={mindmap}
              summaryTitle={summaryTitle}
              colorMode={mindMapColorMode}
              onBack={() =>
                setView(presentation ? ViewState.PRESENTATION : ViewState.SUMMARY)
              }
              onHome={handleResetAll}
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
