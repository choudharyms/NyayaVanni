import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

export default function FAQ() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Build faqs using translation keys so text updates reactively when language changes
  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex flex-col flex-1 w-full px-6 py-6">
        {/* Navigation / Header */}
        <header className="flex items-center justify-between py-4 mb-8 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />{' '}
            {language === 'en' ? 'Back' : 'वापस'}
          </button>
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1">
          <h1 className="text-4xl font-extrabold text-slate-850 dark:text-white">
            {t('faq.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3">
            {t('faq.desc')}
          </p>

          <div className="mt-8 space-y-4">
            {faqs.map((item, idx) => (
              <details
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-300 group open:shadow-lg open:border-slate-300 dark:open:border-slate-600"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-slate-850 dark:text-white">
                  <span>{item.q}</span>
                  <span className="text-slate-400 dark:text-slate-500 transition-transform duration-300 group-open:rotate-45 text-lg leading-none">
                    +
                  </span>
                </summary>
                <div className="overflow-hidden">
                  <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-sm animate-fadeIn">
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </main>
      </div>

      <section className="z-10 w-full">
        <Footer />
      </section>
    </div>
  );
}
