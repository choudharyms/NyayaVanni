import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Scale, AlertTriangle, ArrowLeft, Calendar, FileText, Bot, Send, User, Users, AlertCircle, Briefcase, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const file = location.state?.file;

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', message: 'I have analyzed your document. How can I help you understand it better?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    // Initial fetch for analysis
    const fetchAnalysis = async () => {
      try {
        const formData = new FormData();
        if (file) formData.append('file', file);
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/analyze/${documentId}?language=${language}`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error("Analysis request failed");
        const data = await response.json();
        setAnalysis(data.analysis);
      } catch (err) {
        console.error(err);
        setError("Analysis failed. Please try uploading the document again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [documentId, file, language]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', message: chatInput };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/chat/${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: userMsg.message,
          chat_history: chatHistory,
          document_analysis: analysis,
          language: language
        })
      });

      if (!response.ok) throw new Error("Chat failed");
      const data = await response.json();
      setChatHistory([...newHistory, { role: 'assistant', message: data.response }]);
    } catch (err) {
      console.error(err);
      // Fallback
      setTimeout(() => {
        setChatHistory([...newHistory, { role: 'assistant', message: "This is a fallback response. The backend might not be running correctly." }]);
        setChatLoading(false);
      }, 1000);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-nyaya-200 border-t-nyaya-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-slate-800">Analyzing Document via Advanced AI...</h2>
        <p className="text-slate-500 mt-2">Extracting clauses and cross-referencing Indian Law</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
        <p className="text-slate-500 mt-2 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-6 py-2 rounded-xl">Go Back</button>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-600 bg-red-50 border-red-200";
    if (risk === "Medium") return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-12">
      <nav className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800">
              <Scale className="text-nyaya-500 w-6 h-6" /> NyayaVanni
            </div>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Doc ID: {documentId.substring(0, 8)}...
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Analysis Results */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 transform transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-sm font-bold tracking-wider uppercase text-nyaya-600 mb-1 block">{t("dashboard.doctype")}</span>
                <h1 className="text-3xl font-bold text-slate-900">{analysis?.document_type || "Unknown Document"}</h1>
              </div>
              <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-bold ${getRiskColor(analysis?.risk_level)}`}>
                <AlertTriangle className="w-5 h-5" />
                {analysis?.risk_level} {t("dashboard.risk")}
              </div>
            </div>

            <p className="text-lg text-slate-700 leading-relaxed mb-6">
              {analysis?.summary}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-nyaya-500 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500 mb-1">{t("dashboard.status")}</div>
                  <div className="font-medium text-slate-900">{analysis?.urgency}</div>
                  {analysis?.deadline && <div className="text-sm text-red-600 mt-1 font-semibold">{analysis.deadline}</div>}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-3">
                <FileText className="w-5 h-5 text-nyaya-500 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500 mb-1">{t("dashboard.sections")}</div>
                  <div className="font-medium text-slate-900 leading-tight">
                    {analysis?.sections?.join(', ') || "None identified"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {analysis?.parties && analysis.parties.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-nyaya-500" />
                    <h4 className="font-bold text-slate-900">{t("dashboard.parties")}</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.parties.map((party, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-800">{party.name}</span>
                        <span className="text-slate-500 bg-white px-2 py-0.5 rounded border text-xs">{party.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis?.consequences && analysis.consequences.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-nyaya-500" />
                    <h4 className="font-bold text-slate-900">{t("dashboard.consequences")}</h4>
                  </div>
                  <ul className="space-y-2 list-disc pl-4 text-sm text-slate-700">
                    {analysis.consequences.map((cons, idx) => (
                      <li key={idx}>{cons}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-4">{t("dashboard.actions")}</h3>
            <div className="space-y-3">
              {analysis?.actions?.map((action, idx) => (
                <div key={idx} className="flex gap-4 items-start p-4 rounded-xl border border-nyaya-100 bg-nyaya-50/50">
                  <div className="w-8 h-8 rounded-full bg-nyaya-100 text-nyaya-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{action.action}</h4>
                    <p className="text-sm text-slate-600 mt-1">{action.timeline} • {action.why}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => {
                  setChatInput("Please provide a detailed, paragraph-by-paragraph analysis of this document.");
                  document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }}
                className="flex-1 bg-white border-2 border-nyaya-500 text-nyaya-600 hover:bg-nyaya-50 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" /> {t("dashboard.btn.detailed")}
              </button>
            </div>
            
            {(analysis?.risk_level === "High" || analysis?.risk_level === "Medium") && (
              <div className="mt-8 bg-amber-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{t("dashboard.consult.title")}</h4>
                    <p className="text-slate-700 mb-4 whitespace-pre-wrap">
                      Due to the {analysis?.risk_level?.toLowerCase()} risk nature of this {analysis?.document_type}, we strongly suggest consulting with a specialized lawyer to protect your interests.
                    </p>
                    <button 
                      onClick={() => navigate('/lawyers')}
                      className="bg-slate-900 hover:bg-nyaya-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors inline-block"
                    >
                      {t("dashboard.consult.btn")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Right Column: AI Chat */}
        <div className="lg:col-span-5 h-[calc(100vh-8rem)] sticky top-24 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
            <Bot className="w-6 h-6 text-nyaya-400" />
            <h3 className="font-semibold text-lg">Nyaya Assistant</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-nyaya-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-nyaya-500 text-white rounded-tr-sm' : 'bg-white border rounded-tl-sm text-slate-700 shadow-sm'}`}>
                  {msg.message}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl bg-white border rounded-tl-sm text-slate-700 shadow-sm flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChat} className="p-4 bg-white border-t flex gap-2">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-nyaya-500 focus:ring-2 focus:ring-nyaya-200 rounded-full px-5 outline-none transition-all py-3 text-sm"
              disabled={chatLoading}
            />
            <button 
              type="submit" 
              disabled={chatLoading || !chatInput.trim()}
              className="bg-nyaya-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-nyaya-700 transition-colors shadow-md disabled:opacity-50"
            >
              <Send className="w-5 h-5 pl-0.5" />
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
