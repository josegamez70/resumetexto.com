
import React from 'react';
import { SavedSummary } from '../types';
import { Trash2, BookOpen } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface SavedSummariesProps {
    summaries: SavedSummary[];
    onLoad: (summary: string) => void;
    onDelete: (id: number) => void;
}

const SavedSummaries: React.FC<SavedSummariesProps> = ({ summaries, onLoad, onDelete }) => {
    const { t } = useLanguage();

    if (summaries.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">{t.savedSummariesTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {summaries.map(s => (
                    <div key={s.id} className="bg-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg hover:shadow-brand-primary/20 transition-shadow duration-300">
                        <div>
                            <p className="text-xs text-slate-400 font-mono">{new Date(s.createdAt).toLocaleString()}</p>
                            <p className="font-bold text-brand-secondary mt-1 truncate" title={s.fileName}>{s.fileName}</p>
                            <p className="text-slate-300 text-sm mt-3 h-24 overflow-hidden text-ellipsis">
                                {s.summary}
                            </p>
                        </div>
                        <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-700">
                             <span className="text-xs font-medium bg-slate-700 text-brand-secondary px-2 py-1 rounded capitalize">{s.type}</span>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => onLoad(s.summary)} title={t.loadSummaryAction} className="p-2 text-slate-400 hover:text-brand-primary transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </button>
                                <button onClick={() => onDelete(s.id)} title={t.deleteSummaryAction} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavedSummaries;
