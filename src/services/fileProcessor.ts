
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ProcessedFile {
    text: string;
    base64: string | null;
}

export const processFile = async (file: File): Promise<ProcessedFile> => {
    if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        return { text, base64: null };
    } else if (file.type.startsWith('image/')) {
        const base64 = await convertImageToBase64(file);
        return { text: '', base64 };
    } else {
        throw new Error('Unsupported file type. Please upload a PDF or an image.');
    }
};

const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
    }

    return fullText;
};

const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // remove data:image/jpeg;base64, prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};
