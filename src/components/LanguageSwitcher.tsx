
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SpanishFlag, BritishFlag } from './Icons';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();

    const buttonClass = (isActive: boolean) =>
        `p-1.5 rounded-full transition-all duration-200 ${isActive ? 'bg-slate-600 ring-2 ring-brand-primary' : 'hover:bg-slate-700'}`;

    return (
        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-full">
            <button
                onClick={() => setLanguage('es')}
                className={buttonClass(language === 'es')}
                aria-label={t.switchToSpanish}
            >
                <SpanishFlag className="w-6 h-6 rounded-full" />
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={buttonClass(language === 'en')}
                aria-label={t.switchToEnglish}
            >
                <BritishFlag className="w-6 h-6 rounded-full" />
            </button>
        </div>
    );
};

export default LanguageSwitcher;
