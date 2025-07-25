<!-- app.vue -->
<template>
  <div>
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
})
</script>

<style>
/* Estilos globales que afecten a toda la aplicación, si los hay */
/* Asegúrate de que tu `main.css` se encarga de Tailwind */
</style>