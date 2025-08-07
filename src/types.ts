export enum ViewState {
  UPLOADER,
  SUMMARY,
  PRESENTATION,
  MINDMAP, // ✅ añadido para el mapa mental
}

export enum SummaryType {
  Short = "short",
  Long = "long",
  Bullets = "bullets",
}

export enum PresentationType {
  Extensive = "extensive",
  Complete = "complete",
  Kids = "kids",
}

export interface PresentationData {
  title: string;
  sections: PresentationSection[];
}

export interface PresentationSection {
  emoji: string;
  title: string;
  content?: string;
  subsections?: PresentationSection[];
}
