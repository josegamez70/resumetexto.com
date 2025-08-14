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
  subsections?: PresentationSection[];
};

export type PresentationData = {
  title: string;
  sections: PresentationSection[];
};

// --- MindMap ---
export type MindMapNode = {
  id: string;
  label: string;
  note?: string;
  children?: MindMapNode[];
};

export type MindMapData = {
  root: MindMapNode;
};

export enum MindMapMode {
  Resumido = "resumido",
  Extendido = "extendido",
}

export enum ViewState {
  UPLOADER,
  SUMMARY,
  PRESENTATION, // "Mapa conceptual"
  MINDMAP,      // "Mapa mental"
}
