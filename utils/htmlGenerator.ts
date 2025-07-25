// utils/htmlGenerator.ts
// Este archivo contendrá la lógica para generar el HTML de la presentación.

import type { Slide, PresentationStyle, Language } from '../types'; // Ajusta la ruta si types.ts no está en la raíz
import { getPrompts } from '../lib/i18n'; // Ajusta la ruta si lib/i18n.ts no está en la raíz/lib

export function generateHtmlPresentation(slides: Slide[], style: PresentationStyle, currentLanguage: Language): string {
    const currentPrompts = getPrompts(currentLanguage); // Obtiene los prompts para el idioma actual

    // Plantilla base del HTML de la presentación
    let htmlContent = `
        <!DOCTYPE html>
        <html lang="${currentLanguage}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Presentación Resúmelo! (${style})</title>
            <style>
                body { font-family: sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
                .slide { background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; padding: 20px; }
                .slide h2 { color: #00A9FF; margin-top: 0; }
                .slide ul { list-style: none; padding: 0; }
                .collapsible { cursor: pointer; background-color: #eee; padding: 10px; border-radius: 5px; margin-top: 10px; }
                .collapsible:hover { background-color: #ddd; }
                .content { padding: 0 18px; display: none; overflow: hidden; background-color: #f1f1f1; }
                .content.active { display: block; }
                .emoji { font-size: 1.2em; vertical-align: middle; }
            </style>
        </head>
        <body>
            <h1>${currentPrompts.ui.contentGeneratedTitle} (${style})</h1>
    `;

    // Itera sobre cada diapositiva para construir su HTML
    slides.forEach((slide, index) => {
        htmlContent += `
            <div class="slide">
                <h2>${slide.title || `Diapositiva ${index + 1}`} <span class="emoji">${slide.emoji || ''}</span></h2>
        `;
        // Itera sobre las secciones de cada diapositiva (todas las slides de Gemini tienen 'sections')
        if (slide.sections && slide.sections.length > 0) {
            slide.sections.forEach((section) => {
                htmlContent += `
                    <div class="collapsible" onclick="this.nextElementSibling.classList.toggle('active'); this.classList.toggle('active')">
                        ${section.heading}
                    </div>
                    <div class="content">
                        <p>${section.content}</p>
                    </div>
                `;
            });
        }
        htmlContent += `</div>`; // Cierre de la diapositiva
    });

    // Añade el script JavaScript para los desplegables y cierra el HTML
    htmlContent += `
            <script>
                // JavaScript para la funcionalidad de desplegables
                var coll = document.getElementsByClassName("collapsible");
                var i;
                for (i = 0; i < coll.length; i++) {
                    coll[i].addEventListener("click", function() {
                        this.classList.toggle("active");
                        var content = this.nextElementSibling;
                        if (content.style.display === "block") {
                            content.style.display = "none";
                        } else {
                            content.style.display = "block";
                        }
                    });
                }
            </script>
        </body>
        </html>
    `;
    return htmlContent;
}