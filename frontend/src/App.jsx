import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import GeneralChat from './pages/GeneralChat';
import HireLawyer from './pages/HireLawyer';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button 
      onClick={toggleLanguage}
      className="bg-slate-900 text-white p-3 rounded-full shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 font-bold ring-2 ring-white/10"
      title="Toggle Language"
    >
      <Globe className="w-5 h-5" />
      <span className="uppercase text-sm">{language === 'en' ? 'EN' : 'HI'}</span>
    </button>
  );
};

function App() {
  return (
    <LanguageProvider>
      <Router>
        {/* Permanently Dark Root Layout Wrapper */}
        <div className="min-h-screen font-sans bg-slate-950 text-slate-100 selection:bg-nyaya-500 selection:text-white relative">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard/:documentId" element={<Dashboard />} />
            <Route path="/chat" element={<GeneralChat />} />
            <Route path="/lawyers" element={<HireLawyer />} />
          </Routes>
          
          {/* Pinned Controls Layout */}
          <div className="fixed bottom-6 right-6 z-50">
            <LanguageToggle />
          </div>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;