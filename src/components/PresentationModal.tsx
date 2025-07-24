
import React from 'react';
import { Download, X } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import { PresentationStyle } from '../types';

interface PresentationModalProps {
    htmlContent: string;
    onClose: () => void;
    style: PresentationStyle;
    fileName?: string;
}

const PresentationModal: React.FC<PresentationModalProps> = ({ htmlContent, onClose, style, fileName }) => {
    const { t } = useLanguage();
    
    const handleExport = () => {
        const styleLabels: { [key in PresentationStyle]: string } = {
            [PresentationStyle.Extensive]: t.styleExtensive,
            [PresentationStyle.Informative]: t.styleInformative,
            [PresentationStyle.ForKids]: t.styleForKids,
        };
        const styleText = styleLabels[style];
        const docNamePart = fileName ? fileName.replace(/\.[^/.]+$/, "") : t.document;
        
        const rawFilename = `${t.exportFileName} - ${docNamePart} - ${styleText}.html`;
        const filename = rawFilename.replace(/[^\w\s-.]/g, '').replace(/\s+/g, '-').toLowerCase();

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-xl shadow-2xl w-full h-full max-w-6xl flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="font-bold text-lg text-brand-primary">{t.modalTitle}</h3>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 text-sm bg-brand-primary hover:bg-opacity-90 text-white font-semibold rounded-lg transition-colors">
                           <Download className="w-4 h-4"/>
                           <span>{t.exportHtmlBtn}</span>
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-700">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-grow p-2 bg-slate-900 rounded-b-xl">
                    <iframe
                        srcDoc={htmlContent}
                        title={t.modalTitle}
                        className="w-full h-full border-0 rounded-lg"
                        sandbox="allow-scripts"
                    />
                </div>
            </div>
        </div>
    );
};

export default PresentationModal;
