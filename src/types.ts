// src/types.ts

// Estados de la app
export enum ViewState {
  UPLOADER = "UPLOADER",
  SUMMARY = "SUMMARY",
  PRESENTATION = "PRESENTATION",
  MINDMAP = "MINDMAP",
  FLASHCARDS = "FLASHCARDS",
}

// Tipos de resumen (con alias para compatibilidad)
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

// Tipos de presentación / mapa conceptual
// ⚠️ Importante: usar mayúscula inicial para alinear con present.js
export enum PresentationType {
  Extensive = "Extensive", // en detalle
  Complete  = "Complete",  // +50% detalle (ahora 5–6 frases, más ramas)
  Integro   = "Integro",   // muy completo, mayor alcance que "Complete"
  Kids      = "Kids",      // para niños
}

// Estructura de la presentación
export interface PresentationSection {
  id: string;
  title: string;
  emoji?: string;

  // Contenido de bloque (algunos sitios lo llaman `content`)
  content?: string;

  // Puntos/ideas del bloque
  bullets?: string[];

  // Subniveles (alias para compatibilidad: `children` y `subsections`)
  children?: PresentationSection[];
  subsections?: PresentationSection[];
}

export interface PresentationData {
  title: string;                 // requerido
  type?: PresentationType;       // opcional (algunos generadores no lo devuelven)
  sections: PresentationSection[];
}

// Mapa mental
export interface MindMapNode {
  id: string;
  label: string;
  note?: string;
  children?: MindMapNode[];
}

export interface MindMapData {
  root: MindMapNode;
}

// Modo del mapa mental
export enum MindMapColorMode {
  BlancoNegro = "classic", // “Clásico”
  Color       = "detail",  // “Más detalle”
}

// Flashcards
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  question?: string; // alias
  answer?: string;   // alias
}
