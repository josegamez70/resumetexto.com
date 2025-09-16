// src/types.ts

// -----------------------------
// Estados de la app
// -----------------------------
export enum ViewState {
  UPLOADER = "UPLOADER",
  SUMMARY = "SUMMARY",
  PRESENTATION = "PRESENTATION",
  MINDMAP = "MINDMAP",
  FLASHCARDS = "FLASHCARDS",
}

// -----------------------------
// Tipos de resumen (con alias)
// -----------------------------
export enum SummaryType {
  Short    = "short",
  Basic    = "short",     // alias
  Medium   = "medium",
  Detailed = "detailed",
  Long     = "detailed",  // alias
  Bullet   = "bullet",
  Bulleted = "bullet",    // alias
  Bullets  = "bullet",    // alias (plural)
}

// -------------------------------------------
// Tipos de presentación / mapa conceptual
// ⚠️ Usar Mayúscula inicial para alinear
//    con present.js (backend)
// -------------------------------------------
export enum PresentationType {
  Extensive = "Extensive", // en detalle
  Complete  = "Complete",  // +50% detalle (5–6 frases, más ramas)
  Integro   = "Integro",   // muy completo, > Complete (máximo alcance)
  Kids      = "Kids",      // para niños (lenguaje sencillo + emojis)
}

// -------------------------------------------------
// Estructuras del Mapa conceptual (Presentación)
// -------------------------------------------------
export interface PresentationSection {
  id: string;
  title: string;
  emoji?: string;

  // Contenido del bloque
  content?: string;

  // Puntos/ideas (si en algún flujo se usan bullets)
  bullets?: string[];

  // Subniveles (acepta ambos alias)
  children?: PresentationSection[];
  subsections?: PresentationSection[];
}

export interface PresentationData {
  title: string;                 // obligatorio
  type?: PresentationType;       // opcional (algunos generadores no lo devuelven)
  sections: PresentationSection[];
}

// -----------------------------
// Mapa mental
// -----------------------------
export interface MindMapNode {
  id: string;
  label: string;
  note?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  root: MindMapNode;
}

// -----------------------------
// Modo del mapa mental (UI)
// -----------------------------
export enum MindMapColorMode {
  BlancoNegro = "classic", // “Clásico”
  Color       = "detail",  // “Más detalle”
}

// -----------------------------
// Flashcards
// -----------------------------
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  // alias opcionales (compatibilidad)
  question?: string;
  answer?: string;
}
