import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <div className="w-full lg:w-[62%] flex flex-col justify-center text-left lg:pr-8">
      <div className="inline-block mb-5 px-4 py-1.5 rounded-full bg-court-gold/10 border border-court-gold/20 text-court-gold font-medium text-xs max-w-fit animate-pulse-soft">
        ⚖️ AUTHORITATIVE LEGAL INTELLIGENCE
      </div>
      <h1 className="mb-6 text-4xl sm:text-5xl md:text-6xl font-bold font-serif leading-tight text-court-cream">
        {t('landing.hero.title1')} <br /> {t('landing.hero.title2')}{' '}
        <span className="text-court-gold block sm:inline font-style-italic">
          {t('landing.hero.title3')}
        </span>
      </h1>
      <p className="max-w-2xl mb-10 text-base sm:text-lg text-court-muted leading-relaxed">
        {t('landing.hero.subtitle')}
      </p>
    </div>
  );
}
