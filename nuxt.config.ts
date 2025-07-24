// nuxt.config.ts
export default defineNuxtConfig({
  // ... otras configuraciones ...

  runtimeConfig: {
    // Variables que solo estarán disponibles en el servidor (para código backend)
    // Ejemplo: secretApiToken: process.env.NUXT_SECRET_API_TOKEN,
    public: {
      // Variables que estarán disponibles en el cliente (navegador) y el servidor
      geminiApiKey: process.env.NUXT_PUBLIC_GEMINI_API_KEY, // Asegúrate de que el nombre coincida con el de Netlify
    }
  },

  // ... el resto de tu configuración ...
})