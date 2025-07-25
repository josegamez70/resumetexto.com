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

// Inicializa el modelo Gemini (esto está bien, puede ser SSR)
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

  // **** CAMBIO CLAVE AQUÍ: Importación dinámica de pdfjs-dist ****
  let pdfjsLib;
  if (process.client) { // Solo si estamos en el cliente (navegador)
    pdfjsLib = await import('pdfjs-dist/build/pdf'); // Ruta recomendada para la importación
    // Puedes necesitar configurar el worker si no usas el CDN por defecto
    // pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  } else {
    // Si estamos en el servidor durante el build/prerrender, no podemos procesar PDFs.
    console.warn("PDF.js no está disponible en el servidor durante la construcción.");
    alert("El procesamiento de PDF requiere un entorno de navegador. Por favor, intente después de que la aplicación se cargue completamente.");
    return;
  }
  // **** FIN DEL CAMBIO CLAVE ****

  // Asegúrate de que pdfjsLib y su método getDocument estén disponibles
  if (!pdfjsLib || !pdfjsLib.getDocument) {
    console.error("Error: pdfjs-dist no se pudo cargar correctamente.");
    alert("Hubo un problema al inicializar la librería de PDF.");
    return;
  }

  console.log("Iniciando resumen del archivo:", selectedFile.value.name);
  console.log("Usando API Key:", geminiApiKey ? "CONFIGURADA" : "NO CONFIGURADA");

  try {
    // Aquí iría tu lógica para leer el PDF, extraer el texto y enviarlo a Gemini
    // Ejemplo de cómo usar pdfjs-dist para cargar un PDF (esto es solo un esqueleto)
    // const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(selectedFile.value));
    // const pdf = await loadingTask.promise;
    // let fullText = '';
    // for (let i = 1; i <= pdf.numPages; i++) {
    //   const page = await pdf.getPage(i);
    //   const textContent = await page.getTextContent();
    //   fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    // }

    const prompt = `Resume el siguiente texto:\n\n${"TEXTO_DEL_PDF_EXTRAIDO_AQUI"}`; // <--- ¡Asegúrate de reemplazar esto con el texto real del PDF!
    // const result = await model.generateContent(prompt);
    // const response = await result.response;
    // const text = response.text();
    // console.log("Resumen:", text);

    alert("Lógica de resumen en desarrollo. Archivo seleccionado: " + selectedFile.value.name);

  } catch (error) {
    console.error("Error al intentar resumir:", error);
    alert("Ocurrió un error al intentar resumir el PDF: " + (error as Error).message);
  }
};
</script>

<style scoped>
/* Puedes añadir estilos específicos de esta página aquí */
</style>