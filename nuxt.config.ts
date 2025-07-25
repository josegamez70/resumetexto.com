// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '~/assets/css/main.css',
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    // Asegúrate de que no haya ninguna referencia a NUXT_PUBLIC_GEMINI_API_KEY aquí
    public: {
      // Otras variables públicas que NO son secretos y que necesites en el cliente
    }
  },

  // *** ESTO ES LO CRÍTICO ***
  // Definir explícitamente el preset de Nitro para despliegue
  nitro: {
    preset: 'netlify', // ¡Debe ser 'netlify' para Netlify Functions!
    // Para el warning de compatibilidad, aunque no es el error principal
    prerender: {
      compatibilityDate: '2025-07-25'
    }
  },

  // Si tu proyecto sigue usando `src` internamente o algo en tu `package.json`
  // lo indica, podemos añadir esto para asegurar que Nuxt solo use las carpetas raíz.
  // srcDir: './', // Asegura que la raíz sea el directorio de código fuente

  modules: [
    // '@nuxtjs/tailwindcss',
  ],

  // Renderizado: Si solo es una SPA generada estáticamente, no necesita SSR completo
  // Puedes intentar deshabilitar SSR si es un SPA puro
  // ssr: false, // Deshabilitar SSR si no es absolutamente necesario.
                // Si la deshabilitas, el getDocument de pdfjs-dist no fallará en el servidor.
                // PERO esto cambiará la forma en que se construye tu aplicación.
                // Por ahora, asumamos que SSR está activo o que la generación funciona.
});