import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  Mail,
  Twitter,
  Github,
  Linkedin,
  Instagram,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const handleUploadClick = () => {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
    }
  };
  const handleLinkClick = () => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };
  const linkClass =
    'text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer';
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
            {/* Fix: text-slate-650 is not a valid Tailwind class; replaced with text-slate-600 for proper light mode visibility */}
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              {language === 'en'
                ? 'Understand Indian legal documents in simple language. Upload contracts/notices and get clearer insights fast.'
                : 'भारतीय कानूनी दस्तावेजों को सरल भाषा में समझें। अनुबंध/नोटिस अपलोड करें और तेजी से स्पष्ट जानकारी प्राप्त करें।'}
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:w-auto">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'en' ? 'Product' : 'उत्पाद'}
              </p>
              {/* Fix: bumped from text-slate-600 to text-slate-700 for higher contrast in light mode */}
              <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-400 text-sm">
                <Link
                  to="/chat"
                  onClick={handleLinkClick}
                  className={linkClass}
                >
                  {' '}
                  {t('landing.chat.title')}{' '}
                </Link>
                <button
                  onClick={handleUploadClick}
                  className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer"
                >
                  {t('landing.upload.title')}
                </button>
                <Link
                  to="/lawyers"
                  onClick={handleLinkClick}
                  className={linkClass}
                >
                  {' '}
                  {t('nav.hire')}{' '}
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'en' ? 'Resources' : 'संसाधन'}
              </p>
              {/* Fix: bumped from text-slate-600 to text-slate-700 for higher contrast in light mode */}
              <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-400 text-sm">
                <Link to="/faq" onClick={handleLinkClick} className={linkClass}>
                  {' '}
                  FAQ{' '}
                </Link>
                <Link
                  to="/privacy-policy"
                  onClick={handleLinkClick}
                  className={linkClass}
                >
                  {' '}
                  Privacy Policy{' '}
                </Link>{' '}
                <Link
                  to="/terms"
                  onClick={handleLinkClick}
                  className={linkClass}
                >
                  {' '}
                  Terms of Service{' '}
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'en' ? 'Contact' : 'संपर्क'}
              </p>
              {/* Fix: bumped from text-slate-600 to text-slate-700 for higher contrast in light mode */}
              <div className="flex flex-col gap-2 text-slate-700 dark:text-slate-400 text-sm">
                <a
                  href="mailto:support@nyayavanni.com"
                  className="hover:text-nyaya-600 dark:hover:text-white transition duration-250 flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  support@nyayavanni.com
                </a>
                {/* Fix: was text-slate-500 dark:text-slate-500 (same faded color in both modes); light mode now uses text-slate-600 */}
                <span className="text-xs text-slate-600 dark:text-slate-500">
                  {language === 'en'
                    ? 'Mon–Fri, 10AM–6PM'
                    : 'सोम–शुक्र, सुबह 10–शाम 6'}
                </span>
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
              href="#"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-slate-500 hover:text-nyaya-600 dark:hover:text-nyaya-400 transition-all duration-300 hover:-translate-y-1 hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-500 italic text-center sm:text-right mt-1">
            {language === 'en'
              ? 'Not legal advice. For professional help, consult a licensed lawyer.'
              : 'यह कानूनी सलाह नहीं है। पेशेवर मदद के लिए, किसी लाइसेंस प्राप्त वकील से सलाह लें।'}
          </p>
        </div>
      </div>
    </footer>
  );
}
