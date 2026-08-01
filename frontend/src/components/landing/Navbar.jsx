import React from 'react';
import { Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import ThemeToggle from '../ThemeToggle';

export default function Navbar() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <nav className="relative z-20 w-full border-b border-court-gold/25 bg-court-walnut/90 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center justify-between w-full px-6 py-5 mx-auto max-w-7xl">
        <div
          className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-court-cream cursor-pointer"
          onClick={() => navigate('/')}
        >
          <span className="inline-flex items-center justify-center w-10 h-10 border rounded-full bg-court-gold/15 border-court-gold/30 shadow-[0_0_10px_rgba(212,168,32,0.1)]">
            <Scale className="w-5 h-5 text-court-gold" />
          </span>
          <span>
            Nyaya<span className="text-court-gold font-semibold">Vanni</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/lawyers')}
            className="hidden px-4 py-2 font-medium text-court-cream hover:text-court-gold transition-colors sm:block cursor-pointer"
          >
            {t('nav.hire')}
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="hidden px-4 py-2 font-medium text-court-cream hover:text-court-gold transition-colors sm:block cursor-pointer"
          >
            {t('nav.contact')}
          </button>
          <button className="px-5 py-2 font-semibold text-court-walnut bg-court-gold hover:bg-yellow-500 rounded-full shadow-lg shadow-court-gold/10 transition-all cursor-pointer">
            {t('nav.signin')}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
