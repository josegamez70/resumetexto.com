import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="w-full py-8">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center animate-fadeIn">
                
                {/* Título con gradiente animado */}
                <div className="bg-brand-surface p-4 sm:p-6 rounded-2xl border-2 border-black shadow-lg inline-flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mr-4" viewBox="0 0 24 24">
                        <rect x="3" y="5" width="18" height="12" rx="2" stroke="#ef4444" strokeWidth="1.5" fill="#facc15" />
                        <line x1="12" y1="17" x2="12" y2="20" stroke="#ef4444" strokeWidth="1.5" />
                        <line x1="8" y1="20" x2="16" y2="20" stroke="#ef4444" strokeWidth="1.5" />
                    </svg>
                    <h1 
                        className="text-5xl font-bold tracking-wider bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-gradient"
                        style={{ textShadow: '0 0 8px rgba(0,0,0,0.5)' }}
                    >
                        RESÚMELO!
                    </h1>
                </div>

                {/* Subtítulo con animación fadeUp */}
                <p className="text-lg text-gray-300 max-w-3xl leading-relaxed opacity-0 animate-fadeUp">
                    Sube un <strong>PDF</strong> o una <strong>foto</strong> y deja que la IA cree un <strong>resumen</strong>, 
                    que después puedes convertir en un <strong>Mapa Mental</strong>, como esquema interactivo, 
                    para acelerar tu aprendizaje.
                </p>
            </div>
        </header>
    );
};

export default Header;
