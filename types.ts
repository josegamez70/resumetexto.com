// types.ts
// Definiciones de tipos para tu aplicación Resúmelo!

// Tipos para los prompts de resumen
export enum SummaryType {
    Short = 'short',
    Long = 'long',    // Coincide con tu original 'Long'
    Bullets = 'bullets', // Coincide con tu original 'Bullets'
}

// Tipos para los estilos de presentación
export enum PresentationStyle {
    Extensive = 'extensive',    // Coincide con tu original 'Extensive'
    Informative = 'informative', // Coincide con tu original 'Informative'
    ForKids = 'for-kids',      // Coincide con tu original 'ForKids'
}

// Interfaz para resúmenes guardados (de tu original `src/types.ts`)
export interface SavedSummary {
    id: number;
    fileName: string;
    summary: string;
    type: SummaryType;
    createdAt: string;
}

// Interfaz para una diapositiva de presentación (adaptada a la salida de Gemini y a la generación de HTML)
// Hemos añadido 'emoji' y 'sections' en lugar de 'interactiveContent' para que sea compatible con el prompt de Gemini que genera el JSON.
export interface Slide {
    title: string;
    emoji?: string; // Opcional: para el impacto visual
    sections: Array<{
        heading: string;
        content: string;
    }>;
}

// Tipo para el lenguaje (usado en i18n y llamadas a la API)
export type Language = 'es' | 'en'; // Asumimos español e inglés por ahora