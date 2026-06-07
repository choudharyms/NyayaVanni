import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import GeneralChat from './pages/GeneralChat';
import HireLawyer from './pages/HireLawyer';
import FAQ from "./pages/FAQ";
import ScamDetector from "./pages/ScamDetector";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DocumentGenerator from "./pages/DocumentGenerator";
import VersionDiff from "./pages/VersionDiff";
import ContactUs from "./pages/ContactUs";
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConversationHistoryProvider } from './contexts/ConversationHistoryContext';
import { Globe } from 'lucide-react';
import NotFound from "./pages/NotFound";

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
    <ThemeProvider>
      <LanguageProvider>
        <ConversationHistoryProvider>
          <Router>
            {/* Theme-Responsive Root Layout Wrapper */}
            <div className="min-h-screen font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-nyaya-500 selection:text-white relative transition-colors duration-300">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard/:documentId" element={<Dashboard />} />
              <Route path="/chat" element={<GeneralChat />} />
              <Route path="/lawyers" element={<HireLawyer />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/scam-detector" element={<ScamDetector />} />
              <Route path="/document-generator" element={<DocumentGenerator />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/version-diff" element={<VersionDiff />} />
              <Route path="/*" element={<NotFound />} />
            </Routes>
            
            {/* Pinned Controls Layout */}
            <div className="fixed bottom-6 right-6 z-50">
              <LanguageToggle />
            </div>
            </div>
          </Router>
        </ConversationHistoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
