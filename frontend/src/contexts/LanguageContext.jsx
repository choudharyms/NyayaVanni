/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const SUPPORTED_LANGUAGES = ['en', 'hi', 'ta'];
const DEFAULT_LANGUAGE = 'en';

const isValidLanguage = (lang) => SUPPORTED_LANGUAGES.includes(lang);

const getSafeLanguage = (storedValue) => {
  return isValidLanguage(storedValue) ? storedValue : DEFAULT_LANGUAGE;
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('nyaya_language');
    const safe = getSafeLanguage(stored);
    if (stored !== safe) {
      localStorage.setItem('nyaya_language', safe);
    }
    return safe;
  });

  useEffect(() => {
    const validLang = getSafeLanguage(language);
    localStorage.setItem('nyaya_language', validLang);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      if (prev === 'en') return 'hi';
      if (prev === 'hi') return 'ta';
      return 'en';
    });
  };

  const translations = {
    en: {
      'nav.hire': 'Hire a Lawyer',
      'nav.signin': 'Sign In',
      'nav.directory': 'Legal Experts Directory',
      'nav.contact': 'Contact Us',
      'landing.hero.title1': 'Understand Indian Legal',
      'landing.hero.title2': 'Documents in',
      'landing.hero.title3': 'Seconds.',
      'landing.hero.subtitle':
        'Upload any notice, contract, or FIR. NyayaVanni decodes complex legal jargon, identifies risks, and explains your rights in simple terms.',
      'landing.upload.title': 'Upload Document',
      'landing.upload.desc':
        'Drag and drop your PDF or image here, or click to browse.',
      'landing.upload.btn': 'Select File',
      'landing.upload.analyze': 'Analyze',
      'landing.upload.analyzing': 'Analyzing...',
      'landing.upload.cancel': 'Cancel',
      'landing.chat.title': 'Chat with AI',
      'landing.chat.desc':
        'Ask general legal questions, explore your rights, and get immediate answers grounded in Indian law.',
      'landing.chat.btn': 'Start Chatting',
      'landing.chat.draftNotice': 'Draft a Legal Notice',
      'landing.chat.replyNotice': 'Draft a Notice Reply',
      'dashboard.doctype': 'Document Type',
      'dashboard.risk': 'Risk',
      'dashboard.status': 'Status',
      'dashboard.sections': 'Key Sections',
      'dashboard.parties': 'Parties Involved',
      'dashboard.consequences': 'Key Consequences',
      'dashboard.actions': 'Recommended Actions',
      'dashboard.btn.detailed': 'Request Detailed Analysis',
      'dashboard.consult.title': 'Legal Consultation Recommended',
      'dashboard.consult.btn': 'Find a Lawyer',
      'dashboard.kg.download': 'Download Image',
      'chat.placeholder': 'Ask a legal question...',
      'lawyers.title': 'Find the Right Legal Expert',
      'lawyers.disclaimer':
        'This is an informational directory. BCI rules prohibit lawyer advertisements.',
      'lawyers.search': 'Search by name, location, or specialty...',
      'lawyers.book': 'Request Consultation',
      'faq.title': 'FAQ',
      'faq.desc': 'Common questions about NyayaVanni.',
      'faq.q1': 'What file types are supported?',
      'faq.a1':
        'You can upload PDF, Word document (.docx), PNG, or JPG files. For best results, use clear scans with readable text.',
      'faq.q2': 'Is my document stored permanently?',
      'faq.a2':
        'By default, documents are processed for analysis. If storage is enabled, you may see history features; otherwise, files are handled only temporarily.',
      'faq.q3': 'Can I trust the output as legal advice?',
      'faq.a3':
        'NyayaVanni provides simplified explanations and insights. For critical decisions, consult a licensed lawyer.',
      'faq.q4': 'What if the upload fails?',
      'faq.a4':
        "Check your internet connection and try uploading a smaller file. If the backend is offline, you'll be redirected to a fallback demo.",
    },
    hi: {
      'nav.hire': 'वकील नियुक्त करें',
      'nav.signin': 'साइन इन करें',
      'nav.directory': 'कानूनी विशेषज्ञ निर्देशिका',
      'nav.contact': 'संपर्क करें',
      'landing.hero.title1': 'भारतीय कानूनी दस्तावेजों को',
      'landing.hero.title2': 'समझें',
      'landing.hero.title3': 'सेकंडों में।',
      'landing.hero.subtitle':
        'कोई भी नोटिस, अनुबंध या FIR अपलोड करें। न्यायवाणी जटिल कानूनी शब्दावली को डिकोड करता है, जोखिमों का पता लगाता है, और आपके अधिकारों को सरल शब्दों में समझाता है।',
      'landing.upload.title': 'दस्तावेज़ अपलोड करें',
      'landing.upload.desc':
        'अपनी PDF या इमेज यहाँ खींचें और छोड़ें, या ब्राउज़ करने के लिए क्लिक करें।',
      'landing.upload.btn': 'फ़ाइल चुनें',
      'landing.upload.analyze': 'विश्लेषण करें',
      'landing.upload.analyzing': 'विश्लेषण हो रहा है...',
      'landing.upload.cancel': 'रद्द करें',
      'landing.chat.title': 'AI के साथ चैट करें',
      'landing.chat.desc':
        'सामान्य कानूनी प्रश्न पूछें, अपने अधिकारों का अन्वेषण करें, और भारतीय कानून के आधार पर त्वरित उत्तर प्राप्त करें।',
      'landing.chat.btn': 'चैट शुरू करें',
      'landing.chat.draftNotice': 'कानूनी नोटिस ड्राफ्ट करें',
      'landing.chat.replyNotice': 'नोटिस का जवाब ड्राफ्ट करें',
      'dashboard.doctype': 'दस्तावेज़ का प्रकार',
      'dashboard.risk': 'जोखिम',
      'dashboard.status': 'स्थिति',
      'dashboard.sections': 'प्रमुख धाराएं',
      'dashboard.parties': 'शामिल पक्ष',
      'dashboard.consequences': 'प्रमुख परिणाम',
      'dashboard.actions': 'अनुशंसित कार्रवाइयां',
      'dashboard.btn.detailed': 'विस्तृत विश्लेषण का अनुरोध करें',
      'dashboard.consult.title': 'कानूनी परामर्श की सिफारिश की गई',
      'dashboard.consult.btn': 'वकील खोजें',
      'dashboard.kg.download': 'छवि डाउनलोड करें',
      'chat.placeholder': 'कानूनी प्रश्न पूछें...',
      'lawyers.title': 'सही कानूनी विशेषज्ञ खोजें',
      'lawyers.disclaimer':
        'यह एक सूचनात्मक निर्देशिका है। बीसीआई नियम वकील विज्ञापनों को प्रतिबंधित करते हैं।',
      'lawyers.search': 'नाम, स्थान या विशेषज्ञता से खोजें...',
      'lawyers.book': 'परामर्श बुक करें',
      'faq.title': 'प्रश्नोत्तरी (FAQ)',
      'faq.desc': 'NyayaVanni के बारे में सामान्य प्रश्न।',
      'faq.q1': 'कौन से फ़ाइल फ़ॉर्मेट समर्थित हैं?',
      'faq.a1':
        'PDF, Word दस्तावेज़ (.docx), PNG, या JPG फ़ाइलें अपलोड की जा सकती हैं।',
      'faq.q2': 'क्या मेरा दस्तावेज़ स्थायी रूप से संग्रहीत है?',
      'faq.a2':
        'डॉक्यूमेंट्स को पहले विश्लेषण के लिए संसाधित किया जाता है। फ़ाइलें केवल अस्थायी रूप से रखी जाती हैं।',
      'faq.q3': 'क्या मैं आउटपुट को कानूनी सलाह मान सकता हूँ?',
      'faq.a3':
        'NyayaVanni सरल व्याख्या प्रदान करता है। महत्वपूर्ण निर्णयों के लिए वकील से परामर्श करें।',
      'faq.q4': 'अपलोड विफल हो जाए तो?',
      'faq.a4': 'अपना इंटरनेट कनेक्शन जांचें और छोटी फ़ाइल अपलोड करें।',
    },
    ta: {
      'nav.hire': 'வழக்கறிஞரை நியமிக்கவும்',
      'nav.signin': 'உள்நுழைக',
      'nav.directory': 'சட்ட நிபுணர் அடைவு',
      'nav.contact': 'தொடர்பு கொள்ளுங்கள்',
      'landing.hero.title1': 'இந்திய சட்ட ஆவணங்களை',
      'landing.hero.title2': 'புரிந்துகொள்ளுங்கள்',
      'landing.hero.title3': 'நொடிகளில்.',
      'landing.hero.subtitle':
        'எந்த நோட்டீஸ், ஒப்பந்தம் அல்லது FIR ஐ பதிவேற்றவும். NyayaVanni சிக்கலான சட்ட வார்த்தைகளை புரிந்துகொள்ள உதவுகிறது.',
      'landing.upload.title': 'ஆவணத்தை பதிவேற்றவும்',
      'landing.upload.desc':
        'உங்கள் PDF அல்லது படத்தை இங்கே இழுத்து விடுங்கள், அல்லது உலாவ கிளிக் செய்யுங்கள்.',
      'landing.upload.btn': 'கோப்பை தேர்ந்தெடுக்கவும்',
      'landing.upload.analyze': 'பகுப்பாய்வு செய்யவும்',
      'landing.upload.analyzing': 'பகுப்பாய்வு நடக்கிறது...',
      'landing.upload.cancel': 'ரத்து செய்யவும்',
      'landing.chat.title': 'AI உடன் அரட்டை',
      'landing.chat.desc':
        'பொதுவான சட்ட கேள்விகளை கேளுங்கள், உங்கள் உரிமைகளை அறியுங்கள்.',
      'landing.chat.btn': 'அரட்டை தொடங்கவும்',
      'landing.chat.draftNotice': 'சட்ட நோட்டீஸ் வரைவு',
      'landing.chat.replyNotice': 'நோட்டீஸுக்கு பதில் வரைவு',
      'dashboard.doctype': 'ஆவண வகை',
      'dashboard.risk': 'அபாயம்',
      'dashboard.status': 'நிலை',
      'dashboard.sections': 'முக்கிய பிரிவுகள்',
      'dashboard.parties': 'சம்பந்தப்பட்ட தரப்பினர்',
      'dashboard.consequences': 'முக்கிய விளைவுகள்',
      'dashboard.actions': 'பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்',
      'dashboard.btn.detailed': 'விரிவான பகுப்பாய்வு கோரவும்',
      'dashboard.consult.title': 'சட்ட ஆலோசனை பரிந்துரைக்கப்படுகிறது',
      'dashboard.consult.btn': 'வழக்கறிஞரை கண்டுபிடிக்கவும்',
      'dashboard.kg.download': 'படத்தைப் பதிவிறக்குக',
      'chat.placeholder': 'சட்ட கேள்வி கேளுங்கள்...',
      'lawyers.title': 'சரியான சட்ட நிபுணரை கண்டுபிடிக்கவும்',
      'lawyers.disclaimer':
        'இது ஒரு தகவல் அடைவு. BCI விதிகள் வழக்கறிஞர் விளம்பரங்களை தடைசெய்கின்றன.',
      'lawyers.search': 'பெயர், இடம் அல்லது நிபுணத்துவம் மூலம் தேடுங்கள்...',
      'lawyers.book': 'ஆலோசனை கோரவும்',
      'faq.title': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
      'faq.desc': 'NyayaVanni பற்றிய பொதுவான கேள்விகள்.',
      'faq.q1': 'எந்த கோப்பு வகைகள் ஆதரிக்கப்படுகின்றன?',
      'faq.a1':
        'PDF, Word ஆவணம் (.docx), PNG, அல்லது JPG கோப்புகளை பதிவேற்றலாம்.',
      'faq.q2': 'என் ஆவணம் நிரந்தரமாக சேமிக்கப்படுமா?',
      'faq.a2':
        'ஆவணங்கள் பகுப்பாய்வுக்காக மட்டுமே செயலாக்கப்படுகின்றன, தற்காலிகமாக மட்டுமே வைக்கப்படுகின்றன.',
      'faq.q3': 'வெளியீட்டை சட்ட ஆலோசனையாக நம்பலாமா?',
      'faq.a3':
        'NyayaVanni எளிமையான விளக்கங்களை வழங்குகிறது. முக்கியமான முடிவுகளுக்கு வழக்கறிஞரை அணுகவும்.',
      'faq.q4': 'பதிவேற்றம் தோல்வியடைந்தால்?',
      'faq.a4': 'இணைய இணைப்பை சரிபார்த்து சிறிய கோப்பை பதிவேற்றவும்.',
    },
  };

  const t = (key) => {
    const safeLang = getSafeLanguage(language);
    return (
      translations[safeLang]?.[key] ||
      translations[DEFAULT_LANGUAGE]?.[key] ||
      key
    );
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
