<!-- pages/index.vue -->
<template>
  <div class="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
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
        :disabled="isLoading"
        class="py-2 px-4 bg-brand-primary text-white font-semibold rounded-md
               hover:bg-brand-secondary transition-colors duration-200"
      >
        {{ isLoading ? 'Resumiendo...' : 'Resumir PDF' }}
      </button>
    </div>

    <!-- Área para mostrar el resumen -->
    <div v-if="summaryOutput" class="mt-8 p-6 bg-slate-800 rounded-lg shadow-lg max-w-3xl w-full">
      <h2 class="text-2xl font-semibold mb-4 text-white">Resumen:</h2>
      <p class="text-gray-200 whitespace-pre-wrap">{{ summaryOutput }}</p>
    </div>
    <p v-if="isLoading" class="mt-4 text-gray-400">Procesando el documento...</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const selectedFile = ref<File | null>(null);
const summaryOutput = ref<string>('');
const isLoading = ref<boolean>(false);

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

  isLoading.value = true;
  summaryOutput.value = '';

  let pdfjsLib;
  if (process.client) {
    pdfjsLib = await import('pdfjs-dist/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  } else {
    console.warn("PDF.js no está disponible en el servidor durante la construcción.");
    alert("El procesamiento de PDF requiere un entorno de navegador.");
    isLoading.value = false;
    return;
  }
  
  if (!pdfjsLib || !pdfjsLib.getDocument) {
    console.error("Error: pdfjs-dist no se pudo cargar correctamente.");
    alert("Hubo un problema al inicializar la librería de PDF.");
    isLoading.value = false;
    return;
  }

  console.log("Iniciando resumen del archivo:", selectedFile.value.name);

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }

      const response = await fetch('/.netlify/functions/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textToSummarize: fullText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falló la llamada a la función de resumen.');
      }

      const data = await response.json();
      summaryOutput.value = data.summary;
      alert("¡Resumen listo!");
    };
    reader.onerror = (e) => {
      console.error("Error leyendo archivo:", e);
      alert("Error leyendo el archivo PDF.");
    };
    reader.readAsArrayBuffer(selectedFile.value);
  } catch (error) {
    console.error("Error al intentar resumir:", error);
    alert("Ocurrió un error al intentar resumir el PDF: " + (error as Error).message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Estilos específicos de esta página */
</style>