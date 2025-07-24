
import React from 'react';
import { SummaryType } from '../types';
import { Sparkles } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface SummaryControlsProps {
    selectedType: SummaryType;
    onTypeChange: (type: SummaryType) => void;
    onSummarize: () => void;
    disabled: boolean;
}

const SummaryControls: React.FC<SummaryControlsProps> = ({ selectedType, onTypeChange, onSummarize, disabled }) => {
    const { t } = useLanguage();

    const controlOptions = [
        { id: SummaryType.Short, label: t.summaryTypeShort },
        { id: SummaryType.Long, label: t.summaryTypeLong },
        { id: SummaryType.Bullets, label: t.summaryTypeBullets },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-700 p-1">
                {controlOptions.map(option => (
                    <button
                        key={option.id}
                        onClick={() => onTypeChange(option.id)}
                        className={`w-full py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary
                            ${selectedType === option.id ? 'bg-brand-primary text-white shadow' : 'text-slate-300 hover:bg-slate-600'}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
            <button
                onClick={onSummarize}
                disabled={disabled}
                className="w-full flex items-center justify-center py-3 px-4 bg-brand-primary text-white font-bold rounded-lg shadow-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
            >
                <Sparkles className="w-5 h-5 mr-2"/>
                {t.generateSummaryBtn}
            </button>
        </div>
    );
};

export default SummaryControls;
