// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Rutas para que Tailwind escanee tus clases en archivos Nuxt/Vue
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue', // Tu archivo principal de la aplicación Nuxt
    './Error.vue', // La página de error de Nuxt
    './nuxt.config.{js,ts,mjs}', // Para escanear clases usadas en la configuración
  ],
  theme: {
    extend: {
      // Tus colores personalizados
      colors: {
        'brand-primary': '#00A9FF',
        'brand-secondary': '#A0E9FF',
        'brand-dark': '#00224D',
        'brand-light': '#CDF5FD',
      },
      // Tus fuentes personalizadas
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        brand: ['Fredoka', 'cursive'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [
    // Plugin de tipografía de Tailwind CSS
    require('@tailwindcss/typography'),
  ],
}