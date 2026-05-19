import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, User, Send, ArrowLeft, Scale, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../contexts/LanguageContext';

export default function GeneralChat() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  
  // Speech Assistant State
  const [isListening, setIsListening] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const recognitionRef = React.useRef(null);

  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', message: 'Hello! I am NyayaVanni Legal Assistant. How can I help you understand your legal rights today?' }
  ]);

  // Scroll to bottom on history change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Speech Recognition initialization
  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setChatInput(transcript);
        }
      };
      
      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
    
    // Stop any active speech on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Sync speech recognition language with site language context
  React.useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel(); // Stop active speaking
      setSpeakingIndex(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const toggleSpeak = (text, index) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      
      // Clean up markdown formatting characters for cleaner audio reading
      const cleanText = text.replace(/[*#`_\-]/g, '').trim();
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      
      // Find matching language voice
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;
      if (language === 'hi') {
        selectedVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      } else {
        selectedVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onend = () => {
        setSpeakingIndex(null);
      };
      utterance.onerror = () => {
        setSpeakingIndex(null);
      };
      
      setSpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const submitMessage = async (messageText, currentHistory) => {
    if (!messageText.trim()) return;

    const userMsg = { role: 'user', message: messageText };
    const newHistory = [...currentHistory, userMsg];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/chat/general`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: userMsg.message,
          chat_history: currentHistory,
          document_analysis: {}, // Empty for general chat
          language: language
        })
      });

      if (!response.ok) throw new Error("Chat failed");
      const data = await response.json();
      setChatHistory([...newHistory, { role: 'assistant', message: data.response }]);
    } catch (err) {
      console.error(err);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      let errorMessage = "I'm having trouble connecting to the server. Please try again later.";
      
      if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
        errorMessage = "Configuration Error: The app is trying to connect to a local server (localhost) while deployed. Please set the VITE_API_URL environment variable in your Vercel dashboard.";
      }

      setTimeout(() => {
        setChatHistory([...newHistory, { role: 'assistant', message: errorMessage }]);
        setChatLoading(false);
      }, 1000);
    } finally {
      setChatLoading(false);
    }
  };

  React.useEffect(() => {
    if (location.state?.initialPrompt) {
      submitMessage(location.state.initialPrompt, chatHistory);
      // Clear state to prevent re-triggering on navigation
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput('');
    await submitMessage(text, chatHistory);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Dark Navigation Header */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <Scale className="text-nyaya-500 w-6 h-6" /> NyayaVanni <span className="text-slate-500 font-medium hidden sm:inline">| Assistant</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col">
        {/* Main Chat Container Block */}
        <div className="flex-1 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
          
          {/* Scrollable Message Timeline Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950/20">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar Icon Wrapper */}
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-nyaya-500 text-white shadow-md' : 'bg-slate-850 border border-slate-700 text-slate-300'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                
                {/* Message Bubble Grid */}
                <div className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-nyaya-900 text-white rounded-tr-sm shadow-md border border-nyaya-800' : 'bg-slate-850/80 border border-slate-800 rounded-tl-sm text-slate-200'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="flex flex-col">
                      <div className="prose prose-sm max-w-none prose-li:my-0.5 prose-ul:my-1 prose-p:my-1 text-slate-200 prose-headings:text-white prose-strong:text-nyaya-400 prose-code:text-amber-200">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                      
                      {/* Premium AI Read Aloud Controller */}
                      <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-800/80 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleSpeak(msg.message, idx)}
                          className={`flex items-center gap-1.5 font-bold transition-all px-3 py-1.5 rounded-lg border cursor-pointer
                            ${speakingIndex === idx 
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse' 
                              : 'bg-slate-800/60 border-slate-700/50 text-slate-450 hover:text-slate-200 hover:bg-slate-800 hover:border-slate-600'}`}
                        >
                          {speakingIndex === idx ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" /> Stop Speaking
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" /> Read Aloud
                            </>
                          )}
                        </button>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">
                          {language === 'hi' ? 'हिन्दी आवाज़' : 'AI Voice Assistance'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    msg.message
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading / Thinking State Indicator */}
            {chatLoading && (
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-850 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 rounded-tl-sm text-slate-200 shadow-sm flex gap-1.5 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-nyaya-500 animate-bounce"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-nyaya-500 animate-bounce" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-nyaya-500 animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Message Submission Input Dock */}
          <form onSubmit={handleChat} className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex gap-2 sm:gap-3">
            <div className="flex-1 relative flex items-center">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:border-nyaya-500 focus:ring-4 focus:ring-nyaya-500/10 rounded-full pl-5 pr-14 sm:pl-6 sm:pr-16 outline-none transition-all py-3 sm:py-3.5 text-sm sm:text-base"
                disabled={chatLoading}
                autoFocus
              />
              <button 
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 p-2 rounded-full transition-all flex items-center justify-center cursor-pointer
                  ${isListening 
                    ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                title={isListening ? "Listening... Click to stop" : "Speak your query"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button 
              type="submit" 
              disabled={chatLoading || !chatInput.trim()}
              className="bg-nyaya-600 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center hover:bg-nyaya-500 hover:shadow-lg transition-all disabled:opacity-40 disabled:hover:shadow-none shrink-0 cursor-pointer"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6 pl-1" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}