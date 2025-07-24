<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Bienvenido a ResumeTexto.com</h1>
    <p class="mb-4">Sube un documento PDF para obtener un resumen.</p>
    <!-- Aquí iría tu formulario para subir el PDF -->
    <input type="file" accept=".pdf" @change="handleFileUpload">
    <button @click="summarizePdf">Resumir PDF</button>
  </div>
</template>

<script setup>
import { GoogleGenerativeAI } from "@google/generative-ai";

const config = useRuntimeConfig();
const genAI = new GoogleGenerativeAI(config.public.geminiApiKey); // <- Aquí se usa la API Key
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// ... el resto de tu lógica para manejar PDFs y resúmenes ...
async function summarizePdf() {
  // ... tu código de resumen ...
  console.log("Intentando resumir con la API Key:", config.public.geminiApiKey);
}
</script>