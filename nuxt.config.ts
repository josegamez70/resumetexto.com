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
    // Elimina 'public' si solo tenías geminiApiKey aquí
    // O deja 'public' si tienes otras variables públicas que NO son secretas
    // public: {
    //   geminiApiKey: process.env.NUXT_PUBLIC_GEMINI_API_KEY, // <-- ¡ELIMINA ESTA LÍNEA!
    // }
  },

  nitro: {
    preset: 'netlify', // Puedes usar 'netlify' o 'static'. 'netlify' es mejor si usas Netlify Functions.
    // Si quieres probar las funciones localmente con `npm run dev`
    dev: {
      // proxy: {
      //   '/.netlify/functions/': { target: 'http://localhost:9000/.netlify/functions/', changeOrigin: true }
      // }
    }
  },

  modules: [
    // '@nuxtjs/tailwindcss',
  ],
});