<!-- pages/index.vue -->
<template>
  <div class="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
    <!-- Encabezado de la aplicación -->
    <header class="w-full max-w-4xl p-4 flex justify-between items-center mb-8">
      <div class="flex items-center space-x-2">
        <!-- Logo: Un ordenador sencillo como icono (SVG inline) -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-brand-primary border-2 border-red-500 rounded-full p-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm0 2v8h16V8H4zM4 16h16v2H4v-2z"></path>
        </svg>
        <!-- Título de la aplicación -->
        <h1 class="text-4xl font-bold text-gradient border-2 border-red-500 rounded-lg px-2 py-1">Resúmelo!</h1>
      </div>
      <!-- Toggle de idioma -->
      <button @click="toggleLanguage" class="py-1 px-3 rounded-md bg-slate-700 hover:bg-slate-600">
        {{ currentLanguage === 'es' ? 'EN' : 'ES' }}
      </button>
    </header>

    <main class="w-full max-w-4xl p-6 bg-slate-800 rounded-lg shadow-xl flex flex-col items-center">
      <p class="text-lg mb-8 text-center">
        {{ currentPrompts.ui.uploadFilePlaceholder }}
      </p>

      <!-- Área de Carga/Drop de Archivos -->
      <div 
        @dragover.prevent="handleDragOver" 
        @dragleave="handleDragLeave" 
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
        :class="['border-2 border-dashed rounded-lg p-10 text-center cursor-pointer mb-6 w-full',
                 isDragging ? 'border-brand-primary bg-slate-700' : 'border-slate-600 hover:border-slate-500']"
      >
        <input type="file" ref="fileInput" accept=".pdf,image/jpeg,image/png" @change="handleFileUpload" class="hidden"/>
        <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        <p class="mt-1 text-slate-400">{{ currentPrompts.ui.dragAndDropHint }}</p>
        <p class="text-sm text-slate-500">{{ currentPrompts.ui.pdfOrImageHint }}</p>
        <p v-if="selectedFile" class="mt-2 text-slate-300">{{ currentPrompts.ui.selectedFilePrefix }} {{ selectedFile.name }}</p>
      </div>

      <!-- Opciones de Contenido a Generar (Resumen o Presentación) -->
      <div class="mb-6 w-full">
        <label class="block text-lg font-semibold mb-2 text-white">Tipo de Contenido a Generar:</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-slate-700 p-1">
          <button 
            v-for="option in contentOptions" :key="option.value"
            @click="selectedContentOption = option.value"
            :class="['w-full py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary',
                     selectedContentOption === option.value ? 'bg-brand-primary text-white shadow' : 'text-slate-300 hover:bg-slate-600']"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Botón Principal para Generar -->
      <button 
        @click="generateContent"
        :disabled="isLoading || !selectedFile"
        class="w-full flex items-center justify-center py-3 px-8 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isLoading ? currentPrompts.ui.processingMessage : currentPrompts.ui.generateContentBtn }}
      </button>
    </main>

    <!-- Área para mostrar el resumen/presentación -->
    <div v-if="summaryOutput || generatedHtmlContent" class="mt-8 p-6 bg-slate-800 rounded-lg shadow-lg max-w-3xl w-full">
      <h2 class="text-2xl font-semibold mb-4 text-white">{{ currentPrompts.ui.contentGeneratedTitle }}</h2>
      <pre v-if="summaryOutput" class="text-gray-200 whitespace-pre-wrap font-mono">{{ summaryOutput }}</pre>
      
      <!-- Botón de descarga de HTML para presentaciones -->
      <button 
        v-if="generatedHtmlContent" 
        @click="downloadPresentationHtml" 
        class="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
      >
        {{ currentPrompts.ui.downloadHtmlBtn }}
      </button>
    </div>
    
    <p v-if="errorMessage" class="mt-4 text-red-500">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getPrompts } from '../lib/i18n';
import { SummaryType, PresentationStyle } from '../types'; 
import { generateHtmlPresentation } from '../utils/htmlGenerator'; // Importación correcta

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const summaryOutput = ref<string>('');
const isLoading = ref<boolean>(false);
const errorMessage = ref<string>('');
const isDragging = ref<boolean>(false);

const currentLanguage = ref<'es' | 'en'>('es'); 
const currentPrompts = computed(() => getPrompts(currentLanguage.value));

const generatedHtmlContent = ref<string | null>(null);

const contentOptions = computed(() => [
  { label: currentPrompts.value.ui.summaryShortLabel, value: 'summary_short', type: 'summary', summaryType: SummaryType.Short },
  { label: currentPrompts.value.ui.summaryDetailedLabel, value: 'summary_detailed', type: 'summary', summaryType: SummaryType.Long },
  { label: currentPrompts.value.ui.summaryPointsLabel, value: 'summary_points', type: 'summary', summaryType: SummaryType.Bullets },
  { label: currentPrompts.value.ui.presentationExtensiveLabel, value: 'presentation_extensive', type: 'presentation', presentationStyle: PresentationStyle.Extensive },
  { label: currentPrompts.value.ui.presentationInformativeLabel, value: 'presentation_informative', type: 'presentation', presentationStyle: PresentationStyle.Informative },
  { label: currentPrompts.value.ui.presentationForKidsLabel, value: 'presentation_kids', type: 'presentation', presentationStyle: PresentationStyle.ForKids },
]);
const selectedContentOption = ref<'summary_short' | 'summary_detailed' | 'summary_points' | 'presentation_extensive' | 'presentation_informative' | 'presentation_kids'>('summary_short');

