import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import ThemeToggle from "../components/ThemeToggle";
import Footer from "../components/Footer";

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-extrabold text-slate-850 dark:text-white">Privacy Policy</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3">
            This page explains how NyayaVanni handles uploaded documents and user data.
          </p>

          <div className="mt-8 space-y-6 text-slate-700 dark:text-slate-350 leading-relaxed">
            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">1. Data We Process</h2>
              <p className="mt-2 text-sm">Uploaded documents and chat prompts are used to generate summaries and responses.</p>
            </section>

            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">2. Storage</h2>
              <p className="mt-2 text-sm">Depending on configuration, documents may be processed temporarily or stored for history features.</p>
            </section>

            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">3. Security</h2>
              <p className="mt-2 text-sm">We use standard security practices, but no system is 100% secure.</p>
            </section>

            <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-850 dark:text-white">4. Contact</h2>
              <p className="mt-2 text-sm">Questions? Email: <span className="text-nyaya-600 dark:text-nyaya-400 font-semibold">support@nyayavanni.com</span></p>
            </section>
          </div>
        </main>
      </div>

      <section className="z-10 w-full px-6 pb-16 mx-auto max-w-7xl">
        <Footer />
      </section>
    </div>
  );
}