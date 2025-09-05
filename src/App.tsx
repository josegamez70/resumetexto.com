// src/App.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import SummaryView from "./components/SummaryView";
import PresentationView from "./components/PresentationView";
import MindMapView from "./components/MindMapView";
import MindMapDiagramView from "./components/MindMapDiagramView";
import FlashcardView from "./components/FlashcardView";
import UpgradeModal from "./components/UpgradeModal";
import AuthScreen from "./components/AuthScreen";              // si usas login por e-mail
import UpdatePasswordView from "./components/UpdatePasswordView"; // si usas set password
import { PresentationData, PresentationType, MindMapData, Flashcard, MindMapColorMode } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Config básica
// ─────────────────────────────────────────────────────────────────────────────
const FREE_LIMIT = 4;

// Netlify Functions (redirigidas por netlify.toml a /.netlify/functions/*)
const FN_CHECK_SESSION = "/api/check-session";
const FN_CREATE_CHECKOUT = "/api/create-checkout";
// opcionales si los tienes
const FN_PORTAL = "/api/create-portal";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de vista
// ─────────────────────────────────────────────────────────────────────────────
type View =
  | "home"
  | "summary"
  | "presentation"
  | "mindmap"
  | "mindmapDiagram"
  | "flashcards"
  | "auth"
  | "updatePassword";

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  // Navegación
  const [view, setView] = useState<View>("home");

  // Datos de trabajo
  const [summary, setSummary] = useState<string>("");
  const [summaryTitle, setSummaryTitle] = useState<string>("");
  const [presentationType, setPresentationType] = useState<PresentationType>(PresentationType.Extensive);

  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [mindmap, setMindmap] = useState<MindMapData | null>(null);          // mapa mental “más detalle”
  const [mindmapClassic, setMindmapClassic] = useState<MindMapData | null>(null); // mapa mental clásico (diagrama)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  // Suscripción
  const [isPro, setIsPro] = useState<boolean>(false);
  const [checkingSession, setCheckingSession] = useState<boolean>(false);

  // Modal de upgrade
  const [showUpgrade, setShowUpgrade] = useState<boolean>(false);

  // Intentos gratis
  const freeUsed = Number(localStorage.getItem("free_used") || "0");
  const [freeCount, setFreeCount] = useState<number>(Number.isFinite(freeUsed) ? freeUsed : 0);

  // ───────────────────────────────────────────────────────────────────────────
  // Utilidades de sesión / PRO
  // ───────────────────────────────────────────────────────────────────────────
  const refreshSession = useCallback(async () => {
    try {
      setCheckingSession(true);
      const r = await fetch(FN_CHECK_SESSION, { method: "GET", credentials: "include" });
      if (!r.ok) throw new Error("check-session failed");
      const data = await r.json();
      // espera { isPro: boolean, user?: {...} }
      setIsPro(Boolean(data?.isPro));
    } catch (e) {
      console.error("check-session error:", e);
      setIsPro(false);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // ───────────────────────────────────────────────────────────────────────────
  // Gating de intentos
  // ───────────────────────────────────────────────────────────────────────────
  const canUse = useMemo(() => isPro || freeCount < FREE_LIMIT, [isPro, freeCount]);

  const consumeFree = () => {
    if (isPro) return;
    const next = freeCount + 1;
    setFreeCount(next);
    localStorage.setItem("free_used", String(next));
  };

  const requirePro = () => setShowUpgrade(true);

  // ───────────────────────────────────────────────────────────────────────────
  // Callbacks de navegación
  // ───────────────────────────────────────────────────────────────────────────
  const goHome = () => setView("home");

  const handleBackToSummary = useCallback(() => {
    setView("summary");
  }, []);

  // Mostrar botón “Volver” en topbar solamente fuera de home/summary
  const showBack = view !== "home" && view !== "summary";

  // ───────────────────────────────────────────────────────────────────────────
  // Lógica de generación (usa tus funciones/servicios internos si los tienes)
  // Estas funciones solo cambian la vista y guardan el resultado.
  // Integra aquí tus llamadas a IA/funciones serverless existentes.
  // ───────────────────────────────────────────────────────────────────────────

  const onGeneratePresentation = async () => {
    if (!canUse) return requirePro();
    consumeFree();

    // TODO: Sustituye por TU llamada que genera la presentación
    // const data = await generatePresentation(summary, presentationType);
    // setPresentation(data);
    // DEMO: respeta la estructura si no hay datos aún
    const demo: PresentationData = {
      title: summaryTitle || "Mapa conceptual",
      sections: [
        { emoji: "📌", title: "Sección 1", content: "Contenido 1", subsections: [] },
        { emoji: "📌", title: "Sección 2", content: "Contenido 2", subsections: [] },
      ],
    };
    setPresentation(demo);
    setView("presentation");
  };

  const onOpenMindMap = async (colorMode: MindMapColorMode) => {
    if (!canUse) return requirePro();
    consumeFree();

    // TODO: Sustituye por TU llamada que genera el mindmap
    // const data = await generateMindMap(summary, colorMode);
    const data: MindMapData = {
      root: {
        id: "root",
        label: summaryTitle || "Tema",
        note: "",
        children: [
          { id: "a", label: "Idea A", note: "detalle A", children: [] },
          { id: "b", label: "Idea B", note: "detalle B", children: [] },
        ],
      },
    };

    if (colorMode === MindMapColorMode.BlancoNegro) {
      setMindmapClassic(data);
      setView("mindmapDiagram");
    } else {
      setMindmap(data);
      setView("mindmap");
    }
  };

  const onGenerateFlashcards = async () => {
    if (!canUse) return requirePro();
    consumeFree();

    // TODO: Sustituye por TU llamada que genera flashcards
    const cards: Flashcard[] = [
      { question: "¿Qué es X?", answer: "X es ..." },
      { question: "¿Cómo funciona Y?", answer: "Y funciona así ..." },
    ];
    setFlashcards(cards);
    setView("flashcards");
  };

  // Reset general (p.ej. botón “Volver a inicio”)
  const handleResetAll = () => {
    setPresentation(null);
    setMindmap(null);
    setMindmapClassic(null);
    setFlashcards([]);
    setSummary("");
    setSummaryTitle("");
    setView("home");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Checkout / Portal
  // ───────────────────────────────────────────────────────────────────────────
  const startCheckout = async () => {
    try {
      const r = await fetch(FN_CREATE_CHECKOUT, { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error("checkout init failed");
      const data = await r.json();
      if (data?.url) {
        window.location.href = data.url; // Stripe Hosted Checkout
      } else {
        throw new Error("No checkout URL");
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo iniciar el pago. Intenta de nuevo.");
    }
  };

  const openPortal = async () => {
    try {
      const r = await fetch(FN_PORTAL, { method: "POST", credentials: "include" });
      const data = await r.json();
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir el portal de facturación.");
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Salir (ajusta a tu sistema de auth: Supabase / tu backend)
  // ───────────────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      // Si usas Supabase: await supabase.auth.signOut();
      // o tu endpoint: await fetch('/api/logout', { method: 'POST', credentials: 'include' });
      localStorage.removeItem("free_used");
    } catch (e) {
      console.error(e);
    } finally {
      window.location.reload();
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Topbar (logo→home, PRO, Volver, Salir)
  // ───────────────────────────────────────────────────────────────────────────
  const TopBar = () => (
    <header className="sticky top-0 z-50 w-full bg-gray-900/80 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-2">
        {/* Logo → Home */}
        <button
          onClick={goHome}
          className="inline-flex items-center gap-2 hover:opacity-90 transition"
          aria-label="Inicio"
        >
          {/* Ajusta el src de tu logo */}
          <img src="/logo.svg" alt="Logo" className="h-7 w-7 rounded" />
          <span className="font-extrabold tracking-tight">resumetexto</span>
        </button>

        {/* Acciones a la derecha */}
        <div className="ml-auto flex items-center gap-2">
          {/* PRO Badge */}
          {isPro && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-400 text-black select-none">
              PRO
            </span>
          )}

          {/* ← Volver (entre PRO y Salir) */}
          {showBack && (
            <button
              onClick={handleBackToSummary}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 text-white hover:bg-gray-800/60"
              aria-label="Volver al resumen"
              title="Volver"
            >
              {/* icono casa */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3l9 8h-3v7h-5v-5h-2v5H6v-7H3l9-8z"/>
              </svg>
              <span className="hidden sm:inline">Volver</span>
            </button>
          )}

          {/* Salir */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/90 hover:bg-red-600 text-white"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Home muy simple (pon aquí tu pantalla de carga/entrada)
  // ───────────────────────────────────────────────────────────────────────────
  const Home: React.FC = () => (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bienvenido 👋</h1>
      <p className="text-gray-300 mb-4">
        Sube tu contenido o pega texto para generar el resumen y tus materiales de estudio.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => {
            // Simula que ya tenemos summary/summaryTitle (ajusta esto a tu flujo real)
            if (!summary) setSummary("Texto de ejemplo para el resumen…");
            if (!summaryTitle) setSummaryTitle("Mi documento");
            setView("summary");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg"
        >
          Ir al resumen
        </button>

        {!isPro && (
          <button
            onClick={() => setShowUpgrade(true)}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 px-4 rounded-lg"
          >
            Hazte PRO
          </button>
        )}
      </div>
    </div>
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Render principal por vistas
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <TopBar />

      {/* Contenido */}
      <main className="pb-10">
        {view === "home" && <Home />}

        {view === "summary" && (
          <SummaryView
            summary={summary}
            summaryTitle={summaryTitle}
            presentationType={presentationType}
            setPresentationType={setPresentationType}
            onGeneratePresentation={onGeneratePresentation}
            onOpenMindMap={onOpenMindMap}
            onGenerateFlashcards={onGenerateFlashcards}
            onReset={handleResetAll}
          />
        )}

        {view === "presentation" && presentation && (
          <PresentationView
            presentation={presentation}
            presentationType={presentationType}
            summaryTitle={summaryTitle}
            onBackToSummary={handleBackToSummary}
          />
        )}

        {view === "mindmap" && mindmap && (
          <MindMapView
            data={mindmap}
            summaryTitle={summaryTitle}
            colorMode={MindMapColorMode.Color}
            onBack={handleBackToSummary}
          />
        )}

        {view === "mindmapDiagram" && mindmapClassic && (
          <MindMapDiagramView
            data={mindmapClassic}
            summaryTitle={summaryTitle}
            onBack={handleBackToSummary}
          />
        )}

        {view === "flashcards" && (
          <FlashcardView
            flashcards={flashcards}
            summaryTitle={summaryTitle}
            onBack={handleBackToSummary}
          />
        )}

        {view === "auth" && <AuthScreen onDone={() => setView("home")} />}
        {view === "updatePassword" && (
          <UpdatePasswordView onDone={() => setView("home")} />
        )}
      </main>

      {/* Upgrade */}
      {showUpgrade && (
        <UpgradeModal
          isOpen={showUpgrade}
          isPro={isPro}
          freeLeft={Math.max(FREE_LIMIT - freeCount, 0)}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={startCheckout}
          onOpenPortal={openPortal}
        />
      )}

      {/* Debug mínimo opcional */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-2 right-2 text-[11px] text-gray-400">
          {checkingSession ? "Comprobando sesión…" : isPro ? "PRO" : `Gratis (${freeCount}/${FREE_LIMIT})`}
        </div>
      )}
    </div>
  );
};

export default App;
