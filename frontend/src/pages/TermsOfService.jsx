import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Scale,
  Shield,
  Server,
  Mail,
  CalendarDays,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

export default function TermsOfService() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-6">
        <header className="mb-8 flex items-center justify-between border-b border-slate-200 py-4 dark:border-slate-800">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {language === 'en' ? 'Back' : 'वापस'}
          </button>

          <ThemeToggle />
        </header>

        <main className="flex-1">
          <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-cyan-50 via-slate-50 to-blue-50 p-8 md:p-12 dark:border-slate-800 dark:from-cyan-950/20 dark:via-slate-950 dark:to-blue-950/20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.15),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_35%)]" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50/80 px-4 py-2 font-medium text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300">
                <FileText className="h-4 w-4" />
                Terms & Conditions
              </div>

              <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-6xl">
                Terms of{' '}
                <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 bg-clip-text text-transparent">
                  Service
                </span>
              </h1>

              <p className="mt-6 max-w-4xl text-lg leading-relaxed text-slate-600 md:text-xl dark:text-slate-400">
                By using NyayaVanni, you agree to these Terms of Service. These
                terms govern your access to and use of our AI-powered legal
                assistance platform, ensuring a secure, transparent, and
                reliable experience for all users.
              </p>

              <div className="mt-8 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CalendarDays className="h-5 w-5" />
                <span>Last Updated: May 2026</span>
              </div>
            </div>
          </section>

          <div className="mt-10 space-y-6">
            <section className="group rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/40">
                  <Scale className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    1. Not Legal Advice
                  </h2>

                  <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                    NyayaVanni provides AI-generated summaries, explanations,
                    and informational assistance. The content generated should
                    not be considered legal advice and must not replace
                    consultation with a qualified legal professional.
                  </p>
                </div>
              </div>
            </section>

            <section className="group rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/40">
                  <Shield className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    2. User Responsibilities
                  </h2>

                  <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                    You are solely responsible for the documents, notices, FIRs,
                    contracts, and other content uploaded to the platform. By
                    uploading content, you confirm that you have the necessary
                    rights and permissions to share and process it.
                  </p>
                </div>
              </div>
            </section>

            <section className="group rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/40">
                  <Server className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    3. Service Availability
                  </h2>

                  <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                    We continuously improve NyayaVanni and reserve the right to
                    update, suspend, modify, or discontinue parts of the service
                    at any time without prior notice. We do not guarantee
                    uninterrupted availability.
                  </p>
                </div>
              </div>
            </section>

            <section className="group rounded-3xl border border-slate-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/40">
                  <Mail className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    4. Contact
                  </h2>

                  <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
                    If you have questions regarding these Terms of Service,
                    please contact our support team.
                  </p>

                  <p className="mt-3 font-semibold text-cyan-600 dark:text-cyan-400">
                    support@nyayavanni.com
                  </p>
                </div>
              </div>
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
