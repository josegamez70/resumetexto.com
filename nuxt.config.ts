// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  // Desactiva o activa las herramientas de desarrollo de Nuxt.
  // Son útiles en desarrollo local.
  devtools: { enabled: true },

  // Configuración de CSS global.
  // Aquí puedes incluir tu archivo CSS principal (por ejemplo, para TailwindCSS).
  css: [
    '~/assets/css/main.css', // Asegúrate de que este archivo exista si lo usas
  ],

  // Configuración de PostCSS, necesaria para TailwindCSS y Autoprefixer.
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  // Configuración de tiempo de ejecución (runtimeConfig) para variables de entorno.
  // Esto expone la API Key de Gemini a tu aplicación (tanto en el servidor como en el cliente).
  runtimeConfig: {
    // Variables que solo estarán disponibles en el servidor
    // (Útil para secretos que no deben llegar al navegador)
    // apiSecret: process.env.NUXT_API_SECRET,
    
    // Variables que estarán disponibles en el cliente (navegador) y el servidor
    public: {
      geminiApiKey: process.env.NUXT_PUBLIC_GEMINI_API_KEY, // Asegúrate de que esta variable esté en Netlify
    }
  },

  // Configuración de Nitro (el motor de servidor de Nuxt).
  // ¡Aquí está el cambio clave!
  nitro: {
    // Hemos eliminado la línea 'preset: "netlify-legacy"'.
    // Nuxt/Nitro detectará automáticamente el preset 'netlify'
    // cuando se despliegue en Netlify.
    // Si quisieras ser explícito (aunque no es necesario), podrías poner:
    // preset: 'netlify',
  },

  // Módulos de Nuxt. Si usas @nuxtjs/tailwindcss, debería ir aquí.
  // Si no tienes módulos adicionales configurados, esta sección puede estar vacía.
  modules: [
    // '@nuxtjs/tailwindcss', // Descomenta si instalaste este módulo para Tailwind
  ],

  // Configuración adicional para el renderizado (SSR, SPA).
  // Puedes dejarlo en el valor predeterminado si no tienes necesidades específicas.
  // ssr: true, // Habilitar Server-Side Rendering (por defecto en Nuxt 3)
});