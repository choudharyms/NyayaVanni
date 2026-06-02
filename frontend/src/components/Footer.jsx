import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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

  return (
    <footer className="w-full mt-16 p-8 border rounded-4xl border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl md:p-10 transition-colors duration-300">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        {/* Brand Section */}
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
            <span className="inline-flex items-center justify-center w-10 h-10 border rounded-full bg-nyaya-500/15 border-nyaya-500/25">
              <Scale className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
            </span>
            <span>Nyaya<span className="text-nyaya-600 dark:text-nyaya-400">Vanni</span></span>
          </div>
          <p className="mt-3 text-slate-650 dark:text-slate-400 leading-relaxed text-sm">
            {language === 'en' 
              ? 'Understand Indian legal documents in simple language. Upload contracts/notices and get clearer insights fast.' 
              : 'भारतीय कानूनी दस्तावेजों को सरल भाषा में समझें। अनुबंध/नोटिस अपलोड करें और तेजी से स्पष्ट जानकारी प्राप्त करें।'}
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:w-auto">
          <div>
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {language === 'en' ? 'Product' : 'उत्पाद'}
            </p>
            <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400 text-sm">
              <button onClick={() => navigate('/chat')} className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer">{t("landing.chat.title")}</button>
              <button onClick={handleUploadClick} className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer">{t("landing.upload.title")}</button>
              <button onClick={() => navigate('/lawyers')} className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer">{t("nav.hire")}</button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {language === 'en' ? 'Resources' : 'संसाधन'}
            </p>
            <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400 text-sm">
              <button onClick={() => navigate('/faq')} className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer">
                {language === 'en' ? 'FAQ' : 'प्रश्नोत्तरी (FAQ)'}
              </button>
              <button onClick={() => navigate('/privacy-policy')} className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer">
                {language === 'en' ? 'Privacy Policy' : 'गोपनीयता नीति'}
              </button>
              <button onClick={() => navigate('/terms')} className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer">
                {language === 'en' ? 'Terms of Service' : 'सेवा की शर्तें'}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {language === 'en' ? 'Contact' : 'संपर्क'}
            </p>
            <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400 text-sm">
              <button onClick={() => navigate('/contact')} className="text-left hover:text-nyaya-600 dark:hover:text-white transition duration-250 cursor-pointer">
                {language === 'en' ? 'Contact Us Page' : 'संपर्क पृष्ठ'}
              </button>
              <a href="mailto:support@nyayavanni.com" className="hover:text-nyaya-600 dark:hover:text-white transition duration-250 flex items-center gap-1.5 mt-2">
                <Mail className="w-4 h-4 shrink-0" />
                support@nyayavanni.com
              </a>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {language === 'en' ? 'Mon–Fri, 10AM–6PM' : 'सोम–शुक्र, सुबह 10–शाम 6'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="flex flex-col items-start justify-between gap-4 pt-6 mt-8 border-t border-slate-200 dark:border-slate-800 sm:flex-row sm:items-center">
        <p className="text-xs text-slate-500 dark:text-slate-500">
          © {new Date().getFullYear()} NyayaVanni. All rights reserved.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 italic">
          {language === 'en' 
            ? 'Not legal advice. For professional help, consult a licensed lawyer.' 
            : 'यह कानूनी सलाह नहीं है। पेशेवर मदद के लिए, किसी लाइसेंस प्राप्त वकील से सलाह लें।'}
        </p>
      </div>
    </footer>
  );
}
