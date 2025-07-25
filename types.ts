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

// Interfaz para resúmenes guardados (si decides implementar la funcionalidad de guardar)
export interface SavedSummary {
    id: number;
    fileName: string;
    summary: string;
    type: SummaryType;
    createdAt: string;
}

// Interfaz para una diapositiva de presentación (adaptada a la salida de Gemini)
// Gemini nos devuelve un array de slides, y cada slide tiene un título, emoji y secciones.
export interface Slide {
    title: string;
    emoji?: string; // Emoji opcional para el título
    sections: Array<{
        heading: string; // Título de la sección dentro de la diapositiva
        content: string; // Contenido de la sección
    }>;
    // Si en algún punto Gemini devuelve contenido directo en la slide sin secciones,
    // podrías añadir: content?: string; (pero el prompt actual fuerza secciones)
}

// Tipo para el lenguaje (usado en i18n y llamadas a la API)
export type Language = 'es' | 'en'; // Español e inglés