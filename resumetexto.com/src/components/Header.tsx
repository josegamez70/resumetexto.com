
import React from 'react';
import { ComputerIcon } from './Icons';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

const Header: React.FC = () => {
    const { t } = useLanguage();
    return (
        <header className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center space-x-3">
                <div className="bg-brand-primary p-2 rounded-lg">
                    <ComputerIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                    <div className="rounded-lg py-1 px-3 inline-block">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gradient font-brand tracking-tighter">
                            {t.headerTitle}
                        </h1>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{t.headerSubtitle}</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                 <LanguageSwitcher />
                 <div className="text-xs font-mono text-brand-secondary hidden sm:block">
                    {t.poweredBy}
                </div>
            </div>
        </header>
    );
};

export default Header;
