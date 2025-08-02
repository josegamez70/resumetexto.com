export enum SummaryType {
    Short = 'Short',       // Resumen corto
    Medium = 'Medium',     // Resumen medio
    Long = 'Long',         // Resumen largo
    Bullets = 'Bullets',   // Resumen por puntos
}

export enum PresentationType {
    Extensive = 'Extensive',   // Extensa (en detalle)
    Complete = 'Complete',     // Completa (50% más contenido y detalle que Extensa)
    Kids = 'Kids',             // Para Niños
}

export type PresentationSection = {
    emoji: string;
    title: string;
    content: string;
    subsections?: PresentationSection[]; // Para soportar subniveles en presentaciones extensas
};

export type PresentationData = {
    title: string;
    sections: PresentationSection[];
};

export enum ViewState {
    UPLOADER,
    SUMMARY,
    PRESENTATION,
}
