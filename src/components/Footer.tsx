import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full mt-8 py-6">
            <div className="container mx-auto px-4 text-center text-brand-text-muted text-sm">
                <p>&copy; {new Date().getFullYear()} RESÚMELO! — Creado por JMGG.</p>
            </div>
        </footer>
    );
};

export default Footer;