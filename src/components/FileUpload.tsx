
import React, { useState, useCallback } from 'react';
import { UploadCloud, FileIcon, CheckCircle } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface FileUploadProps {
    onFileChange: (file: File) => void;
    file: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, file }) => {
    const { t } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileChange(e.dataTransfer.files[0]);
        }
    }, [onFileChange]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileChange(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragging ? 'border-brand-primary bg-slate-700' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700'}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
                    <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-brand-secondary">{t.uploadPrompt}</span> {t.uploadDragDrop}</p>
                    <p className="text-xs text-slate-500">{t.uploadFileType}</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.png,.jpg,.jpeg" />
            </label>
            {file && (
                <div className="mt-4 flex items-center justify-between bg-slate-700 p-3 rounded-md text-sm">
                    <div className="flex items-center space-x-2 truncate">
                       <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                       <span className="text-slate-300 truncate" title={file.name}>{file.name}</span>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
            )}
        </div>
    );
};

export default FileUpload;
