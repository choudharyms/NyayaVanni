import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function FAQSection({ openFaq, setOpenFaq }) {
  const { t } = useLanguage();

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ];

  return (
    <div
      id="faq"
      className="p-8 border bg-court-walnut/90 border-court-gold/25 rounded-3xl md:p-10 shadow-2xl transition-colors duration-300"
    >
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold font-serif text-court-cream md:text-4xl">
            {t('faq.title')}
          </h2>
          <p className="max-w-2xl mt-2 text-court-muted">{t('faq.desc')}</p>
        </div>
      </div>

      <div className="columns-1 md:columns-2 gap-6 space-y-4">
        {faqs.map((item, idx) => (
          <div
            key={idx}
            className="mb-4 break-inside-avoid p-5 transition-all duration-300 border rounded-xl border-court-gold/20 bg-court-walnut/50 hover:border-court-gold/45"
          >
            <button
              type="button"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="flex items-center justify-between w-full gap-4 text-left cursor-pointer"
            >
              <span className="font-semibold text-court-cream">{item.q}</span>

              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 border transition-all duration-300 bg-court-walnut/30 border-court-gold/20 ${
                  openFaq === idx
                    ? 'rotate-45 bg-court-gold/10 border-court-gold/40'
                    : ''
                }`}
              >
                <span className="text-court-gold">+</span>
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                openFaq === idx
                  ? 'max-h-40 opacity-100 mt-3'
                  : 'max-h-0 opacity-0'
              }`}
            >
              <p className="leading-relaxed text-court-muted text-sm">
                {item.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
