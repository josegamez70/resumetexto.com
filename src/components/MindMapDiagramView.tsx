import React, { useRef, useState } from "react";
import { MindMapData, MindMapNode } from "../types";

type Props = { data: MindMapData; summaryTitle?: string | null; onBack: () => void; onHome?: () => void; };

const BackToSummaryFab: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full shadow-lg hover:bg-yellow-300"
    aria-label="Volver al resumen"
  >
    ← Volver
  </button>
);

const hasKids = (n: MindMapNode) => (n.children || []).some((c) => String(c?.label ?? "").trim());

const Caret: React.FC<{ open: boolean }> = ({ open }) => (
  <span
    aria-hidden="true"
    className={`inline-block ml-2 transition-transform ${open ? "rotate-90" : "rotate-0"}`}
    style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid currentColor" }}
  />
);

const simplifyLabel = (raw: string, maxWords = 4) => {
  const clean = (raw || "")
    .replace(/[().,:;/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const tokens = clean.split(" ").filter(Boolean);
  const picked: string[] = [];
  const STOP = new Set(["de","del","la","el","los","las","y","o","u","en","a","al","con","por","para","un","una","uno","unos","unas","que","se","su","sus","es","son","como","si","no","más","menos","lo","las","les","le","e"]);
  for (const t of tokens) {
    const w = t.toLowerCase();
    if (STOP.has(w) || w.length <= 2) continue;
    picked.push(t);
    if (picked.length >= maxWords) break;
  }
  if (picked.length === 0) picked.push(...tokens.slice(0, Math.min(3, tokens.length)));
  return picked.join(" ");
};

const NodeInteractive: React.FC<{ node: MindMapNode; level: number }> = ({ node, level }) => {
  const [open, setOpen] = useState(false);
  const kids = (node.children || []).filter((c) => String(c?.label ?? "").trim());

  if (level === 0) {
    return (
      <div className="flex sm:flex-row flex-col sm:items-center items-stretch gap-4">
        <div
          className="select-none"
          style={{
            background: "#0b1220",
            color: "#fff",
            border: "2px solid #6b7280",
            borderRadius: 12,
            padding: "14px 18px",
            fontWeight: 800,
            minWidth: "18ch",
            maxWidth: "32ch",
            lineHeight: 1.15,
          }}
        >
          {simplifyLabel(node.label)}
        </div>
        {kids.length > 0 && (
          <svg width="42" height="30" viewBox="0 0 42 30" className="hidden sm:block shrink-0" aria-hidden="true">
            <path d="M2 2 C 2 18, 40 2, 40 28" stroke="rgba(148,163,184,.6)" strokeWidth="1.5" fill="none" />
          </svg>
        )}
        {kids.length > 0 && (
          <div className="flex flex-row gap-4 flex-nowrap">
            {kids.map((k) => (
              <NodeInteractive key={k.id} node={k} level={1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const toggle = () => hasKids(node) && setOpen((v) => !v);

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={toggle}
        className="select-none cursor-pointer"
        style={{
          background: "#111827",
          color: "#fff",
          border: "1px solid rgba(255,255,255,.15)",
          borderRadius: 12,
          padding: "12px 16px",
          fontWeight: 600,
          minWidth: "16ch",
          maxWidth: "26ch",
          lineHeight: 1.15,
        }}
      >
        <div className="flex items-center justify-center">
          <span>{simplifyLabel(node.label)}</span>
          {hasKids(node) && <Caret open={open} />}
        </div>
      </div>

      {open && hasKids(node) && (
        <>
          <div className="h-4 w-px bg-slate-500/70 my-2" />
          <div className="flex flex-col gap-3">
            {kids.map((k) => (
              <div key={k.id} className="flex flex-col items-center">
                <NodeInteractive node={k} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const MindMapDiagramView: React.FC<Props> = ({ data, onBack }) => {
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [s, setS] = useState(1);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const panActive = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ active: boolean; startDist: number; startScale: number }>({
    active: false,
    startDist: 0,
    startScale: 1,
  });
  const MOVE_THRESHOLD = 3;

  const getDist = () => {
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPan.current = { x: e.clientX, y: e.clientY };
    panActive.current = false;

    if (pointers.current.size === 2) {
      pinch.current.active = true;
      pinch.current.startDist = getDist();
      pinch.current.startScale = s;
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinch.current.active && pointers.current.size >= 2) {
      const dist = getDist() || 1;
      const factor = dist / (pinch.current.startDist || 1);
      setS(Math.max(0.43, Math.min(2, pinch.current.startScale * factor)));
      return;
    }

    if (pointers.current.size === 1) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      const d = Math.hypot(dx, dy);
      if (!panActive.current && d > MOVE_THRESHOLD) panActive.current = true;
      if (panActive.current) {
        lastPan.current = { x: e.clientX, y: e.clientY };
        setTx((v) => v + dx);
        setTy((v) => v + dy);
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current.active = false;
    if (pointers.current.size === 0) panActive.current = false;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setS((v) => Math.max(0.43, Math.min(2, v * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

  const center = () => {
    setTx(0);
    setTy(0);
    setS(1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-3 justify-start">
        <button onClick={() => setS((v) => Math.max(0.28, Math.min(2, v * 1.1)))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">＋</button>
        <button onClick={() => setS((v) => Math.max(0.28, Math.min(2, v * 0.9)))} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">−</button>
        <button onClick={center} className="bg-gray-700 rounded-lg px-3 py-2 text-sm">Centrar</button>
      </div>

      <div
        className="relative w-full h-[72vh] overflow-hidden rounded-xl border border-gray-700 bg-gray-800/40"
        style={{ touchAction: "none", cursor: "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${s})`,
            transformOrigin: "0 0",
            padding: 12,
          }}
        >
          <NodeInteractive node={data.root} level={0} />
        </div>
      </div>

      {/* FAB Volver */}
      <BackToSummaryFab onClick={onBack} />
    </div>
  );
};

export default MindMapDiagramView;
