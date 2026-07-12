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
    <footer className="w-full mt-16 border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand Section */}
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
              <span className="inline-flex items-center justify-center w-10 h-10 border rounded-full bg-nyaya-500/15 border-nyaya-500/25">
                <Scale className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
              </span>
              <span>
                Nyaya
                <span className="text-nyaya-600 dark:text-nyaya-400">
                  Vanni
                </span>
              </span>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              {language === 'en'
                ? EN.FOOTER_DESC
                : 'भारतीय कानूनी दस्तावेजों को सरल भाषा में समझें। अनुबंध/नोटिस अपलोड करें और तेजी से स्पष्ट जानकारी प्राप्त करें।'}
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4 md:w-auto">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                {L.PRODUCT}
              </p>
              <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-400 text-sm">
                <button
                  onClick={() => navigate('/chat')}
                  className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer"
                >
                  {t('landing.chat.title')}
                </button>
                <button
                  onClick={handleUploadClick}
                  className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer"
                >
                  {t('landing.upload.title')}
                </button>
                <button
                  onClick={() => navigate('/lawyers')}
                  className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer"
                >
                  {t('nav.hire')}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                {L.RESOURCES}
              </p>
              <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-400 text-sm">
                <button
                  onClick={() => navigate('/faq')}
                  className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer"
                >
                  {language === 'en' ? 'FAQ' : 'प्रश्नोत्तरी (FAQ)'}
                </button>
                <button
                  onClick={() => navigate('/privacy-policy')}
                  className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer"
                >
                  {L.PRIVACY_POLICY}
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer"
                >
                  {L.TERMS_OF_SERVICE}
                </button>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                {L.CONTACT}
              </p>
              <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-400 text-sm">
                <a
                  href="mailto:support@nyayavanni.com"
                  aria-label="Email Support"
                  className="hover:text-nyaya-600 dark:hover:text-white transition duration-250 flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  support@nyayavanni.com
                </a>
                <span className="text-xs text-slate-600 dark:text-slate-500">
                  {L.FOOTER_HOURS}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'en' ? 'Developers' : 'डेवलपर्स'}
              </p>
              <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-400 text-sm">
                <a
                  href={apiDocsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-nyaya-600 dark:hover:text-white transition duration-250 flex items-center gap-1.5 cursor-pointer"
                >
                  {language === 'en' ? 'API Documentation' : 'एपीआई दस्तावेज़'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col items-center sm:items-start justify-between gap-4 pt-6 mt-8 border-t border-slate-200 dark:border-slate-700 sm:flex-row">
          <p className="text-xs text-slate-600 dark:text-slate-500 text-center sm:text-left mt-1">
            © {new Date().getFullYear()} NyayaVanni. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-5">
            <a
              href="https://twitter.com/nyayavanni"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on Twitter (opens in new tab)"
              title="Follow NyayaVanni on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/choudharyms/NyayaVanni"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on GitHub (opens in new tab)"
              title="View NyayaVanni source code on GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com/company/nyayavanni"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on LinkedIn (opens in new tab)"
              title="Follow NyayaVanni on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com/nyayavanni"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="NyayaVanni on Instagram (opens in new tab)"
              title="Follow NyayaVanni on Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-500 italic text-center sm:text-right mt-1">
            {language === 'en'
              ? EN.FOOTER_DISCLAIMER
              : 'यह कानूनी सलाह नहीं है। पेशेवर मदद के लिए, किसी लाइसेंस प्राप्त वकील से सलाह लें।'}
          </p>
        </div>
      </div>
    </footer>
  );
}
