<!-- app.vue -->
<template>
  <div>
    <!-- Esto renderiza la página activa desde la carpeta `pages/` -->
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
/* El main.css se encargará de Tailwind y estilos de body */
</style>