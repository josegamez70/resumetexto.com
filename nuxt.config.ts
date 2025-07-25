// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  // Habilita las herramientas de desarrollo de Nuxt (útil en desarrollo local)
  devtools: { enabled: true },

  // Incluye tu CSS global
  css: [
    '~/assets/css/main.css',
  ],

  // Configuración de PostCSS para Tailwind CSS y Autoprefixer
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // Configuración de tiempo de ejecución (runtimeConfig)
  // ¡IMPORTANTE! Aquí ya NO se expone la API Key de Gemini al cliente
  runtimeConfig: {
    // Si tienes otras variables públicas NO secretas para el cliente, puedes ponerlas aquí
    public: {
      // Por ejemplo: myPublicApiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
    }
  },

  // Configuración de Nitro (el motor de servidor de Nuxt)
  nitro: {
    // Establece el preset para despliegue en Netlify
    preset: 'netlify', 
    // Añade la compatibilidad para Nitro, como sugiere el warning ocasional
    prerender: {
      compatibilityDate: '2025-07-25' // Usa la fecha actual o una futura cercana.
    }
  },

  // Módulos de Nuxt (si usas @nuxtjs/tailwindcss, descomenta la línea)
  modules: [
    // '@nuxtjs/tailwindcss', 
  ],

  // Puedes añadir esto si solo tienes una página principal para generar estáticamente
  // generate: {
  //   routes: ['/'], 
  // }
});