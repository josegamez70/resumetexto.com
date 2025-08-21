// types.ts

export enum SummaryType {
  Short = "Short",
  Medium = "Medium",
  Long = "Long",
  Bullets = "Bullets",
}

export enum PresentationType {
  Extensive = 'Extensive',   // Extensa (en detalle)
  Complete  = 'Complete',    // Completa (50% más contenido y detalle que Extensa)
  Kids      = 'Kids',        // Para Niños
}

export type PresentationSection = {
  emoji: string;
  title: string;
  content: string;
  subsections?: PresentationSection[]; // recursivo
};

export type PresentationData = {
  title: string;
  sections: PresentationSection[];
};

export type MindMapNode = {
  id: string;
  label: string;
  note?: string;
  children?: MindMapNode[];
};

export type MindMapData = {
  root: MindMapNode;
};

export enum MindMapColorMode {
  BlancoNegro = "bw",
  Color = "color",
}

// (dejamos ViewState igual)
export enum ViewState {
  UPLOADER,
  SUMMARY,
  PRESENTATION,
  MINDMAP,
  FLASHCARDS, // <-- ¡NUEVO! Añadimos el estado para las flashcards
}

// <-- ¡NUEVO TIPO! Para las flashcards -->
export interface Flashcard {
  id: string; // Identificador único para cada tarjeta
  question: string;
  answer: string;
}