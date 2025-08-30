/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx,html}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./services/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Colores que tenías en el script inline de index.html
        'brand-bg': '#1e2029',
        'brand-surface': '#2b2e41',
        'brand-primary': '#8b5cf6', // violet-500
        'brand-secondary': '#6366f1', // indigo-500
        'brand-muted': '#4b5563', // gray-600
        'brand-action': '#22c55e', // green-500
        'brand-text': '#f8f9fa',
        'brand-text-muted': '#adb5bd',
        // Si tenías otros colores en tu tailwind.config.js original que no estaban en el HTML,
        // asegúrate de mantenerlos aquí. Por ejemplo, los que vi en un config previo:
        // 'brand-bg-original': '#F8F9FA', 
        // 'brand-text-original': '#212529',
        // 'brand-text-muted-original': '#6c757d',
      },
      animation: {
        // Animaciones que tenías en el script inline de index.html
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        // Si tenías más animaciones definidas en index.css que no están aquí,
        // también deberías moverlas (el nombre de la animación) aquí para que Tailwind las use.
      },
      keyframes: {
        // Keyframes que tenías en el script inline de index.html
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        // Si tenías otros keyframes definidos en index.css que no están aquí,
        // también deberías moverlos aquí. Por ejemplo:
        // gradientMove: {
        //   '0%': { 'background-position': '0% 50%' },
        //   '50%': { 'background-position': '100% 50%' },
        //   '100%': { 'background-position': '0% 50%' },
        // },
      },
      // PROPIEDADES AÑADIDAS PARA EL EFECTO 3D DE LAS FLASHCARDS
      perspective: {
        '1000': '1000px',
      },
      transformStyle: {
        '3d': 'preserve-3d',
      },
      backfaceVisibility: {
        'hidden': 'hidden',
      },
      // Las rotaciones (como rotate-y-180) ya suelen venir con Tailwind 3+.
      // No necesitas definirlas explícitamente a menos que uses una versión antigua
      // o quieras un comportamiento muy específico.
      // transform: {
      //   'rotate-y-180': 'rotateY(180deg)',
      // },
    },
  },
  plugins: [],
}