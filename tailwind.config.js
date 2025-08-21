/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Si tu código estuviera en src
    "./*.{js,jsx,ts,tsx,html}", // Para App.tsx, Index.html, Index.tsx directamente en la raíz
    "./components/**/*.{js,jsx,ts,tsx}", // Para tus componentes
    "./services/**/*.{js,jsx,ts,tsx}" // Para tus servicios si también tuvieran clases
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#F8F9FA', // El color de fondo que usas en App.tsx
        'brand-text': '#212529', // El color de texto principal
        'brand-text-muted': '#6c757d', // El color de texto muted
        // Puedes añadir más colores que uses en tu CSS/Tailwind
      },
      // INICIO: PROPIEDADES AÑADIDAS PARA EL EFECTO 3D DE LAS FLASHCARDS
      perspective: {
        '1000': '1000px', // Define una perspectiva de 1000px
      },
      transformStyle: {
        '3d': 'preserve-3d', // Habilita el estilo de transformación 3D
      },
      backfaceVisibility: {
        'hidden': 'hidden', // Oculta la parte trasera del elemento cuando está rotado
      },
      // Las rotaciones (como rotate-y-180) ya suelen venir con Tailwind 3+.
      // Si no funcionaran, aquí se añadirían explícitamente, pero es raro que sea necesario.
      // transform: {
      //   'rotate-y-180': 'rotateY(180deg)',
      // },
      // FIN: PROPIEDADES AÑADIDAS
    },
  },
  plugins: [],
}