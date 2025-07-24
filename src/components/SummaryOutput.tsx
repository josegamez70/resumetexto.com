
import React from 'react';
import { Save } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface SummaryOutputProps {
    summary: string;
    onSave: () => void;
}

const SummaryOutput: React.FC<SummaryOutputProps> = ({ summary, onSave }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg text-brand-secondary">{t.generatedSummaryTitle}</h3>
                <button
                    onClick={onSave}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-md transition-colors"
                >
                    <Save className="w-4 h-4" />
                    <span>{t.saveBtn}</span>
                </button>
            </div>
            <div className="bg-slate-900 p-4 rounded-lg prose prose-invert prose-sm max-w-none prose-p:text-slate-300 prose-li:text-slate-300 whitespace-pre-wrap font-mono">
               {summary}
            </div>
        </div>
    );
};

export default SummaryOutput;
