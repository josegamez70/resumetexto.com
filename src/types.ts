// src/types.ts
export enum SummaryType {
  Short = "Short",
  Medium = "Medium",
  Long = "Long",
  Bullets = "Bullets",
}

export enum PresentationType {
  Extensive = "Extensive",
  Complete = "Complete",
  Kids = "Kids",
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

// ---------- MindMap ----------
export type MindMapNode = {
  id: string;
  label: string;
  note?: string;
  children?: MindMapNode[];
};

export type MindMapData = {
  root: MindMapNode;
};

export enum ViewState {
  UPLOADER,
  SUMMARY,
  PRESENTATION,
  MINDMAP, // <-- nuevo estado
}
