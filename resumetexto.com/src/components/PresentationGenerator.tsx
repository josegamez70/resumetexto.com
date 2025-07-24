
import React from 'react';
import { PresentationStyle } from '../types';
import { Presentation } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface PresentationGeneratorProps {
    selectedStyle: PresentationStyle;
    onStyleChange: (style: PresentationStyle) => void;
    onGenerate: () => void;
    disabled: boolean;
}

const PresentationGenerator: React.FC<PresentationGeneratorProps> = ({ 
    selectedStyle, onStyleChange, 
    onGenerate, disabled 
}) => {
    const { t } = useLanguage();
    
    const styleOptions = [
        { id: PresentationStyle.Extensive, label: t.styleExtensive },
        { id: PresentationStyle.Informative, label: t.styleInformative },
        { id: PresentationStyle.ForKids, label: t.styleForKids },
    ];

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg bg-slate-700 p-1">
                {styleOptions.map(option => (
                    <button
                        key={option.id}
                        onClick={() => onStyleChange(option.id)}
                        className={`w-full py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary
                            ${selectedStyle === option.id ? 'bg-brand-primary text-white shadow' : 'text-slate-300 hover:bg-slate-600'}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <button
                onClick={onGenerate}
                disabled={disabled}
                className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
            >
                <Presentation className="w-5 h-5 mr-2" />
                {t.generatePresentationBtn}
            </button>
        </div>
    );
};

export default PresentationGenerator;
