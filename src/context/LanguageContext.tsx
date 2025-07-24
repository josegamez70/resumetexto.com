
import React, { createContext, useState, useContext, useMemo } from 'react';
import { translations, Translation } from '../lib/i18n';

export type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: Translation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('es');

    const t = useMemo(() => translations[language], [language]);

    const value = {
        language,
        setLanguage,
        t,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
