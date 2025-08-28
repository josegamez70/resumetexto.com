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
export enum PresentationType {
  Extensive = "extensive", // en detalle
  Complete  = "complete",  // +50% detalle
  Kids      = "kids",      // para niños
}

// Estructura de la presentación
export interface PresentationSection {
  id: string;
  title: string;
  emoji?: string;
  bullets?: string[];
  children?: PresentationSection[];
}

export interface PresentationData {
  title: string;                 // requerido
  type: PresentationType;
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
  question?: string;
  answer?: string;
}
