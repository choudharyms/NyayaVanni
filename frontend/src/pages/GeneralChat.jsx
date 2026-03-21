import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, User, Send, ArrowLeft, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function GeneralChat() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', message: 'Hello! I am NyayaVanni Legal Assistant. How can I help you understand your legal rights today?' }
  ]);

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800">
              <Scale className="text-nyaya-500 w-6 h-6" /> NyayaVanni <span className="text-slate-400 font-medium hidden sm:inline">| Assistant</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-nyaya-500 text-white shadow-md shadow-nyaya-500/20' : 'bg-slate-200 text-slate-600 shadow-sm'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] text-sm sm:text-base leading-relaxed ${msg.role === 'user' ? 'bg-nyaya-500 text-white rounded-tr-sm shadow-sm' : 'bg-white border hover:shadow-md transition-shadow rounded-tl-sm text-slate-700 shadow-sm'}`}>
                  {msg.message}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="p-4 rounded-2xl bg-white border rounded-tl-sm text-slate-700 shadow-sm flex gap-1.5 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-nyaya-400 animate-bounce"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-nyaya-400 animate-bounce" style={{animationDelay: '0.15s'}}></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-nyaya-400 animate-bounce" style={{animationDelay: '0.3s'}}></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChat} className="p-3 sm:p-4 bg-white border-t flex gap-2 sm:gap-3">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-nyaya-500 focus:ring-4 focus:ring-nyaya-500/10 rounded-full px-5 sm:px-6 outline-none transition-all py-3 sm:py-3.5 text-sm sm:text-base"
              disabled={chatLoading}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={chatLoading || !chatInput.trim()}
              className="bg-nyaya-600 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center hover:bg-nyaya-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-none shrink-0"
            >
              <Send className="w-5 h-5 sm:w-6 sm:h-6 pl-1" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
