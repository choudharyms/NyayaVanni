import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('nyaya_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('nyaya_language', language);
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
      "lawyers.subtitle": "Connect with top-rated lawyers across India for specialized legal consultation tailored to your specific needs.",
      "lawyers.search": "Search by name, location, or specialty...",
      "lawyers.book": "Book Consultancy"
    },
    hi: {
      "nav.hire": "वकील नियुक्त करें",
      "nav.signin": "साइन इन करें",
      "nav.directory": "कानूनी विशेषज्ञ निर्देशिका",
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
      "lawyers.subtitle": "अपनी विशिष्ट आवश्यकताओं के अनुरूप विशेष कानूनी परामर्श के लिए पूरे भारत में शीर्ष रेटेड वकीलों से जुड़ें।",
      "lawyers.search": "नाम, स्थान या विशेषज्ञता से खोजें...",
      "lawyers.book": "परामर्श बुक करें"
    }
  };

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
