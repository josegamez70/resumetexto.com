
export enum SummaryType {
    Short = 'short',
    Long = 'long',
    Bullets = 'bullets',
}

export enum PresentationStyle {
    Extensive = 'extensive',
    Informative = 'informative',
    ForKids = 'for-kids',
}

export interface SavedSummary {
    id: number;
    fileName: string;
    summary: string;
    type: SummaryType;
    createdAt: string;
}

export interface Slide {
    title: string;
    interactiveContent: {
        summary: string;
        details: string;
    }[];
}
