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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-6">
        {/* Navigation / Header */}
        <header className="mb-8 flex items-center justify-between border-b border-slate-200 py-4 dark:border-slate-800">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />{' '}
            {language === 'en' ? 'Back' : 'वापस'}
          </button>
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1">
          <h1 className="text-slate-850 text-4xl font-extrabold dark:text-white">
            {t('faq.title')}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {t('faq.desc')}
          </p>

          <div className="mt-8 space-y-4">
            {faqs.map((item, idx) => (
              <details
                key={idx}
                className="hover:border-slate-350 group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 open:border-slate-300 open:shadow-lg dark:border-slate-800 dark:bg-slate-900/40 dark:open:border-slate-600 dark:hover:border-slate-700"
              >
                <summary className="text-slate-850 flex cursor-pointer list-none items-center justify-between gap-4 font-semibold dark:text-white">
                  <span>{item.q}</span>
                  <span className="text-lg leading-none text-slate-400 transition-transform duration-300 group-open:rotate-45 dark:text-slate-500">
                    +
                  </span>
                </summary>
                <div className="overflow-hidden">
                  <p className="animate-fadeIn mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
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