const triggerFileInput = () => { fileInput.value?.click(); };
const handleFileUpload = (event: Event | DragEvent) => {
  const files = (event as DragEvent).dataTransfer?.files || (event.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    selectedFile.value = files[0];
    errorMessage.value = '';
    summaryOutput.value = '';
    generatedHtmlContent.value = null;
  }
  isDragging.value = false;
};
const handleDragOver = () => { isDragging.value = true; };
const handleDragLeave = () => { isDragging.value = false; };
const handleDrop = (event: DragEvent) => { handleFileUpload(event); };

const generateContent = async () => {
  if (!selectedFile.value) {
    errorMessage.value = currentPrompts.value.ui.selectFileError;
    return;
  }

  isLoading.value = true;
  summaryOutput.value = '';
  errorMessage.value = '';
  generatedHtmlContent.value = null;

  try {
    let extractedText = '';
    const fileType = selectedFile.value.type;
    
    if (fileType === 'application/pdf') {
      let pdfjsLib;
      if (process.client) {
        pdfjsLib = await import('pdfjs-dist/build/pdf');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      } else {
        throw new Error(currentPrompts.value.ui.pdfJsNotAvailable);
      }

      const reader = new FileReader();
      reader.readAsArrayBuffer(selectedFile.value);
      extractedText = await new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
            }
            resolve(text);
          } catch (innerError) { reject(new Error(currentPrompts.value.ui.pdfJsLoadError + ": " + (innerError as Error).message)); }
        };
        reader.onerror = (e) => reject(new Error(currentPrompts.value.ui.pdfJsLoadError + ": " + (e.target?.error?.message || 'Error desconocido')));
      });

    } 
    else if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile.value);
        const base64Image = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
            reader.onerror = (e) => reject(new Error(currentPrompts.value.ui.fileTypeError + ": " + (e.target?.error?.message || 'Error desconocido')));
        });

        const ocrResponse = await fetch('/.netlify/functions/gemini-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'extractTextFromImage',
                payload: { base64Image: base64Image, language: currentLanguage.value }
            }),
        });
        if (!ocrResponse.ok) {
            const errorData = await ocrResponse.json();
            throw new Error(errorData.error || `${currentPrompts.value.ui.apiCallFailed} (OCR): ${ocrResponse.status} ${ocrResponse.statusText}`);
        }
        const ocrData = await ocrResponse.json();
        extractedText = ocrData.text;
        if (!extractedText) {
            throw new Error(currentPrompts.value.ui.ocrMissingText);
        }

    } 
    else {
      errorMessage.value = currentPrompts.value.ui.fileTypeError;
      isLoading.value = false;
      return;
    }

    const selectedOption = contentOptions.value.find(opt => opt.value === selectedContentOption.value);
    if (!selectedOption) {
        throw new Error(currentPrompts.value.ui.invalidOption);
    }

    let apiOperation: string;
    let apiPayload: any;

    if (selectedOption.type === 'summary') {
        apiOperation = 'generateSummary';
        apiPayload = { 
            text: extractedText, 
            type: selectedOption.summaryType, 
            language: currentLanguage.value 
        };
    } else if (selectedOption.type === 'presentation') {
        apiOperation = 'generatePresentation';
        apiPayload = { 
            summary: extractedText,
            style: selectedOption.presentationStyle, 
            language: currentLanguage.value 
        };
    } else {
        throw new Error(currentPrompts.value.ui.invalidOption);
    }

    const apiResponse = await fetch('/.netlify/functions/gemini-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation: apiOperation, payload: apiPayload }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.error || `${currentPrompts.value.ui.apiCallFailed}: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const resultData = await apiResponse.json();

    if (selectedOption.type === 'summary') {
      summaryOutput.value = resultData.summary;
    } else if (selectedOption.type === 'presentation') {
      if (resultData.slides && Array.isArray(resultData.slides)) {
        summaryOutput.value = JSON.stringify(resultData.slides, null, 2);
        generatedHtmlContent.value = generateHtmlPresentation(resultData.slides, selectedOption.presentationStyle as PresentationStyle, currentLanguage.value);
      } else {
        throw new Error(currentPrompts.value.ui.invalidSlidesFormat);
      }
    }

    errorMessage.value = '';
    alert(currentPrompts.value.ui.contentGeneratedTitle);

  } catch (outerError) {
    console.error("Error general al generar contenido:", outerError);
    errorMessage.value = `${currentPrompts.value.ui.apiCallFailed}: ${(outerError as Error).message}`;
  } finally {
    isLoading.value = false;
  }
};

// --- Lógica para la Internacionalización ---
const toggleLanguage = () => {
  currentLanguage.value = currentLanguage.value === 'es' ? 'en' : 'es';
};

// Lógica de descarga de la presentación HTML
const downloadPresentationHtml = () => {
    if (!generatedHtmlContent.value) {
        errorMessage.value = currentPrompts.value.ui.downloadNoContent;
        return;
    }
    const blob = new Blob([generatedHtmlContent.value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumenlo_presentacion_${selectedFile.value?.name.replace(/\.[^/.]+$/, "") || 'document'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
</script>

<style scoped>
/* Estilos específicos de esta página */
.text-gradient {
    background-image: linear-gradient(45deg, #00A9FF, #A0E9FF); 
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
}
.border-red-500 {
    border-color: #EF4444;
}
</style>