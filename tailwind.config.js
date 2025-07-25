// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './Error.vue',
    './nuxt.config.{js,ts,mjs}',
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