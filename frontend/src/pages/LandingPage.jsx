import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  ShieldCheck,
  Scale,
  FileText,
  ArrowRight,
  Loader2,
  Bot,
  MessageSquare,
  GitCompare,
  Twitter,
  Github,
  Linkedin,
  Instagram,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ensureSessionId } from '../utils/session';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import { useDocumentHistory } from '../hooks/useDocumentHistory';
import RecentDocuments from '../components/RecentDocuments';

export default function LandingPage() {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { history, clearHistory } = useDocumentHistory();
  const [openFaq, setOpenFaq] = useState(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      await ensureSessionId(apiUrl);

      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        let errMessage = 'Upload failed';
        try {
          const errData = await response.json();
          errMessage = errData.detail || errMessage;
        } catch {
          try {
            const errText = await response.text();
            if (errText) errMessage = errText;
          } catch {}
        }
        throw new Error(errMessage);
      }
      const data = await response.json();

      // Navigate to Dashboard with the document ID
      navigate(`/dashboard/${data.documentId}`, { state: { file } });
    } catch (error) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      // Check if we're in production but still pointing to localhost
      if (
        apiUrl.includes('localhost') &&
        window.location.hostname !== 'localhost'
      ) {
        alert(
          'Configuration Error: The app is trying to connect to a local server (localhost) while deployed. Please set the VITE_API_URL environment variable in your Vercel dashboard.'
        );
      } else {
        alert(
          'Upload failed: ' +
            (error.message || 'Please check your connection and try again.')
        );
      }
      setLoading(false);
    }
  };

  const footerLinkClass =
    ' group text-left transition-all duration-300 ease-out hover:text-court-gold hover:translate-x-1 hover:[text-shadow:0_0_4px_rgba(212,168,32,0.4)]';

  return (
    <div className="bg-court-walnut text-court-cream wood-panel relative flex min-h-screen flex-col font-sans transition-colors duration-300">
      {/* Radial vignette backdrop */}
      <div className="court-vignette pointer-events-none absolute inset-0 z-0 opacity-95"></div>

      {/* Courtroom Theme Header */}
      <nav className="border-court-gold/25 bg-court-walnut/90 relative z-20 w-full border-b backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
          <div
            className="text-court-cream flex cursor-pointer items-center gap-2.5 text-2xl font-bold tracking-tight"
            onClick={() => navigate('/')}
          >
            <span className="bg-court-gold/15 border-court-gold/30 inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_0_10px_rgba(212,168,32,0.1)]">
              <Scale className="text-court-gold h-5 w-5" />
            </span>
            <span>
              Nyaya<span className="text-court-gold font-semibold">Vanni</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/lawyers')}
              className="text-court-cream hover:text-court-gold hidden cursor-pointer px-4 py-2 font-medium transition-colors sm:block"
            >
              {t('nav.hire')}
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="text-court-cream hover:text-court-gold hidden cursor-pointer px-4 py-2 font-medium transition-colors sm:block"
            >
              {t('nav.contact')}
            </button>
            <button className="text-court-walnut bg-court-gold shadow-court-gold/10 cursor-pointer rounded-full px-5 py-2 font-semibold shadow-lg transition-all hover:bg-yellow-500">
              {t('nav.signin')}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Two-Panel Split Layout Grid */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-stretch gap-8 px-6 py-8 md:py-12 lg:flex-row">
        {/* Left Panel: Content, Descriptions and 2x2 Grid of Actions */}
        <div className="flex w-full flex-col justify-center text-left lg:w-[62%] lg:pr-8">
          <div className="bg-court-gold/10 border-court-gold/20 text-court-gold animate-pulse-soft mb-5 inline-block max-w-fit rounded-full border px-4 py-1.5 text-xs font-medium">
            ⚖️ AUTHORITATIVE LEGAL INTELLIGENCE
          </div>
          <h1 className="text-court-cream mb-6 font-serif text-4xl leading-tight font-bold sm:text-5xl md:text-6xl">
            {t('landing.hero.title1')} <br /> {t('landing.hero.title2')}{' '}
            <span className="text-court-gold font-style-italic block sm:inline">
              {t('landing.hero.title3')}
            </span>
          </h1>
          <p className="text-court-muted mb-10 max-w-2xl text-base leading-relaxed sm:text-lg">
            {t('landing.hero.subtitle')}
          </p>

          {/* Structured Actions: 2x2 Courtroom Cards Grid */}
          <div className="mb-8 grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1: Upload Document */}
            <div className="group relative">
              <div
                className={`court-card court-card-gold-hover flex h-full min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-3xl p-8 text-center ${dragActive ? 'border-yellow-400 shadow-[0_0_25px_rgba(212,168,32,0.35)]' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/png,image/jpeg"
                  onChange={handleChange}
                />

                {!file ? (
                  <>
                    <div className="bg-court-walnut border-court-gold/40 mb-5 flex h-14 w-14 items-center justify-center rounded-full border shadow-inner transition-transform duration-300 group-hover:scale-105">
                      <UploadCloud className="text-court-gold h-7 w-7" />
                    </div>
                    <h3 className="text-court-cream mb-2 font-serif text-xl font-bold">
                      {t('landing.upload.title')}
                    </h3>
                    <p className="text-court-muted mb-6 flex-1 text-sm leading-relaxed">
                      {t('landing.upload.desc')}
                    </p>
                    <button
                      onClick={onButtonClick}
                      className="bg-court-gold text-court-walnut shadow-court-gold/10 flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:bg-yellow-500"
                    >
                      <FileText className="h-4 w-4" /> {t('landing.upload.btn')}
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    <div className="bg-court-gold/15 border-court-gold/30 mb-5 flex h-14 w-14 items-center justify-center rounded-full border">
                      <ShieldCheck className="text-court-gold h-7 w-7" />
                    </div>
                    <h3
                      className="text-court-cream mb-1 max-w-[200px] truncate text-lg font-bold"
                      title={file.name}
                    >
                      {file.name}
                    </h3>
                    <p className="text-court-muted mb-8 text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
                    </p>

                    <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-court-muted hover:text-court-cream rounded-full px-5 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
                        disabled={loading}
                      >
                        {t('landing.upload.cancel')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze();
                        }}
                        disabled={loading}
                        className="bg-court-gold text-court-walnut flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:bg-yellow-500"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />{' '}
                            {t('landing.upload.analyzing')}
                          </>
                        ) : (
                          <>
                            {t('landing.upload.analyze')}{' '}
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Chat with Bot */}
            <div
              className="court-card court-card-gold-hover group flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-3xl p-8 text-center"
              onClick={() => navigate('/chat')}
            >
              <div className="bg-court-walnut border-court-gold/40 mb-5 flex h-14 w-14 items-center justify-center rounded-full border shadow-inner transition-transform duration-300 group-hover:scale-105">
                <Bot className="text-court-gold h-7 w-7" />
              </div>
              <h3 className="text-court-cream mb-2 font-serif text-xl font-bold">
                {t('landing.chat.title')}
              </h3>
              <p className="text-court-muted mb-6 flex-1 text-sm leading-relaxed">
                {t('landing.chat.desc')}
              </p>

              <div className="mb-6 flex w-full flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/chat', {
                      state: {
                        initialPrompt: 'I need to draft a legal notice.',
                      },
                    });
                  }}
                  className="bg-court-walnut/30 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream group/btn flex items-center justify-between rounded-lg border px-4 py-1.5 text-left text-xs transition-all"
                >
                  {t('landing.chat.draftNotice')}{' '}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/btn:opacity-100" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/chat', {
                      state: {
                        initialPrompt:
                          'I need to draft a reply to a legal notice.',
                      },
                    });
                  }}
                  className="bg-court-walnut/30 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream group/btn flex items-center justify-between rounded-lg border px-4 py-1.5 text-left text-xs transition-all"
                >
                  {t('landing.chat.replyNotice')}{' '}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/btn:opacity-100" />
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/chat');
                }}
                className="bg-court-gold text-court-walnut flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:bg-yellow-500"
              >
                <MessageSquare className="h-4 w-4" /> {t('landing.chat.btn')}
              </button>
            </div>

            {/* Card 3: Scam Detector */}
            <div
              className="court-card court-card-gold-hover group flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-3xl p-8 text-center"
              onClick={() => navigate('/scam-detector')}
            >
              <div className="bg-court-walnut border-court-gold/40 mb-5 flex h-14 w-14 items-center justify-center rounded-full border shadow-inner transition-transform duration-300 group-hover:scale-105">
                <ShieldCheck className="text-court-gold h-7 w-7" />
              </div>
              <h3 className="text-court-cream mb-2 font-serif text-xl font-bold">
                Scam Detector
              </h3>
              <p className="text-court-muted mb-6 flex-1 text-sm leading-relaxed">
                Analyze suspicious legal SMS, WhatsApp messages, or emails and
                receive risk scores with clear explanations.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/scam-detector');
                }}
                className="bg-court-gold text-court-walnut flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:bg-yellow-500"
              >
                Scan Text <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Card 4: Version Difference Analysis */}
            <div
              className="court-card court-card-gold-hover group flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-3xl p-8 text-center"
              onClick={() => navigate('/version-diff')}
            >
              <div className="bg-court-walnut border-court-gold/40 mb-5 flex h-14 w-14 items-center justify-center rounded-full border shadow-inner transition-transform duration-300 group-hover:scale-105">
                <GitCompare className="text-court-gold h-7 w-7" />
              </div>
              <h3 className="text-court-cream mb-2 font-serif text-xl font-bold">
                Version Diff Analysis
              </h3>
              <p className="text-court-muted mb-6 flex-1 text-sm leading-relaxed">
                Compare two document versions side-by-side. Instantly spot new
                obligations, increased penalties, or hidden terms.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/version-diff');
                }}
                className="bg-court-gold text-court-walnut flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:bg-yellow-500"
              >
                Compare Versions <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Stylized Barrister / Justice SVG Illustration */}
        <div className="relative flex w-full items-center justify-center overflow-hidden p-6 select-none sm:p-12 lg:w-[38%]">
          <div className="bg-radial-gradient from-court-gold/10 pointer-events-none absolute inset-0 via-transparent to-transparent opacity-30"></div>

          <div className="animate-float relative flex w-full max-w-[340px] items-center justify-center lg:max-w-full">
            {/* Detailed Barrister SVG Illustration */}
            <svg
              viewBox="0 0 400 700"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-auto max-h-[80vh] w-full"
            >
              {/* Radial glow around justice scale */}
              <circle
                cx="280"
                cy="210"
                r="100"
                fill="url(#scale-glow)"
                opacity="0.45"
              />

              {/* Silhouette outline of the Barrister */}
              <path
                d="M50 700 C80 570 120 440 150 400 C140 350 145 310 150 260 C130 260 110 280 100 310 L70 340 C60 320 65 290 85 260 C110 220 140 210 170 210 C160 175 165 150 180 130 C195 110 215 110 230 130 C245 150 250 175 240 210 C270 210 300 225 315 250 L345 230 C360 250 355 270 340 290 L310 310 C312 330 310 350 300 400 C330 440 370 570 400 700 Z"
                fill="#120c06"
              />

              {/* Delicate gold robe contour markings */}
              <path
                d="M150 400 C165 490 175 600 185 700"
                stroke="#d4a820"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.25"
              />
              <path
                d="M250 400 C235 490 225 600 215 700"
                stroke="#d4a820"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.25"
              />

              {/* Courtroom Collar & White Tabs */}
              <path
                d="M194 210 L189 250 L199 250 Z M214 210 L219 250 L209 250 Z"
                fill="#e8e0d0"
              />
              <path
                d="M184 210 C194 195 214 195 224 210 Z"
                fill="#e8e0d0"
                stroke="#120c06"
                strokeWidth="1.5"
              />

              {/* Arm extending upward to support the scale */}
              <path
                d="M240 210 C260 180 280 140 280 110 C280 100 275 95 270 100 L260 120 C250 140 240 185 240 210 Z"
                fill="#120c06"
              />
              <circle cx="280" cy="100" r="8" fill="#d4a820" />

              {/* Balanced Gold Scales of Justice (Libra) */}
              <path
                d="M200 120 L360 120"
                stroke="#d4a820"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <path
                d="M280 100 L280 180"
                stroke="#d4a820"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="280" cy="120" r="6" fill="#d4a820" />

              {/* Left hanging pan */}
              <path
                d="M200 120 L185 170 M200 120 L215 170"
                stroke="#d4a820"
                strokeWidth="1.2"
              />
              <path d="M180 170 C180 177 220 177 220 170 Z" fill="#d4a820" />

              {/* Right hanging pan */}
              <path
                d="M360 120 L345 170 M360 120 L375 170"
                stroke="#d4a820"
                strokeWidth="1.2"
              />
              <path d="M340 170 C340 177 380 177 380 170 Z" fill="#d4a820" />

              <defs>
                <radialGradient
                  id="scale-glow"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <stop offset="0%" stopColor="#d4a820" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#d4a820" stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>
      </main>

      {/* Recent Activity history section */}
      {history.length > 0 && (
        <section className="relative z-10 mx-auto mb-8 w-full max-w-7xl px-6">
          <RecentDocuments history={history} onClear={clearHistory} />
        </section>
      )}

      {/* Accordion FAQ + Courtroom Footer Section */}
      <section className="relative z-10 mt-8 w-full pb-0">
        <div className="mx-auto w-full max-w-7xl px-6">
          {/* Courtroom Styled FAQ */}
          <div
            id="faq"
            className="bg-court-walnut/90 border-court-gold/25 rounded-3xl border p-8 shadow-2xl transition-colors duration-300 md:p-10"
          >
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <h2 className="text-court-cream font-serif text-3xl font-bold md:text-4xl">
                  {t('faq.title')}
                </h2>
                <p className="text-court-muted mt-2 max-w-2xl">
                  {t('faq.desc')}
                </p>
              </div>
            </div>

            <div className="columns-1 gap-6 space-y-4 md:columns-2">
              {[
                { q: t('faq.q1'), a: t('faq.a1') },
                { q: t('faq.q2'), a: t('faq.a2') },
                { q: t('faq.q3'), a: t('faq.a3') },
                { q: t('faq.q4'), a: t('faq.a4') },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="border-court-gold/20 bg-court-walnut/50 hover:border-court-gold/45 mb-4 break-inside-avoid rounded-xl border p-5 transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                  >
                    <span className="text-court-cream font-semibold">
                      {item.q}
                    </span>

                    <span
                      className={`bg-court-walnut/30 border-court-gold/20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        openFaq === idx
                          ? 'bg-court-gold/10 border-court-gold/40 rotate-45'
                          : ''
                      }`}
                    >
                      <span className="text-court-gold">+</span>
                    </span>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === idx
                        ? 'mt-3 max-h-40 opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-court-muted text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Courtroom Footer */}
        <footer className="border-court-gold/25 bg-court-walnut/95 z-20 mt-12 w-full border-t backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              {/* Branding and Description */}
              <div className="max-w-md">
                <div className="text-court-cream flex items-center gap-2.5 text-xl font-bold">
                  <span className="bg-court-gold/15 border-court-gold/25 inline-flex h-9 w-9 items-center justify-center rounded-full border">
                    <Scale className="text-court-gold h-4.5 w-4.5" />
                  </span>
                  <span>
                    Nyaya
                    <span className="text-court-gold font-semibold">Vanni</span>
                  </span>
                </div>
                <p className="text-court-muted mt-3.5 text-sm leading-relaxed">
                  Understand Indian legal documents in simple language. Upload
                  contracts or notices and get clearer insights fast.
                </p>
              </div>

              {/* Links Sections */}
              <div className="grid w-full grid-cols-2 gap-8 sm:grid-cols-3 md:w-auto">
                <div>
                  <p className="text-court-cream mb-4 text-sm font-semibold tracking-wide uppercase">
                    Product
                  </p>
                  <div className="text-court-muted flex flex-col gap-2.5 text-sm">
                    <button
                      onClick={() => navigate('/chat')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Chat with AI
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>

                    <button
                      onClick={() => navigate('/document-generator')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Generate NDA{' '}
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Upload Document{' '}
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                    <button
                      onClick={() => navigate('/lawyers')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Hire a Lawyer
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                    <button
                      onClick={() => navigate('/version-diff')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Version Diff
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-court-cream mb-4 text-sm font-semibold tracking-wide uppercase">
                    Resources
                  </p>
                  <div className="text-court-muted flex flex-col gap-2.5 text-sm">
                    <button
                      onClick={() => navigate('/faq')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      FAQ
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                    <button
                      onClick={() => navigate('/privacy-policy')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Privacy Policy{' '}
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                    <button
                      onClick={() => navigate('/terms')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Terms of Service{' '}
                      <ChevronRight className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-court-cream mb-4 text-sm font-semibold tracking-wide uppercase">
                    Contact
                  </p>
                  <div className="text-court-muted flex flex-col gap-2.5 text-sm">
                    <a
                      href="mailto:support@nyayavanni.com"
                      className="hover:text-court-gold transition-all duration-300 ease-out hover:translate-x-1 hover:[text-shadow:0_0_4px_rgba(212,168,32,0.4)]"
                    >
                      support@nyayavanni.com
                    </a>
                    <span className="text-court-muted/70 text-xs">
                      Mon–Fri, 10AM–6PM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-court-gold/20 mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row sm:items-start">
              <p className="text-court-muted mt-1 text-center text-xs sm:text-left">
                © {new Date().getFullYear()} NyayaVanni. All rights reserved.
              </p>

              {/* Gold Accented Social Links */}
              <div className="flex items-center gap-5">
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4.5 w-4.5" />
                </a>
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="GitHub"
                >
                  <Github className="h-4.5 w-4.5" />
                </a>
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4.5 w-4.5" />
                </a>
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4.5 w-4.5" />
                </a>
              </div>

              <p className="text-court-muted mt-1 text-center text-xs italic sm:text-right">
                Not legal advice. For professional help, consult a lawyer.
              </p>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
