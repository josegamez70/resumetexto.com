// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  devtools: { enabled: true },

  // *** CAMBIO CLAVE AQUÍ: Desactivar SSR para forzar una SPA ***
  ssr: false, // Esto hará que Nuxt construya una Single Page Application.
              // Todo el HTML se generará en el navegador, no en el servidor.

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
    public: {
      // Si tienes otras variables públicas NO secretas aquí, déjalas
    }
  },

  nitro: {
    preset: 'netlify', // Mantén 'netlify' aquí para que tus funciones sigan desplegándose
    // Ya no necesitas `prerender.compatibilityDate` si `ssr` es `false`
    // prerender: {
    //   compatibilityDate: '2025-07-25'
    // }
  },

  modules: [
    // '@nuxtjs/tailwindcss',
  ],

  // Si deshabilitas SSR, la sección `generate` ya no es relevante en el mismo sentido
  // generate: {
  //   routes: ['/'],
  // }
});