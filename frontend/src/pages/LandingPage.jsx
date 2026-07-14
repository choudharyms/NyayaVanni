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
    <div className="relative flex flex-col min-h-screen bg-court-walnut text-court-cream wood-panel transition-colors duration-300 font-sans">
      {/* Radial vignette backdrop */}
      <div className="absolute inset-0 court-vignette opacity-95 pointer-events-none z-0"></div>

      {/* Courtroom Theme Header */}
      <nav className="relative z-20 w-full border-b border-court-gold/25 bg-court-walnut/90 backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center justify-between w-full px-6 py-5 mx-auto max-w-7xl">
          <div
            className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-court-cream cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="inline-flex items-center justify-center w-10 h-10 border rounded-full bg-court-gold/15 border-court-gold/30 shadow-[0_0_10px_rgba(212,168,32,0.1)]">
              <Scale className="w-5 h-5 text-court-gold" />
            </span>
            <span>
              Nyaya<span className="text-court-gold font-semibold">Vanni</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/lawyers')}
              className="hidden px-4 py-2 font-medium text-court-cream hover:text-court-gold transition-colors sm:block cursor-pointer"
            >
              {t('nav.hire')}
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="hidden px-4 py-2 font-medium text-court-cream hover:text-court-gold transition-colors sm:block cursor-pointer"
            >
              {t('nav.contact')}
            </button>
            <button className="px-5 py-2 font-semibold text-court-walnut bg-court-gold hover:bg-yellow-500 rounded-full shadow-lg shadow-court-gold/10 transition-all cursor-pointer">
              {t('nav.signin')}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Two-Panel Split Layout Grid */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row w-full max-w-7xl px-6 py-8 md:py-12 mx-auto gap-8 items-stretch">
        
        {/* Left Panel: Content, Descriptions and 2x2 Grid of Actions */}
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

          {/* Structured Actions: 2x2 Courtroom Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-8">
            
            {/* Card 1: Upload Document */}
            <div className="relative group">
              <div
                className={`h-full court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer
                  ${dragActive ? 'border-yellow-400 shadow-[0_0_25px_rgba(212,168,32,0.35)]' : ''}`}
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
                    <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      <UploadCloud className="w-7 h-7 text-court-gold" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
                      {t('landing.upload.title')}
                    </h3>
                    <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
                      {t('landing.upload.desc')}
                    </p>
                    <button
                      onClick={onButtonClick}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg shadow-court-gold/10 hover:scale-105 transition-all text-sm"
                    >
                      <FileText className="w-4 h-4" /> {t('landing.upload.btn')}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-gold/15 border border-court-gold/30">
                      <ShieldCheck className="w-7 h-7 text-court-gold" />
                    </div>
                    <h3 className="mb-1 text-lg font-bold text-court-cream truncate max-w-[200px]" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="mb-8 text-xs text-court-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center w-full gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="px-5 py-2 font-semibold text-court-muted hover:text-court-cream hover:bg-white/5 rounded-full transition-colors text-sm"
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
                        className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{' '}
                            {t('landing.upload.analyzing')}
                          </>
                        ) : (
                          <>
                            {t('landing.upload.analyze')}{' '}
                            <ArrowRight className="w-4 h-4" />
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
              className="court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer group"
              onClick={() => navigate('/chat')}
            >
              <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Bot className="w-7 h-7 text-court-gold" />
              </div>
              <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
                {t('landing.chat.title')}
              </h3>
              <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
                {t('landing.chat.desc')}
              </p>

              <div className="flex flex-col gap-2 w-full mb-6">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/chat', {
                      state: { initialPrompt: 'I need to draft a legal notice.' },
                    });
                  }}
                  className="flex items-center justify-between px-4 py-1.5 text-xs text-left border rounded-lg bg-court-walnut/30 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream transition-all group/btn"
                >
                  {t('landing.chat.draftNotice')}{' '}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/chat', {
                      state: { initialPrompt: 'I need to draft a reply to a legal notice.' },
                    });
                  }}
                  className="flex items-center justify-between px-4 py-1.5 text-xs text-left border rounded-lg bg-court-walnut/30 border-court-gold/20 hover:border-court-gold/50 text-court-muted hover:text-court-cream transition-all group/btn"
                >
                  {t('landing.chat.replyNotice')}{' '}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/chat');
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
              >
                <MessageSquare className="w-4 h-4" /> {t('landing.chat.btn')}
              </button>
            </div>

            {/* Card 3: Scam Detector */}
            <div
              className="court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer group"
              onClick={() => navigate('/scam-detector')}
            >
              <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-7 h-7 text-court-gold" />
              </div>
              <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
                Scam Detector
              </h3>
              <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
                Analyze suspicious legal SMS, WhatsApp messages, or emails and receive risk scores with clear explanations.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/scam-detector');
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
              >
                Scan Text <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 4: Version Difference Analysis */}
            <div
              className="court-card court-card-gold-hover rounded-3xl p-8 flex flex-col items-center justify-center min-h-[340px] text-center cursor-pointer group"
              onClick={() => navigate('/version-diff')}
            >
              <div className="flex items-center justify-center w-14 h-14 mb-5 rounded-full bg-court-walnut border border-court-gold/40 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <GitCompare className="w-7 h-7 text-court-gold" />
              </div>
              <h3 className="mb-2 text-xl font-bold font-serif text-court-cream">
                Version Diff Analysis
              </h3>
              <p className="flex-1 mb-6 text-sm text-court-muted leading-relaxed">
                Compare two document versions side-by-side. Instantly spot new obligations, increased penalties, or hidden terms.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/version-diff');
                }}
                className="flex items-center justify-center gap-2 px-6 py-2.5 font-bold bg-court-gold hover:bg-yellow-500 text-court-walnut rounded-full shadow-lg hover:scale-105 transition-all text-sm"
              >
                Compare Versions <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Stylized Barrister / Justice SVG Illustration */}
        <div className="w-full lg:w-[38%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-radial-gradient from-court-gold/10 via-transparent to-transparent opacity-30 pointer-events-none"></div>

          <div className="w-full max-w-[340px] lg:max-w-full flex justify-center items-center relative animate-float">
            
            {/* Detailed Barrister SVG Illustration */}
            <svg viewBox="0 0 400 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-h-[80vh]">
              {/* Radial glow around justice scale */}
              <circle cx="280" cy="210" r="100" fill="url(#scale-glow)" opacity="0.45" />

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
              <path d="M194 210 L189 250 L199 250 Z M214 210 L219 250 L209 250 Z" fill="#e8e0d0" />
              <path d="M184 210 C194 195 214 195 224 210 Z" fill="#e8e0d0" stroke="#120c06" strokeWidth="1.5" />

              {/* Arm extending upward to support the scale */}
              <path d="M240 210 C260 180 280 140 280 110 C280 100 275 95 270 100 L260 120 C250 140 240 185 240 210 Z" fill="#120c06" />
              <circle cx="280" cy="100" r="8" fill="#d4a820" />

              {/* Balanced Gold Scales of Justice (Libra) */}
              <path d="M200 120 L360 120" stroke="#d4a820" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M280 100 L280 180" stroke="#d4a820" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="280" cy="120" r="6" fill="#d4a820" />

              {/* Left hanging pan */}
              <path d="M200 120 L185 170 M200 120 L215 170" stroke="#d4a820" strokeWidth="1.2" />
              <path d="M180 170 C180 177 220 177 220 170 Z" fill="#d4a820" />

              {/* Right hanging pan */}
              <path d="M360 120 L345 170 M360 120 L375 170" stroke="#d4a820" strokeWidth="1.2" />
              <path d="M340 170 C340 177 380 177 380 170 Z" fill="#d4a820" />

              <defs>
                <radialGradient id="scale-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
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
        <section className="relative z-10 w-full max-w-7xl px-6 mb-8 mx-auto">
          <RecentDocuments history={history} onClear={clearHistory} />
        </section>
      )}

      {/* Accordion FAQ + Courtroom Footer Section */}
      <section className="relative z-10 w-full pb-0 mt-8">
        <div className="w-full px-6 mx-auto max-w-7xl">
          {/* Courtroom Styled FAQ */}
          <div
            id="faq"
            className="p-8 border bg-court-walnut/90 border-court-gold/25 rounded-3xl md:p-10 shadow-2xl transition-colors duration-300"
          >
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-bold font-serif text-court-cream md:text-4xl">
                  {t('faq.title')}
                </h2>
                <p className="max-w-2xl mt-2 text-court-muted">
                  {t('faq.desc')}
                </p>
              </div>
            </div>

            <div className="columns-1 md:columns-2 gap-6 space-y-4">
              {[
                { q: t('faq.q1'), a: t('faq.a1') },
                { q: t('faq.q2'), a: t('faq.a2') },
                { q: t('faq.q3'), a: t('faq.a3') },
                { q: t('faq.q4'), a: t('faq.a4') },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="mb-4 break-inside-avoid p-5 transition-all duration-300 border rounded-xl border-court-gold/20 bg-court-walnut/50 hover:border-court-gold/45"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="flex items-center justify-between w-full gap-4 text-left cursor-pointer"
                  >
                    <span className="font-semibold text-court-cream">
                      {item.q}
                    </span>

                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 border transition-all duration-300 bg-court-walnut/30 border-court-gold/20 ${
                        openFaq === idx
                          ? 'rotate-45 bg-court-gold/10 border-court-gold/40'
                          : ''
                      }`}
                    >
                      <span className="text-court-gold">+</span>
                    </span>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === idx
                        ? 'max-h-40 opacity-100 mt-3'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="leading-relaxed text-court-muted text-sm">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Courtroom Footer */}
        <footer className="w-full mt-12 border-t border-court-gold/25 bg-court-walnut/95 backdrop-blur-xl z-20">
          <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              
              {/* Branding and Description */}
              <div className="max-w-md">
                <div className="flex items-center gap-2.5 text-xl font-bold text-court-cream">
                  <span className="inline-flex items-center justify-center w-9 h-9 border rounded-full bg-court-gold/15 border-court-gold/25">
                    <Scale className="w-4.5 h-4.5 text-court-gold" />
                  </span>
                  <span>
                    Nyaya<span className="text-court-gold font-semibold">Vanni</span>
                  </span>
                </div>
                <p className="mt-3.5 text-sm text-court-muted leading-relaxed">
                  Understand Indian legal documents in simple language. Upload contracts or notices and get clearer insights fast.
                </p>
              </div>

              {/* Links Sections */}
              <div className="grid w-full grid-cols-2 gap-8 sm:grid-cols-3 md:w-auto">
                <div>
                  <p className="mb-4 text-sm font-semibold text-court-cream tracking-wide uppercase">
                    Product
                  </p>
                  <div className="flex flex-col gap-2.5 text-sm text-court-muted">
                    <button
                      onClick={() => navigate('/chat')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Chat with AI
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>

                    <button
                      onClick={() => navigate('/document-generator')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Generate NDA{' '}
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Upload Document{' '}
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>
                    <button
                      onClick={() => navigate('/lawyers')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Hire a Lawyer
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>
                    <button
                      onClick={() => navigate('/version-diff')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Version Diff
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-sm font-semibold text-court-cream tracking-wide uppercase">
                    Resources
                  </p>
                  <div className="flex flex-col gap-2.5 text-sm text-court-muted">
                    <button
                      onClick={() => navigate('/faq')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      FAQ
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>
                    <button
                      onClick={() => navigate('/privacy-policy')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Privacy Policy{' '}
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>
                    <button
                      onClick={() => navigate('/terms')}
                      className={`${footerLinkClass} flex items-center gap-1`}
                    >
                      Terms of Service{' '}
                      <ChevronRight className="w-3 h-3 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-4 text-sm font-semibold text-court-cream tracking-wide uppercase">
                    Contact
                  </p>
                  <div className="flex flex-col gap-2.5 text-sm text-court-muted">
                    <a
                      href="mailto:support@nyayavanni.com"
                      className="transition-all duration-300 ease-out hover:text-court-gold hover:translate-x-1 hover:[text-shadow:0_0_4px_rgba(212,168,32,0.4)]"
                    >
                      support@nyayavanni.com
                    </a>
                    <span className="text-xs text-court-muted/70">
                      Mon–Fri, 10AM–6PM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-start justify-between gap-4 pt-6 mt-8 border-t border-court-gold/20 sm:flex-row">
              <p className="text-xs text-court-muted text-center sm:text-left mt-1">
                © {new Date().getFullYear()} NyayaVanni. All rights reserved.
              </p>

              {/* Gold Accented Social Links */}
              <div className="flex items-center gap-5">
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="w-4.5 h-4.5" />
                </a>
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="GitHub"
                >
                  <Github className="w-4.5 h-4.5" />
                </a>
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4.5 h-4.5" />
                </a>
                <a
                  href="#"
                  className="text-court-muted hover:text-court-gold transition-all duration-300 hover:-translate-y-1 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4.5 h-4.5" />
                </a>
              </div>

              <p className="text-xs text-court-muted text-center sm:text-right mt-1 italic">
                Not legal advice. For professional help, consult a lawyer.
              </p>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
