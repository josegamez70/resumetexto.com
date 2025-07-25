<!-- pages/index.vue -->
<template>
  <!-- ... (tu template se mantiene igual) ... -->
</template>

<script setup lang="ts">
import { ref } from 'vue';
// const { GoogleGenerativeAI } = await import("@google/generative-ai"); // <-- ¡ELIMINA ESTA LÍNEA!

// Accede a la API Key (ya no la necesitamos directamente aquí para Gemini)
// const config = useRuntimeConfig();
// const geminiApiKey = config.public.geminiApiKey; // <-- ¡YA NO SE USA DIRECTAMENTE AQUÍ!

// Inicializa el modelo Gemini (¡ELIMINA ESTO DE AQUÍ!)
// const genAI = new GoogleGenerativeAI(geminiApiKey);
// const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const selectedFile = ref<File | null>(null);
const summaryOutput = ref<string>(''); // Para mostrar el resumen
const isLoading = ref<boolean>(false); // Para mostrar un spinner

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

  // **** Importación dinámica de pdfjs-dist (se mantiene como estaba) ****
  let pdfjsLib;
  if (process.client) {
    pdfjsLib = await import('pdfjs-dist/build/pdf');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`; // Usar un CDN
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
    // Lógica para leer el PDF y extraer texto
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }

      // **** CAMBIO CLAVE: Llamar a la función Netlify ****
      const response = await fetch('/.netlify/functions/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textToSummarize: fullText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fallo la llamada a la función de resumen.');
      }

      const data = await response.json();
      summaryOutput.value = data.summary;
      alert("¡Resumen listo!");
    };
    reader.onerror = (e) => {
      console.error("Error leyendo archivo:", e);
      alert("Error leyendo el archivo PDF.");
    };
    reader.readAsArrayBuffer(selectedFile.value); // Lee el archivo como ArrayBuffer
  } catch (error) {
    console.error("Error al intentar resumir:", error);
    alert("Ocurrió un error al intentar resumir el PDF: " + (error as Error).message);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Puedes añadir estilos específicos de esta página aquí */
</style>