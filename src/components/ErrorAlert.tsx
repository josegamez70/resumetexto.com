import React from 'react';

interface ErrorAlertProps {
    message: string;
    onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onClose }) => {
    return (
        <div className="w-full max-w-2xl bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 rounded-md shadow-md mb-6 animate-fade-in" role="alert">
            <div className="flex">
                <div className="py-1">
                    <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-5.9V7a1 1 0 0 1 2 0v5.1a1 1 0 0 1-2 0zM10 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
                </div>
                <div>
                    <p className="font-bold">Ocurrió un error</p>
                    <p className="text-sm">{message}</p>
                </div>
                <div className="ml-auto pl-3">
                    <button onClick={onClose} className="text-red-300 hover:text-red-100">
                         <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorAlert;