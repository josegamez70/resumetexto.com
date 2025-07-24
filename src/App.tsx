
import React, { useState, useCallback } from 'react';
import { SummaryType, PresentationStyle, SavedSummary, Slide } from './types';
import { getTextFromImage, generateSummary, generatePresentation } from './services/geminiService';
import { processFile } from './services/fileProcessor';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useLanguage } from './context/LanguageContext';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SummaryControls from './components/SummaryControls';
import SummaryOutput from './components/SummaryOutput';
import SavedSummaries from './components/SavedSummaries';
import PresentationGenerator from './components/PresentationGenerator';
import PresentationModal from './components/PresentationModal';
import { LoadingSpinner, AlertTriangle, CheckCircle } from './components/Icons';

const App: React.FC = () => {
    const { language, t } = useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [summary, setSummary] = useState<string>('');
    const [summaryType, setSummaryType] = useState<SummaryType>(SummaryType.Short);
    
    const [savedSummaries, setSavedSummaries] = useLocalStorage<SavedSummary[]>('savedSummaries', []);

    const [presentationStyle, setPresentationStyle] = useState<PresentationStyle>(PresentationStyle.Extensive);
    const [presentationHtml, setPresentationHtml] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [error, setError] = useState<string>('');

    const handleFileChange = useCallback(async (selectedFile: File) => {
        if (!selectedFile) return;
        setIsLoading(t.loadingProcessFile);
        setError('');
        setSummary('');
        setExtractedText('');
        setFile(selectedFile);

        try {
            const { text, base64 } = await processFile(selectedFile);
            if (base64) {
                 setIsLoading(t.loadingExtractText);
                 const imageText = await getTextFromImage(base64, language);
                 setExtractedText(imageText);
            } else {
                setExtractedText(text);
            }
        } catch (err) {
            setError(err instanceof Error ? t.errorFileProcess(err.message) : t.errorUnknown);
        } finally {
            setIsLoading(null);
        }
    }, [language, t]);
    
    const handleSummarize = useCallback(async () => {
        if (!extractedText) {
            setError(t.errorNoText);
            return;
        }
        setIsLoading(t.loadingSummary);
        setError('');
        setSummary('');

        try {
            const result = await generateSummary(extractedText, summaryType, language);
            setSummary(result);
        } catch (err) {
            setError(err instanceof Error ? t.errorSummarization(err.message) : t.errorUnknown);
        } finally {
            setIsLoading(null);
        }
    }, [extractedText, summaryType, language, t]);

    const createPresentationHtml = useCallback((slides: Slide[], style: PresentationStyle, fileName?: string): string => {
        const accordionCss = (plusColor: string, summaryColor: string, summaryHoverBg: string, detailsColor: string) => `
            .accordion { margin-top: 1rem; }
            details:last-of-type { margin-bottom: 0; }
            .accordion summary {
                font-size: 1.1rem;
                font-weight: 600;
                color: ${summaryColor};
                cursor: pointer;
                padding: 0.75rem;
                border-radius: 8px;
                transition: background-color 0.2s ease;
                list-style: none;
                display: flex;
                align-items: center;
            }
            .accordion summary::-webkit-details-marker { display: none; }
            .accordion summary:before {
                content: '+';
                color: ${plusColor};
                font-size: 1.5rem;
                margin-right: 0.75rem;
                transition: transform 0.3s ease;
            }
            .accordion[open] summary:before { transform: rotate(45deg); }
            .accordion summary:hover { background-color: ${summaryHoverBg}; }
            .details-content { padding: 1rem 1rem 1rem 2.8rem; font-size: 1rem; line-height: 1.6; color: ${detailsColor}; border-left: 2px solid ${plusColor}; margin-left: calc(0.75rem + 1.5rem / 2 - 1px); }
        `;

        const styles = {
            [PresentationStyle.Extensive]: `
                body { font-family: 'Inter', sans-serif; background-color: #0d1117; color: #c9d1d9; display: flex; flex-direction: column; align-items: center; padding: 2rem; margin: 0; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .slide {
                    background-color: #161b22;
                    border: 1px solid #30363d;
                    border-radius: 16px;
                    margin-bottom: 3rem;
                    width: 90%;
                    max-width: 1100px;
                    overflow: hidden;
                    padding: 2.5rem;
                    animation: fadeIn 0.6s ease-out forwards;
                }
                h1 { font-size: 2.2rem; font-weight: 700; color: #58a6ff; margin-bottom: 1rem; }
                ${accordionCss('#58a6ff', '#c9d1d9', '#21262d', '#8b949e')}
            `,
            [PresentationStyle.Informative]: `
                body { font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; margin:0; background-color: #F8F9FA; color: #343A40; }
                .slide { margin-bottom: 2rem; padding: 2.5rem; width: 90%; max-width: 1000px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background-color: #FFFFFF; border: 1px solid #DEE2E6; }
                h1 { color: #007BFF; font-size: 2.2rem; margin-bottom: 1rem; }
                ${accordionCss('#007BFF', '#343A40', '#e9ecef', '#495057')}
            `,
            [PresentationStyle.ForKids]: `
                body { font-family: 'Comic Sans MS', cursive, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; margin:0; background-color: #FFFDE7; color: #5D4037; }
                .slide { margin-bottom: 2rem; padding: 2.5rem; width: 90%; max-width: 1000px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background-color: #FFECB3; border: 3px dashed #FFB74D; text-align: center; }
                h1 { color: #F44336; font-size: 3rem; margin-bottom: 1rem; text-shadow: 2px 2px #FFCC80; }
                ${accordionCss('#F44336', '#5D4037', '#FFF9C4', '#795548')}
                .accordion summary { justify-content: center; }
                .details-content { border-left: none; margin-left: 0; text-align: left;}
            `,
        };

        const styleLabels: { [key in PresentationStyle]: string } = {
            [PresentationStyle.Extensive]: t.styleExtensive,
            [PresentationStyle.Informative]: t.styleInformative,
            [PresentationStyle.ForKids]: t.styleForKids,
        };
        const docNamePart = fileName ? fileName.replace(/\.[^/.]+$/, "") : t.document;
        const documentTitle = `${t.presentationTitleExport} - ${docNamePart} - ${styleLabels[style]}`;

        const getSlideHtml = () => {
             return slides.map((slide) => {
                const accordionHtml = slide.interactiveContent?.map(content => `
                    <details class="accordion">
                        <summary>${content.summary}</summary>
                        <div class="details-content">
                            <p>${content.details}</p>
                        </div>
                    </details>
                `).join('') || '';
                
                return `
                    <div class="slide">
                        <h1>${slide.title}</h1>
                        ${accordionHtml}
                    </div>
                `;
            }).join('');
        }
       
        return `
            <!DOCTYPE html>
            <html lang="${language}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${documentTitle}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Comic+Sans+MS&display=swap" rel="stylesheet">
                <style>${styles[style]}</style>
            </head>
            <body>
                ${getSlideHtml()}
            </body>
            </html>
        `;
    }, [language, t]);

    const handleGeneratePresentation = useCallback(async () => {
        if (!summary) {
            setError(t.errorNoSummary);
            return;
        }
        
        setIsLoading(
            presentationStyle === PresentationStyle.Extensive
                ? t.loadingPresentationExtensive
                : t.loadingPresentation
        );
        setError('');

        try {
            const slides: Slide[] = await generatePresentation(summary, presentationStyle, language);
            const html = createPresentationHtml(slides, presentationStyle, file?.name);
            setPresentationHtml(html);
            setIsModalOpen(true);
        } catch (err) {
            const errorMessage = (err instanceof Error && err.message.includes("invalid format")) 
                ? t.errorInvalidAIResponse 
                : (err instanceof Error ? t.errorPresentation(err.message) : t.errorUnknown);
            setError(errorMessage);
        } finally {
            setIsLoading(null);
        }
    }, [summary, presentationStyle, language, t, file, createPresentationHtml]);

    const handleSaveSummary = useCallback(() => {
        if (!summary || !file) return;
        const newSummary: SavedSummary = {
            id: Date.now(),
            fileName: file.name,
            summary,
            type: summaryType,
            createdAt: new Date().toISOString(),
        };
        setSavedSummaries(prev => [newSummary, ...prev]);
    }, [summary, file, summaryType, setSavedSummaries]);
    
    const handleDeleteSummary = useCallback((id: number) => {
        setSavedSummaries(prev => prev.filter(s => s.id !== id));
    }, [setSavedSummaries]);

    const handleLoadSummary = useCallback((summaryText: string) => {
        setSummary(summaryText);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <div className="min-h-screen text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Header />
                <main className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                           <h2 className="text-xl font-bold text-brand-primary mb-4">{t.uploadTitle}</h2>
                           <FileUpload onFileChange={handleFileChange} file={file} />
                        </div>

                         {extractedText && (
                            <>
                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                                 <h2 className="text-xl font-bold text-brand-primary mb-4">{t.summaryTitle}</h2>
                                <SummaryControls selectedType={summaryType} onTypeChange={setSummaryType} onSummarize={handleSummarize} disabled={!!isLoading} />
                            </div>
                            </>
                         )}

                    </div>
                    
                    {/* Right Column */}
                    <div className="lg:col-span-8 space-y-8">
                       <div className="bg-slate-800 p-6 rounded-xl shadow-lg min-h-[300px]">
                            <h2 className="text-xl font-bold text-brand-primary mb-4">{t.outputTitle}</h2>
                             {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /> <span className="ml-4 text-lg">{isLoading}</span></div>}
                             {error && <div className="flex items-center text-red-400"><AlertTriangle /><span className="ml-2">{error}</span></div>}
                             {!isLoading && !summary && !file && <div className="text-center text-slate-400 p-8">{t.outputPlaceholder}</div>}
                             {!isLoading && !summary && extractedText && <div className="flex items-center text-green-400 p-8"><CheckCircle /><span className="ml-2">{t.outputReady}</span></div>}
                            
                             {summary && (
                                <SummaryOutput summary={summary} onSave={handleSaveSummary} />
                             )}
                        </div>

                        {summary && (
                            <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                                <h2 className="text-xl font-bold text-brand-primary mb-4">{t.presentationTitle}</h2>
                                <PresentationGenerator 
                                    selectedStyle={presentationStyle} 
                                    onStyleChange={setPresentationStyle}
                                    onGenerate={handleGeneratePresentation} 
                                    disabled={!!isLoading}
                                />
                            </div>
                        )}
                        
                    </div>
                </main>

                <SavedSummaries 
                    summaries={savedSummaries} 
                    onLoad={handleLoadSummary} 
                    onDelete={handleDeleteSummary} 
                />
            </div>
            
            {isModalOpen && (
                <PresentationModal 
                    htmlContent={presentationHtml} 
                    onClose={() => setIsModalOpen(false)} 
                    style={presentationStyle}
                    fileName={file?.name}
                />
            )}
        </div>
    );
};

export default App;
