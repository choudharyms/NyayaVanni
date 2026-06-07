/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Define supported languages to enable validation
const SUPPORTED_LANGUAGES = ['en', 'hi'];
const DEFAULT_LANGUAGE = 'en';

// Validate and sanitize language value
const isValidLanguage = (lang) => SUPPORTED_LANGUAGES.includes(lang);

const getSafeLanguage = (storedValue) => {
  // Fallback to default if invalid or missing
  return isValidLanguage(storedValue) ? storedValue : DEFAULT_LANGUAGE;
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Validate stored language value before using
    const stored = localStorage.getItem('nyaya_language');
    const safe = getSafeLanguage(stored);
    // Clean up localStorage if it contained invalid value
    if (stored !== safe) {
      localStorage.setItem('nyaya_language', safe);
    }
    return safe;
  });

  useEffect(() => {
    // Always validate before persisting to localStorage
    const validLang = getSafeLanguage(language);
    localStorage.setItem('nyaya_language', validLang);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  // Simple hardcoded translations for the MVP
  const translations = {
    en: {
      "nav.hire": "Hire a Lawyer",
      "nav.signin": "Sign In",
      "nav.directory": "Legal Experts Directory",
      "nav.contact": "Contact Us",
      "landing.hero.title1": "Understand Indian Legal",
      "landing.hero.title2": "Documents in",
      "landing.hero.title3": "Seconds.",
      "landing.hero.subtitle": "Upload any notice, contract, or FIR. NyayaVanni decodes complex legal jargon, detects risks, and explains your rights in simple terms.",
      "landing.upload.title": "Upload Document",
      "landing.upload.desc": "Drag and drop your PDF or Image here, or click to browse.",
      "landing.upload.btn": "Select File",
      "landing.upload.analyze": "Analyze",
      "landing.upload.analyzing": "Analyzing...",
      "landing.upload.cancel": "Cancel",
      "landing.chat.title": "Chat with AI",
      "landing.chat.desc": "Ask general legal questions, explore your rights, and get instant answers based on Indian law.",
      "landing.chat.btn": "Start Chatting",
      "landing.chat.draftNotice": "Draft a Legal Notice",
      "landing.chat.replyNotice": "Draft a Notice Reply",
      "dashboard.doctype": "Document Type",
      "dashboard.risk": "Risk",
      "dashboard.status": "Status",
      "dashboard.sections": "Key Sections",
      "dashboard.parties": "Parties Involved",
      "dashboard.consequences": "Key Consequences",
      "dashboard.actions": "Recommended Actions",
      "dashboard.btn.detailed": "Request Detailed Analysis",
      "dashboard.consult.title": "Legal Consultation Recommended",
      "dashboard.consult.btn": "Find a Lawyer",
      "chat.placeholder": "Ask a legal question...",
      "lawyers.title": "Find the Right Legal Expert",
      "lawyers.disclaimer": "This is an informational directory. BCI rules prohibit lawyer advertisements.",
      "lawyers.search": "Search by name, location, or specialty...",
      "lawyers.book": "Request Consultation",
      // FAQ translations
      "faq.title": "FAQ",
      "faq.desc": "Common questions about NyayaVanni.",
      "faq.q1": "What file types are supported?",
      "faq.a1": "You can upload PDF, Word document (.docx), PNG, and JPG files. For best results, use clear scans with readable text.",
      "faq.q2": "Is my document stored permanently?",
      "faq.a2": "By default, documents are processed for analysis. If storage is enabled, you may see history features; otherwise, files are handled temporarily.",
      "faq.q3": "Can I trust the output as legal advice?",
      "faq.a3": "NyayaVanni simplifies and explains. For critical decisions, consult a licensed lawyer.",
      "faq.q4": "What if the upload fails?",
      "faq.a4": "Check your internet connection and try a smaller file. If the backend is offline, you’ll be redirected to a fallback demo."
    },
    hi: {
      "nav.hire": "वकील नियुक्त करें",
      "nav.signin": "साइन इन करें",
      "nav.directory": "कानूनी विशेषज्ञ निर्देशिका",
      "nav.contact": "संपर्क करें",
      "landing.hero.title1": "भारतीय कानूनी दस्तावेजों को",
      "landing.hero.title2": "समझें",
      "landing.hero.title3": "सेकंडों में।",
      "landing.hero.subtitle": "कोई भी नोटिस, अनुबंध या FIR अपलोड करें। न्यायवाणी जटिल कानूनी शब्दावली को डिकोड करता है, जोखिमों का पता लगाता है, और आपके अधिकारों को सरल शब्दों में समझाता है।",
      "landing.upload.title": "दस्तावेज़ अपलोड करें",
      "landing.upload.desc": "अपनी PDF या इमेज यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें।",
      "landing.upload.btn": "फ़ाइल चुनें",
      "landing.upload.analyze": "विश्लेषण करें",
      "landing.upload.analyzing": "विश्लेषण हो रहा है...",
      "landing.upload.cancel": "रद्द करें",
      "landing.chat.title": "AI के साथ चैट करें",
      "landing.chat.desc": "सामान्य कानूनी प्रश्न पूछें, अपने अधिकारों का अन्वेषण करें, और भारतीय कानून के आधार पर त्वरित उत्तर प्राप्त करें।",
      "landing.chat.btn": "चैट शुरू करें",
      "landing.chat.draftNotice": "कानूनी नोटिस ड्राफ्ट करें",
      "landing.chat.replyNotice": "नोटिस का जवाब ड्राफ्ट करें",
      "dashboard.doctype": "दस्तावेज़ का प्रकार",
      "dashboard.risk": "जोखिम",
      "dashboard.status": "स्थिति",
      "dashboard.sections": "प्रमुख धाराएं",
      "dashboard.parties": "शामिल पक्ष",
      "dashboard.consequences": "प्रमुख परिणाम",
      "dashboard.actions": "अनुशंसित कार्रवाइयां",
      "dashboard.btn.detailed": "विस्तृत विश्लेषण का अनुरोध करें",
      "dashboard.consult.title": "कानूनी परामर्श की सिफारिश की गई",
      "dashboard.consult.btn": "वकील खोजें",
      "chat.placeholder": "कानूनी प्रश्न पूछें...",
      "lawyers.title": "सही कानूनी विशेषज्ञ खोजें",
      "lawyers.disclaimer": "यह एक सूचनात्मक निर्देशिका है। बीसीआई नियम वकील विज्ञापनों को प्रतिबंधित करते हैं।",
      "lawyers.search": "नाम, स्थान या विशेषज्ञता से खोजें...",
      "lawyers.book": "परामर्श बुक करें",
      // FAQ translations
      "faq.title": "प्रश्नोत्तरी (FAQ)",
      "faq.desc": "NyayaVanni के बारे में सामान्य प्रश्न।",
      "faq.q1": "कौन से फ़ाइल फ़ॉर्मेट समर्थित हैं?",
      "faq.a1": "PDF, PNG और JPG समर्थित हैं।",
      "faq.q2": "क्या NyayaVanni कानूनी सलाह है?",
      "faq.a2": "नहीं। यह सरल व्याख्या प्रदान करता है। महत्वपूर्ण निर्णयों के लिए वकील से सलाह लें।",
      "faq.q3": "यह कैसे काम करता है?",
      "faq.a3": "हम टेक्स्ट निकालते हैं और AI की मदद से सारांश, जोखिम पहचान और प्रश्नों के उत्तर प्रदान करते हैं।",
      "faq.q4": "क्या मेरा डेटा सुरक्षित है?",
      "faq.a4": "हम मानक सुरक्षा प्रक्रियाओं का पालन करते हैं, लेकिन कोई भी प्रणाली पूरी तरह जोखिम-मुक्त नहीं होती।"
    }
  };

  const t = (key) => {
    // Defensive: ensure language is valid before accessing translations
    const safeLang = getSafeLanguage(language);
    return translations[safeLang]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
