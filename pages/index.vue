<!-- pages/index.vue -->
<template>
  <div class="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
    <!-- El texto "Bienvenido a ResumeTexto.com Esta es mi aplicación Nuxt.js" parece venir de app.vue,
         asegúrate de que en app.vue es sólo <NuxtPage /> y el resto de tu código de bienvenida va aquí. -->
    <h1 class="text-4xl font-bold mb-4 text-gradient">Bienvenido a ResumeTexto.com</h1>
    <p class="text-lg mb-8 text-center max-w-2xl">
      Sube un documento PDF para obtener un resumen conciso y rápido utilizando la inteligencia artificial.
    </p>

    <div class="flex items-center space-x-4">
      <input 
        type="file" 
        accept=".pdf" 
        @change="handleFileUpload"
        class="block w-full text-sm text-gray-500
               file:mr-4 file:py-2 file:px-4
               file:rounded-md file:border-0
               file:text-sm file:font-semibold
               file:bg-brand-primary file:text-white
               hover:file:bg-brand-secondary cursor-pointer"
      />
      <button 
        @click="summarizePdf"
        class="py-2 px-4 bg-brand-primary text-white font-semibold rounded-md
               hover:bg-brand-secondary transition-colors duration-200"
      >
        Resumir PDF
      </button>
    </div>

    <!-- Puedes agregar aquí un indicador de carga, área para mostrar el resumen, etc. -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Accede a la API Key desde las variables de entorno de Nuxt
const config = useRuntimeConfig();
const geminiApiKey = config.public.geminiApiKey;

// Inicializa el modelo Gemini
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const selectedFile = ref<File | null>(null);

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
  }
};

const summarizePdf = async () => {
  if (!selectedFile.value) {
    alert("Por favor, selecciona un archivo PDF primero.");
    return;
  }

  // Aquí iría tu lógica para leer el PDF, extraer el texto y enviarlo a Gemini
  console.log("Iniciando resumen del archivo:", selectedFile.value.name);
  console.log("Usando API Key:", geminiApiKey ? "CONFIGURADA" : "NO CONFIGURADA");

  try {
    // Ejemplo de cómo llamar a la API (necesitarías el texto del PDF aquí)
    const prompt = `Resume el siguiente texto:\n\n${"TEXTO_DEL_PDF_EXTRAIDO_AQUI"}`;
    // const result = await model.generateContent(prompt);
    // const response = await result.response;
    // const text = response.text();
    // console.log("Resumen:", text);

    alert("Lógica de resumen en desarrollo. Archivo seleccionado: " + selectedFile.value.name);

  } catch (error) {
    console.error("Error al intentar resumir:", error);
    alert("Ocurrió un error al intentar resumir el PDF.");
  }
};
</script>

<style scoped>
/* Puedes añadir estilos específicos de esta página aquí */
</style>