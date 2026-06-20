import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  Database,
  Lock,
  Mail,
  FileText,
  CalendarDays,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex flex-col flex-1 w-full px-6 py-6">
        <header className="flex items-center justify-between py-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'en' ? 'Back' : 'वापस'}
          </button>

          <ThemeToggle />
        </header>

        <main className="flex-1">
          <section className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-cyan-950/20 dark:via-slate-950 dark:to-blue-950/20 p-8 md:p-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_45%)]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-200 dark:border-cyan-900 bg-cyan-50/80 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                <Shield className="w-4 h-4" />
                Privacy & Security
              </div>

              <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Privacy
                <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 bg-clip-text text-transparent">
                  {' '}
                  Policy
                </span>
              </h1>

              <p className="mt-5 max-w-3xl text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                NyayaVanni is committed to protecting your privacy and ensuring
                transparency in how your legal documents and personal data are
                processed, stored, and secured.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <CalendarDays className="w-4 h-4" />
                Last Updated: May 2026
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6">
            <div className="group bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-6 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-950/40">
                  <Database className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Data We Process
                  </h2>

                  <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                    Uploaded legal documents, notices, contracts, FIRs, and chat
                    prompts are processed solely to generate summaries,
                    explanations, risk assessments, and AI-powered legal
                    assistance.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-6 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-950/40">
                  <FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Storage & Retention
                  </h2>

                  <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                    Documents may be temporarily processed or securely stored
                    depending on platform functionality, user preferences, and
                    future history-related features.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-6 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-green-100 dark:bg-green-950/40">
                  <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Security Practices
                  </h2>

                  <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                    We implement industry-standard safeguards including secure
                    infrastructure, encrypted communication, and restricted
                    access controls to protect user data.
                  </p>
                </div>
              </div>
            </div>

            <div className="group bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/40">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Contact Us
                  </h2>

                  <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                    If you have questions regarding this Privacy Policy, data
                    handling practices, or your rights, contact us at:
                  </p>

                  <p className="mt-3 font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                    support@nyayavanni.com
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <section className="z-10 w-full">
        <Footer />
      </section>
    </div>
  );
}
