
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
