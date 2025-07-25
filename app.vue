<!-- app.vue -->
<template>
  <div>
    <!-- Renderiza la página actual basada en el sistema de enrutamiento de Nuxt (carpeta pages/) -->
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
// Configuración global del encabezado (título de la pestaña del navegador, metadatos)
useHead({
  title: 'ResumeTexto.com',
  meta: [
    { name: 'description', content: 'Tu aplicación para resumir documentos PDF con IA.' }
  ],
  link: [
    // Si usas fuentes personalizadas, puedes importarlas aquí.
    // Ejemplo: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap' }
  ]
})
</script>

<style>
/* Aquí puedes poner estilos globales que afecten a toda la aplicación */
/* Asegúrate de que tu `main.css` se encargue de Tailwind */
</style>