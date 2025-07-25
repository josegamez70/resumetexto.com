// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  devtools: { enabled: true },

  css: [
    '~/assets/css/main.css', // Asegúrate de que tu main.css esté en assets/css/
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      geminiApiKey: process.env.NUXT_PUBLIC_GEMINI_API_KEY,
    }
  },

  nitro: {
    // ¡MUY IMPORTANTE! Esta sección NO debe contener 'preset: "netlify-legacy"'
    // Si la tenía, la hemos quitado para que Nitro autodeteccione el preset 'netlify' correcto.
  },

  modules: [
    // Si instalaste @nuxtjs/tailwindcss, descomenta la siguiente línea:
    // '@nuxtjs/tailwindcss',
  ],
});