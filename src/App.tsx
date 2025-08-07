import React, { useState, useEffect, useRef, useCallback } from 'react';
import { summarizeContent } from './services/geminiService';
import { ConfigOptions, SummaryType } from './types';
import Configurator from './components/Configurator';
import SummaryView from './components/SummaryView';
import PresentationView from './components/PresentationView';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [summaryTitle, setSummaryTitle] = useState('');
  const [view, setView] = useState<'config' | 'summary' | 'presentation'>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryType, setSummaryType] = useState<SummaryType>('text');
  const [config, setConfig] = useState<ConfigOptions>({
    level: 'basic',
    topic: 'daily_life',
    wordCount: 100,
    questionCount: 5
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleGenerateSummary = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const { summary: generatedSummary, title: generatedTitle } = await summarizeContent(file, summaryType);
      setSummary(generatedSummary);
      setSummaryTitle(generatedTitle || generatedSummary.split(" ").slice(0, 6).join(" "));
      setView('summary');
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePresentation = () => {
    setView('presentation');
  };

  const handleGoBack = () => {
    setSummary('');
    setSummaryTitle('');
    setFile(null);
    setView('config');
  };

  const handlePlayAudio = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = playbackRate;
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error generating audio:', err);
    }
  };

  const handleToggleSpeed = () => {
    setPlaybackRate(prev => (prev === 1 ? 0.5 : 1));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-6">Resumen IA</h1>

        {view === 'config' && (
          <>
            <input
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileChange}
              className="mb-4"
            />
            <Configurator
              config={config}
              setConfig={setConfig}
              onGenerate={handleGenerateSummary}
              isLoading={isLoading}
            />
          </>
        )}

        {isLoading && <Loader />}

        {view === 'summary' && (
          <>
            <SummaryView summary={summary} summaryTitle={summaryTitle} />
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <button
                onClick={handleGeneratePresentation}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Ver presentación
              </button>
              <button
                onClick={handlePlayAudio}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Escuchar resumen ({playbackRate}x)
              </button>
              <button
                onClick={handleToggleSpeed}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Velocidad {playbackRate === 1 ? '0.5x' : '1x'}
              </button>
              <button
                onClick={handleGoBack}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Volver atrás
              </button>
            </div>
          </>
        )}

        {view === 'presentation' && (
          <>
            <PresentationView summary={summary} summaryTitle={summaryTitle} />
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setView('summary')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
              >
                Volver al resumen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
