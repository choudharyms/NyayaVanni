import React, { useState, useRef } from 'react';
import { UploadCloud, ShieldCheck, Scale, FileText, ArrowRight, Loader2, Bot, MessageSquare } from 'lucide-react';
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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
    
    // Simulate MVP File Upload -> Fast API
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
      
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      
      // Navigate to Dashboard with the document ID
      navigate(`/dashboard/${data.documentId}`, { state: { file } }); // Pass file for MVP purely to avoid re-downloading if needed
    } catch (error) {
      console.error(error);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Check if we're in production but still pointing to localhost
      if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
        alert("Configuration Error: The app is trying to connect to a local server (localhost) while deployed. Please set the VITE_API_URL environment variable in your Vercel dashboard.");
      }
      
      // Fallback for MVP local test if API isn't up
      setTimeout(() => {
        navigate(`/dashboard/demo-doc-123`, { state: { file } });
      }, 1500);
    }
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-nyaya-500/10 dark:bg-nyaya-500/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[150px] mix-blend-multiply dark:mix-blend-screen pointer-events-none"></div>

      <nav className="z-10 flex items-center justify-between w-full px-6 py-6 mx-auto max-w-7xl">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-800 dark:text-white cursor-pointer" onClick={() => navigate('/')}>
          <Scale className="w-8 h-8 text-nyaya-500" />
          <span>Nyaya<span className="text-nyaya-500">Vanni</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/lawyers')}
            className="hidden px-5 py-2 font-medium text-slate-700 hover:text-nyaya-600 dark:text-white dark:hover:text-nyaya-400 transition-colors rounded-full sm:block cursor-pointer"
          >
            {t("nav.hire")}
          </button>
          <button 
            onClick={() => navigate('/contact')}
            className="hidden px-5 py-2 font-medium text-slate-700 hover:text-nyaya-600 dark:text-white dark:hover:text-nyaya-400 transition-colors rounded-full sm:block cursor-pointer"
          >
            {t("nav.contact")}
          </button>
          <button className="px-5 py-2 font-medium text-slate-800 hover:bg-slate-100 dark:text-white dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/10 rounded-full backdrop-blur-md transition-all">
            {t("nav.signin")}
          </button>
          <ThemeToggle />
        </div>
      </nav>

      <main className="z-10 flex flex-col items-center justify-center flex-1 w-full max-w-5xl px-6 pt-12 pb-24 mx-auto text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-nyaya-500/10 border border-nyaya-500/20 text-nyaya-600 dark:text-nyaya-400 font-medium text-sm animate-pulse-soft">
          Powered by Advanced AI
        </div>
        <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl text-slate-900 dark:text-white">
          {t("landing.hero.title1")} <br/> {t("landing.hero.title2")} <span className="text-transparent bg-clip-text bg-linear-to-r from-nyaya-500 to-blue-500 dark:from-nyaya-400 dark:to-blue-400">{t("landing.hero.title3")}</span>
        </h1>
        <p className="max-w-2xl mb-12 text-lg md:text-xl text-slate-600 dark:text-slate-400">
          {t("landing.hero.subtitle")}
        </p>

        {/* Actions Area */}
        <div className="relative z-10 grid justify-center w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          
          {/* Upload Document Card */}
          <div className="relative w-full animate-float group" style={{ animationDelay: '0s' }}>
            <div className="absolute inset-0 transition-all duration-500 transform translate-x-1 translate-y-2 bg-linear-to-r from-nyaya-500/10 dark:from-nyaya-500/20 to-blue-500/10 dark:to-blue-500/20 rounded-4xl blur-xl -z-10 group-hover:blur-2xl group-hover:scale-105"></div>
            <div 
              className={`h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-4xl p-10 border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-90
                ${dragActive ? 'border-nyaya-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-350 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:-translate-y-2 cursor-pointer'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={inputRef} type="file" className="hidden" 
                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/png,image/jpeg"
                onChange={handleChange} 
              />
              
              {!file ? (
                <>
                  <div className="flex items-center justify-center w-16 h-16 mb-6 transition-all duration-300 rounded-full shadow-inner bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 group-hover:scale-110 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                    <UploadCloud className="w-8 h-8 text-slate-500 dark:text-nyaya-400 group-hover:text-nyaya-600 dark:group-hover:text-nyaya-300" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-slate-850 dark:text-white">{t("landing.upload.title")}</h3>
                  <p className="flex-1 mb-8 text-base whitespace-pre-line text-slate-600 dark:text-slate-400">
                    {t("landing.upload.desc")}
                  </p>
                  <button 
                    onClick={onButtonClick}
                    className="flex items-center justify-center w-full gap-2 px-8 py-3 font-semibold transition-all bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-full shadow-lg sm:w-auto hover:scale-105"
                  >
                    <FileText className="w-5 h-5" /> {t("landing.upload.btn")}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-nyaya-500/15 dark:bg-nyaya-500/20 ring-1 ring-nyaya-500/30 dark:ring-nyaya-500/50">
                    <ShieldCheck className="w-8 h-8 text-nyaya-600 dark:text-nyaya-400" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-slate-850 dark:text-white truncate max-w-50" title={file.name}>{file.name}</h3>
                  <p className="mb-10 text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</p>
                  
                  <div className="flex flex-col justify-center w-full gap-4 sm:flex-row">
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="px-6 py-3 font-medium transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" disabled={loading}>
                      {t("landing.upload.cancel")}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} 
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-8 py-3 font-semibold text-white transition-all rounded-full shadow-lg bg-nyaya-500 hover:bg-nyaya-400 shadow-nyaya-500/15 dark:shadow-nyaya-500/25 disabled:opacity-70 hover:scale-105"
                    >
                      {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> {t("landing.upload.analyzing")}</>
                      ) : (
                        <>{t("landing.upload.analyze")} <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
 
          {/* Chat with Bot Card */}
          <div className="relative w-full animate-float group" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 transition-all duration-500 transform translate-x-1 translate-y-2 bg-linear-to-r from-purple-500/10 dark:from-purple-500/20 to-pink-500/10 dark:to-pink-500/20 rounded-4xl blur-xl -z-10 group-hover:blur-2xl group-hover:scale-105"></div>
            <div className="flex flex-col items-center justify-center h-full p-10 transition-all duration-300 border-2 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-4xl border-slate-200 dark:border-slate-700/50 hover:border-slate-350 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 min-h-90 hover:-translate-y-2" onClick={() => navigate('/chat')}>
              <div className="flex items-center justify-center w-16 h-16 mb-6 transition-all duration-300 rounded-full shadow-inner bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 group-hover:scale-110 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                <Bot className="w-8 h-8 text-purple-650 dark:text-purple-400 group-hover:text-purple-750 dark:group-hover:text-purple-300" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-850 dark:text-white">{t("landing.chat.title")}</h3>
              <p className="flex-1 max-w-xs mb-8 text-base text-center text-slate-600 dark:text-slate-400">
                {t("landing.chat.desc")}
              </p>
              
              <div className="flex flex-col gap-3 w-full max-w-62.5 mb-8">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/chat', { state: { initialPrompt: "I need to draft a legal notice." } }); }}
                  className="flex items-center justify-between px-4 py-2 text-sm text-left transition-colors border rounded-lg bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 dark:border-slate-700 dark:text-slate-300 group/btn"
                >
                  {t("landing.chat.draftNotice")} <ArrowRight className="w-4 h-4 transition-opacity opacity-0 group-hover/btn:opacity-100" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/chat', { state: { initialPrompt: "I need to draft a reply to a legal notice." } }); }}
                  className="flex items-center justify-between px-4 py-2 text-sm text-left transition-colors border rounded-lg bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 dark:border-slate-700 dark:text-slate-300 group/btn"
                >
                  {t("landing.chat.replyNotice")} <ArrowRight className="w-4 h-4 transition-opacity opacity-0 group-hover/btn:opacity-100" />
                </button>
              </div>
 
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/chat'); }}
                className="w-full sm:w-auto bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] dark:shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 hover:scale-105"
              >
                <MessageSquare className="w-5 h-5" /> {t("landing.chat.btn")}
              </button>
            </div>
          </div>
 
 
          {/* Scam Detector Card */}
          <div className="relative w-full animate-float group" style={{ animationDelay: '0.4s' }}>
            <div className="absolute inset-0 transition-all duration-500 transform translate-x-1 translate-y-2 bg-linear-to-r from-emerald-500/10 dark:from-emerald-500/20 to-cyan-500/10 dark:to-cyan-500/20 rounded-4xl blur-xl -z-10 group-hover:blur-2xl group-hover:scale-105"></div>
 
            <div
              className="flex flex-col items-center justify-center h-full p-10 transition-all duration-300 border-2 cursor-pointer bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-4xl border-slate-200 dark:border-slate-700/50 hover:border-slate-350 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 min-h-90 hover:-translate-y-2"
              onClick={() => navigate('/scam-detector')}
            >
              <div className="flex items-center justify-center w-16 h-16 mb-6 transition-all duration-300 rounded-full shadow-inner bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 group-hover:scale-110 group-hover:bg-slate-200 dark:group-hover:bg-slate-700">
                <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-555 dark:group-hover:text-emerald-300" />
              </div>
 
              <h3 className="mb-3 text-2xl font-bold text-slate-850 dark:text-white">Scam Detector</h3>
              <p className="flex-1 max-w-xs mb-8 text-base text-center text-slate-600 dark:text-slate-400">
                Analyze suspicious legal SMS/WhatsApp/email text and get a risk score + reasons.
              </p>
 
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/scam-detector'); }}
                className="w-full sm:w-auto bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] dark:shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 hover:scale-105"
              >
                Try Scam Detector <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        {/* Recent Documents History */}
        {history.length > 0 && (
          <div className="w-full max-w-lg mx-auto mt-8">
            <RecentDocuments history={history} onClear={clearHistory} />
          </div>
        )}
      </main>



      {/* FAQ + Footer */}
      <section className="z-10 w-full px-6 pb-16 mx-auto max-w-7xl">
        {/* FAQ */}
        <div
          id="faq"
          className="p-8 mt-6 border bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-4xl md:p-10 transition-colors duration-300"
        >
          <div className="flex items-start justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white md:text-4xl">FAQ</h2>
              <p className="max-w-2xl mt-2 text-slate-600 dark:text-slate-400">
                Quick answers about uploads, privacy, and how NyayaVanni helps you understand legal documents.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                q: "What file types are supported?",
                a: "You can upload PDF, Word Document (.docx), PNG, and JPG files. For best results, use clear scans and readable text."
              },
              {
                q: "Is my document stored permanently?",
                a: "By default, documents are processed for analysis. If storage is enabled, you may see history features; otherwise files are handled temporarily."
              },
              {
                q: "Can I trust the output as legal advice?",
                a: "NyayaVanni simplifies and explains. For critical decisions, consult a licensed lawyer."
              },
              {
                q: "What if the upload fails?",
                a: "Check your internet connection and try a smaller file. If the backend is offline, you’ll see a fallback demo navigation."
              },
            ].map((item, idx) => (
              <details key={idx}
                className="p-5 border group rounded-xl cursor-pointer  border-slate-200 dark:border-slate-700/50  bg-white/50 dark:bg-slate-950/40  transition-all duration-300  hover:-translate-y-1 hover:bg-white/80 dark:hover:bg-slate-900/70  hover:border-nyaya-400/50 dark:hover:border-nyaya-500/50  hover:shadow-lg hover:shadow-nyaya-500/10"
              >
                <summary className="flex items-center justify-between gap-4 list-none cursor-pointer">
                  <span className="font-semibold text-slate-800 dark:text-white">{item.q}</span>
                  <span className="flex items-center justify-center w-8 h-8 transition border rounded-full shrink-0 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 group-open:bg-slate-200 dark:group-open:bg-white/10">
                    <span className="transition-transform text-slate-600 dark:text-slate-300 group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="p-8 mt-10 border rounded-4xl border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-900/90 backdrop-blur-xl md:p-10 z-20">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            {/* Brand */}
            <div className="max-w-md">
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <span className="inline-flex items-center justify-center w-10 h-10 border rounded-full bg-nyaya-500/15 border-nyaya-500/25">
                  <Scale className="w-5 h-5 text-nyaya-400" />
                </span>
                <span>Nyaya<span className="text-nyaya-400">Vanni</span></span>
              </div>
              <p className="mt-3 text-slate-600 dark:text-slate-400">
                Understand Indian legal documents in simple language. Upload contracts/notices and get clearer insights fast.
              </p>
            </div>

            {/* Links */}
            <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:w-auto">
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Product</p>
                <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400">
                  <button onClick={() => navigate('/chat')} className="text-left transition hover:text-slate-900 dark:hover:text-white">Chat with AI</button>
                  <button onClick={() => navigate('/document-generator')} className="text-left transition hover:text-slate-900 dark:hover:text-white">Generate NDA</button>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-left transition hover:text-slate-900 dark:hover:text-white">Upload Document</button>
                  <button onClick={() => navigate('/lawyers')} className="text-left transition hover:text-slate-900 dark:hover:text-white">Hire a Lawyer</button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Resources</p>
                <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400">
                <button
                  onClick={() => navigate('/faq')}
                  className="text-left transition hover:text-slate-900 dark:hover:text-white"
                >
                  FAQ
                </button>
                  <button onClick={() => navigate('/privacy-policy')} className="text-left transition hover:text-slate-900 dark:hover:text-white">Privacy Policy</button>
                  <button onClick={() => navigate('/terms')} className="text-left transition hover:text-slate-900 dark:hover:text-white">Terms of Service</button>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Contact</p>
                <div className="flex flex-col gap-2 text-slate-600 dark:text-slate-400">
                  <a href="mailto:support@nyayavanni.com" className="transition hover:text-slate-900 dark:hover:text-white">support@nyayavanni.com</a>
                  <span className="text-sm text-slate-600 dark:text-slate-500">Mon–Fri, 10AM–6PM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 pt-6 mt-8 border-t border-slate-700/50 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600 dark:text-slate-500">
              © {new Date().getFullYear()} NyayaVanni. All rights reserved.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-500">
              Not legal advice. For professional help, consult a lawyer.
            </p>
          </div>
        </footer>
      </section>


    </div>
  );
}
