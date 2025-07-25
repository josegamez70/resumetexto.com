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
    <p v-if="errorMessage" class="mt-4 text-red-500">{{ errorMessage }}</p> <!-- Para mostrar errores -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Referencias reactivas
const selectedFile = ref<File | null>(null);
const summaryOutput = ref<string>('');
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>(''); // Para mostrar mensajes de error al usuario

// Manejador para cuando el usuario selecciona un archivo
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0];
    errorMessage.value = ''; // Limpiar cualquier error previo al seleccionar nuevo archivo
  }
};

// Función principal para resumir el PDF
const summarizePdf = async () => {
  if (!selectedFile.value) {
    errorMessage.value = "Por favor, selecciona un archivo PDF primero.";
    return;
  }

  isLoading.value = true;
  summaryOutput.value = '';
  errorMessage.value = '';

  let pdfjsLib;
  try {
    // Importación dinámica de pdfjs-dist, SOLO si estamos en el cliente (navegador)
    if (process.client) {
      pdfjsLib = await import('pdfjs-dist/build/pdf');
      // Configura el worker de PDF.js usando un CDN. ¡Esto es CRÍTICO!
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    } else {
      // Si estamos en el servidor durante el build/prerrender, esta parte no se ejecutará si ssr:false
      // Pero es una buena práctica tener un fallback.
      console.warn("PDF.js no está disponible en el servidor durante la construcción/prerenderizado.");
      errorMessage.value = "El procesamiento de PDF requiere un entorno de navegador. Por favor, intente después de que la aplicación se cargue completamente.";
      isLoading.value = false;
      return;
    }
    
    // Verifica si pdfjs-dist se cargó correctamente
    if (!pdfjsLib || !pdfjsLib.getDocument) {
      throw new Error("La librería PDF.js no se pudo cargar o inicializar correctamente.");
    }

    console.log("Iniciando resumen del archivo:", selectedFile.value.name);

    // Lógica para leer el PDF y extraer el texto
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // Carga el documento PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        // Itera sobre cada página para extraer el texto
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          // Une los strings de texto de la página y añade un salto de línea
          fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }

        // ***** AQUÍ ES DONDE LLAMAMOS A TU FUNCIÓN NETLIFY CON EL TEXTO EXTRAÍDO *****
        const response = await fetch('/.netlify/functions/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ textToSummarize: fullText }), // Envía el texto completo del PDF
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Falló la llamada a la función de resumen: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        summaryOutput.value = data.summary; // Muestra el resumen
        errorMessage.value = ''; // Limpia errores si todo fue bien
      } catch (innerError) {
        console.error("Error procesando PDF o llamando a Gemini:", innerError);
        errorMessage.value = "Ocurrió un error al procesar el PDF o al obtener el resumen: " + (innerError as Error).message;
      } finally {
        isLoading.value = false; // Asegura que el estado de carga finaliza
      }
    };

    reader.onerror = (e) => {
      console.error("Error leyendo archivo:", e);
      errorMessage.value = "Error leyendo el archivo PDF: " + (e.target?.error?.message || 'Error desconocido');
      isLoading.value = false;
    };

    reader.readAsArrayBuffer(selectedFile.value); // Inicia la lectura del archivo como ArrayBuffer
                                                // que es el formato que pdfjs-dist necesita.

  } catch (outerError) {
    console.error("Error general en summarizePdf:", outerError);
    errorMessage.value = "Ocurrió un error inesperado: " + (outerError as Error).message;
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Estilos específicos de esta página */
/* Los estilos de .text-gradient se definen en main.css */
</style>