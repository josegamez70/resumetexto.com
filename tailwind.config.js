
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = { // CAMBIO: Usamos CommonJS (module.exports) en lugar de export default
  content: [
    // CAMBIO: Rutas actualizadas para la estructura de carpetas de Nuxt
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}', // Si usas composables
    './plugins/**/*.{js,ts}',
    './app.vue', // El archivo principal de tu aplicación Nuxt
    './Error.vue', // La página de error de Nuxt (si la usas o modificas)
    './nuxt.config.{js,ts,mjs}', // Para escanear clases usadas directamente en la configuración
    // './public/**/*.html', // Si tienes archivos HTML estáticos en la carpeta public
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#00A9FF',
        'brand-secondary': '#A0E9FF',
        'brand-dark': '#00224D',
        'brand-light': '#CDF5FD',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        brand: ['Fredoka', 'cursive'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}