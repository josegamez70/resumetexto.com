// Estados de navegación de la app
export enum ViewState {
  UPLOADER = "UPLOADER",
  SUMMARY = "SUMMARY",
  PRESENTATION = "PRESENTATION",
  MINDMAP = "MINDMAP",
  FLASHCARDS = "FLASHCARDS",
}

// Tipos de resumen
export enum SummaryType {
  Basic = "basic",
  Detailed = "detailed",
  Bullet = "bullet",
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

// Selector de modo del mapa mental
// NOTA: mantenemos los nombres que tu app ya usa en el código
export enum MindMapColorMode {
  BlancoNegro = "classic", // “Clásico” (diagrama interactivo)
  Color       = "detail",  // “Más detalle” (tarjetas con nota)
}

// Flashcards
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  // compatibilidad si en alguna parte se usa question/answer
  question?: string;
  answer?: string;
}
