import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Mail,
  Twitter,
  Github,
  Linkedin,
  Instagram,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { EN, HI } from '../constants';

export default function Footer() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleUploadClick = () => {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const L = language === 'hi' ? HI : EN;

  const apiDocsUrl = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/docs`
    : '/docs';

  return (
    <footer className="mt-16 w-full border-t border-slate-200 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand Section */}
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
              <span className="bg-nyaya-500/15 border-nyaya-500/25 inline-flex h-10 w-10 items-center justify-center rounded-full border">
                <Scale className="text-nyaya-600 dark:text-nyaya-400 h-5 w-5" />
              </span>
              <span>
                Nyaya
                <span className="text-nyaya-600 dark:text-nyaya-400">
                  Vanni
                </span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {language === 'en'
                ? EN.FOOTER_DESC
                : 'भारतीय कानूनी दस्तावेजों को सरल भाषा में समझें। अनुबंध/नोटिस अपलोड करें और तेजी से स्पष्ट जानकारी प्राप्त करें।'}
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4 md:w-auto">
            <div>
              <p className="mb-3 text-sm font-semibold tracking-wider text-slate-800 uppercase dark:text-white">
                {L.PRODUCT}
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-400">
                <button
                  onClick={() => navigate('/chat')}
                  className="hover:text-nyaya-600 cursor-pointer text-left transition duration-250 dark:hover:text-white"
                >
                  {t('landing.chat.title')}
                </button>
                <button
                  onClick={handleUploadClick}
                  className="hover:text-nyaya-600 cursor-pointer text-left transition duration-250 dark:hover:text-white"
                >
                  {t('landing.upload.title')}
                </button>
                <button
                  onClick={() => navigate('/lawyers')}
                  className="hover:text-nyaya-600 cursor-pointer text-left transition duration-250 dark:hover:text-white"
                >
                  {t('nav.hire')}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold tracking-wider text-slate-800 uppercase dark:text-white">
                {L.RESOURCES}
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-400">
                <button
                  onClick={() => navigate('/faq')}
                  className="hover:text-nyaya-600 cursor-pointer text-left transition duration-250 dark:hover:text-white"
                >
                  {language === 'en' ? 'FAQ' : 'प्रश्नोत्तरी (FAQ)'}
                </button>
                <button
                  onClick={() => navigate('/privacy-policy')}
                  className="hover:text-nyaya-600 cursor-pointer text-left transition duration-250 dark:hover:text-white"
                >
                  {L.PRIVACY_POLICY}
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className="hover:text-nyaya-600 cursor-pointer text-left transition duration-250 dark:hover:text-white"
                >
                  {L.TERMS_OF_SERVICE}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold tracking-wider text-slate-800 uppercase dark:text-white">
                {L.CONTACT}
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-400">
                <a
                  href="mailto:support@nyayavanni.com"
                  aria-label="Email Support"
                  className="hover:text-nyaya-600 flex items-center gap-1.5 transition duration-250 dark:hover:text-white"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  support@nyayavanni.com
                </a>
                <span className="text-xs text-slate-600 dark:text-slate-500">
                  {L.FOOTER_HOURS}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold tracking-wider text-slate-800 uppercase dark:text-white">
                {language === 'en' ? 'Developers' : 'डेवलपर्स'}
              </p>
              <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-400">
                <a
                  href={apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-nyaya-600 flex cursor-pointer items-center gap-1.5 transition duration-250 dark:hover:text-white"
                >
                  {language === 'en' ? 'API Documentation' : 'एपीआई दस्तावेज़'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-start dark:border-slate-700">
          <p className="mt-1 text-center text-xs text-slate-600 sm:text-left dark:text-slate-500">
            © {new Date().getFullYear()} NyayaVanni. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-5">
            <a
              href="https://twitter.com/nyayavanni"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nyaya-600 dark:hover:text-nyaya-400 text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on Twitter (opens in new tab)"
              title="Follow NyayaVanni on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/choudharyms/NyayaVanni"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nyaya-600 dark:hover:text-nyaya-400 text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on GitHub (opens in new tab)"
              title="View NyayaVanni source code on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com/company/nyayavanni"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nyaya-600 dark:hover:text-nyaya-400 text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on LinkedIn (opens in new tab)"
              title="Follow NyayaVanni on LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com/nyayavanni"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nyaya-600 dark:hover:text-nyaya-400 text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on Instagram (opens in new tab)"
              title="Follow NyayaVanni on Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>

          <p className="mt-1 text-center text-xs text-slate-600 italic sm:text-right dark:text-slate-500">
            {language === 'en'
              ? EN.FOOTER_DISCLAIMER
              : 'यह कानूनी सलाह नहीं है। पेशेवर मदद के लिए, किसी लाइसेंस प्राप्त वकील से सलाह लें।'}
          </p>
        </div>
      </div>
    </footer>
  );
}
