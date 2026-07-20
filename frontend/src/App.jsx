import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import GeneralChat from './pages/GeneralChat';
import HireLawyer from './pages/HireLawyer';
import FAQ from './pages/FAQ';
import ScamDetector from './pages/ScamDetector';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DocumentGenerator from './pages/DocumentGenerator';
import VersionDiff from './pages/VersionDiff';
import ContactUs from './pages/ContactUs';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConversationHistoryProvider } from './contexts/ConversationHistoryContext';
import NotFound from './pages/NotFound';
import LanguageSwitcher from './components/LanguageSwitcher';
import BackToTop from './components/Backtotop';
import ScrollToTop from './components/Scrolltotop';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConversationHistoryProvider>
          <Router>
            <ScrollToTop />
            {/* Theme-Responsive Root Layout Wrapper */}
            <div className="selection:bg-nyaya-500 relative min-h-screen bg-slate-50 font-sans text-slate-900 transition-colors duration-300 selection:text-white dark:bg-slate-950 dark:text-slate-100">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard/:documentId" element={<Dashboard />} />
                <Route path="/chat" element={<GeneralChat />} />
                <Route path="/lawyers" element={<HireLawyer />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/scam-detector" element={<ScamDetector />} />
                <Route
                  path="/document-generator"
                  element={<DocumentGenerator />}
                />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/version-diff" element={<VersionDiff />} />
                <Route path="/*" element={<NotFound />} />
              </Routes>

              <BackToTop />

              {/* Pinned Language Switcher */}
              <div className="fixed right-6 bottom-6 z-50 shadow-xl">
                <LanguageSwitcher />
              </div>
            </div>
          </Router>
        </ConversationHistoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
