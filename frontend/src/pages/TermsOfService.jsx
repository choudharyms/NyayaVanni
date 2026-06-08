import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

export default function TermsOfService() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex flex-col flex-1 w-full px-6 py-6">
        
        {/* Navigation / Header */}
        <header className="flex items-center justify-between py-4 mb-8 border-b border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> {language === 'en' ? 'Back' : 'वापस'}
          </button>
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1">
          <h1 className="text-4xl font-extrabold text-slate-850 dark:text-white">Terms of Service</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3">
            By using NyayaVanni, you agree to the terms below.
          </p>

          <div className="mt-8 space-y-6 text-slate-700 dark:text-slate-350 leading-relaxed">
            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">1. Not Legal Advice</h2>
              <p className="mt-2 text-sm">NyayaVanni provides simplified explanations. Always consult a qualified lawyer for legal decisions.</p>
            </section>

            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">2. User Responsibilities</h2>
              <p className="mt-2 text-sm">You are responsible for the documents you upload and ensuring you have rights to share them.</p>
            </section>

            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">3. Service Availability</h2>
              <p className="mt-2 text-sm">The service may be updated, paused, or changed without prior notice.</p>
            </section>

            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">4. Contact</h2>
              <p className="mt-2 text-sm">Email: <span className="text-nyaya-600 dark:text-nyaya-400 font-semibold">support@nyayavanni.com</span></p>
            </section>
          </div>
        </main>
      </div>

      <section className="z-10 w-full">
        <Footer />
      </section>
    </div>
  );
}
