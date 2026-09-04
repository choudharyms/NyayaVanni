import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LANGUAGE_ORDER = ['en', 'hi', 'ta'];
const LANGUAGE_LABELS = {
  en: 'English',
  hi: 'हिंदी',
  ta: 'தமிழ்',
};

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const cycleLanguage = () => {
    const currentIndex = LANGUAGE_ORDER.indexOf(language);
    const next = LANGUAGE_ORDER[(currentIndex + 1) % LANGUAGE_ORDER.length];
    setLanguage(next);
  };

  const currentLabel = LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en;

  return (
    <button
      onClick={cycleLanguage}
      className="relative flex items-center gap-1.5 p-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-nyaya-500/50 cursor-pointer shadow-sm bg-white dark:bg-slate-950"
      title={`Change language (current: ${currentLabel})`}
      aria-label={`Change language (current: ${currentLabel})`}
    >
      <Languages className="w-5 h-5" />
      <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">
        {language}
      </span>
    </button>
  );
}
