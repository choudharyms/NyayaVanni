import React, { useState, useRef } from 'react';
import { UploadCloud, ShieldCheck, Scale, FileText, ArrowRight, Loader2, Bot, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

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
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      
      // Navigate to Dashboard with the document ID
      navigate(`/dashboard/${data.documentId}`, { state: { file } }); // Pass file for MVP purely to avoid re-downloading if needed
    } catch (error) {
      console.error(error);
      // Fallback for MVP local test if API isn't up
      setTimeout(() => {
        navigate(`/dashboard/demo-doc-123`, { state: { file } });
      }, 1500);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-100 flex flex-col items-center">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-nyaya-500/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>

      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white cursor-pointer" onClick={() => navigate('/')}>
          <Scale className="text-nyaya-500 w-8 h-8" />
          Nyaya<span className="text-nyaya-500">Vanni</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/lawyers')}
            className="text-white px-5 py-2 rounded-full font-medium transition-colors hover:text-nyaya-400 hidden sm:block"
          >
            {t("nav.hire")}
          </button>
          <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full font-medium transition-colors border border-white/10 backdrop-blur-md">
            {t("nav.signin")}
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center text-center z-10 pb-24 pt-12">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-nyaya-500/10 border border-nyaya-500/20 text-nyaya-400 font-medium text-sm animate-pulse-soft">
          Powered by Advanced AI
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          {t("landing.hero.title1")} <br/> {t("landing.hero.title2")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-nyaya-400 to-blue-400">{t("landing.hero.title3")}</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12">
          {t("landing.hero.subtitle")}
        </p>

        {/* Actions Area */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center relative z-10">
          
          {/* Upload Document Card */}
          <div className="w-full relative animate-float group" style={{ animationDelay: '0s' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-nyaya-500/20 to-blue-500/20 rounded-[2rem] blur-xl transform translate-y-2 translate-x-1 -z-10 transition-all duration-500 group-hover:blur-2xl group-hover:scale-105"></div>
            <div 
              className={`h-full bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-10 border-2 transition-all duration-300 flex flex-col items-center justify-center min-h-[360px]
                ${dragActive ? 'border-nyaya-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-2 cursor-pointer'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={inputRef} type="file" className="hidden" 
                accept="application/pdf,image/png,image/jpeg"
                onChange={handleChange} 
              />
              
              {!file ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-700 group-hover:scale-110 group-hover:bg-slate-700 transition-all duration-300">
                    <UploadCloud className="w-8 h-8 text-nyaya-400 group-hover:text-nyaya-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{t("landing.upload.title")}</h3>
                  <p className="text-slate-400 mb-8 whitespace-pre-line text-base flex-1">
                    {t("landing.upload.desc")}
                  </p>
                  <button 
                    onClick={onButtonClick}
                    className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-900 px-8 py-3 rounded-full font-semibold transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-105"
                  >
                    <FileText className="w-5 h-5" /> {t("landing.upload.btn")}
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center w-full h-full justify-center">
                  <div className="w-16 h-16 rounded-full bg-nyaya-500/20 flex items-center justify-center mb-6 ring-1 ring-nyaya-500/50">
                    <ShieldCheck className="w-8 h-8 text-nyaya-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white truncate max-w-[200px]" title={file.name}>{file.name}</h3>
                  <p className="text-slate-400 text-sm mb-10">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="px-6 py-3 rounded-full font-medium transition-colors hover:bg-slate-800 text-slate-300" disabled={loading}>
                      {t("landing.upload.cancel")}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} 
                      disabled={loading}
                      className="bg-nyaya-500 hover:bg-nyaya-400 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg shadow-nyaya-500/25 flex items-center justify-center gap-2 disabled:opacity-70 hover:scale-105"
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
          <div className="w-full relative animate-float group" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-[2rem] blur-xl transform translate-y-2 translate-x-1 -z-10 transition-all duration-500 group-hover:blur-2xl group-hover:scale-105"></div>
            <div className="h-full bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-10 border-2 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80 transition-all duration-300 flex flex-col items-center justify-center min-h-[360px] hover:-translate-y-2 cursor-pointer" onClick={() => navigate('/chat')}>
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-700 group-hover:scale-110 group-hover:bg-slate-700 transition-all duration-300">
                <Bot className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{t("landing.chat.title")}</h3>
              <p className="text-slate-400 mb-8 text-center text-base max-w-xs flex-1">
                {t("landing.chat.desc")}
              </p>
              
              <div className="flex flex-col gap-3 w-full max-w-[250px] mb-8">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/chat', { state: { initialPrompt: "I need to draft a legal notice." } }); }}
                  className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg py-2 px-4 text-sm text-slate-300 transition-colors text-left flex justify-between items-center group/btn"
                >
                  {t("landing.chat.draftNotice")} <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate('/chat', { state: { initialPrompt: "I need to draft a reply to a legal notice." } }); }}
                  className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg py-2 px-4 text-sm text-slate-300 transition-colors text-left flex justify-between items-center group/btn"
                >
                  {t("landing.chat.replyNotice")} <ArrowRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </button>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/chat'); }}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 hover:scale-105"
              >
                <MessageSquare className="w-5 h-5" /> {t("landing.chat.btn")}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
