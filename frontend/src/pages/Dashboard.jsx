import ReactFlow, {
  MiniMap,
  Controls,
  Background
} from 'reactflow';

import 'reactflow/dist/style.css';
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Scale, AlertTriangle, ArrowLeft, Calendar, FileText, Bot, Send, User, Users, AlertCircle, Briefcase, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../contexts/LanguageContext';
import { ensureSessionId } from '../utils/session';
import ThemeToggle from '../components/ThemeToggle';
import { useDocumentHistory } from '../hooks/useDocumentHistory';

const LOADING_CONTAINER = `min-h-screen bg-slate-50 dark:bg-slate-950 
  flex flex-col items-center justify-center transition-colors duration-300`;

const SPINNER = `w-16 h-16 border-4 border-nyaya-200 border-t-nyaya-500 
  dark:border-slate-800 dark:border-t-nyaya-500 rounded-full animate-spin mb-6`;

const ERROR_CONTAINER = `min-h-screen bg-slate-50 dark:bg-slate-950 
  flex flex-col items-center justify-center p-6 text-center 
  transition-colors duration-300`;

const MAIN_CONTAINER = `min-h-screen bg-slate-50 dark:bg-slate-950 
  relative pb-12 transition-colors duration-300`;

const NAV_BASE = `bg-white dark:bg-slate-900 border-b border-slate-200 
  dark:border-slate-800 sticky top-0 z-20 shadow-sm 
  transition-colors duration-300`;

const NAV_CONTAINER = "max-w-7xl mx-auto px-6 h-16 flex items-center justify-between";

const NAV_BUTTON = `p-2 hover:bg-slate-100 dark:hover:bg-slate-800 
  rounded-full transition-colors text-slate-500 dark:text-slate-400 
  dark:hover:text-white cursor-pointer`;

const NAV_LOGO = `flex items-center gap-2 text-xl font-bold 
  tracking-tight text-slate-800 dark:text-white`;

const DOC_BADGE = `text-sm font-medium text-slate-500 bg-slate-100 
  dark:text-slate-400 dark:bg-slate-800 px-3 py-1 rounded-full`;

const CARD_BASE = `bg-white dark:bg-slate-900 rounded-2xl shadow-sm 
  border border-slate-200 dark:border-slate-800`;

const CARD_SUB = `bg-slate-50 dark:bg-slate-950 rounded-xl p-4 
  border border-slate-150 dark:border-slate-800`;

const TEXT_PRIMARY = "text-slate-900 dark:text-white";

const TEXT_MUTED = "text-slate-600 dark:text-slate-400";

const TEXT_SEMI = "font-semibold text-slate-800 dark:text-white";

const BORDER_BASE = "border border-slate-200 dark:border-slate-800";

const GO_BACK_BUTTON = `bg-slate-900 hover:bg-slate-850 dark:bg-white 
  dark:hover:bg-slate-100 text-white dark:text-slate-900 px-6 py-2 
  rounded-xl cursor-pointer`;

const SECTION_TITLE = "text-2xl font-bold text-slate-900 dark:text-white";

const SUBTITLE = "text-slate-600 dark:text-slate-400 mt-1";

const COPY_BUTTON = `text-xs px-3 py-1 rounded-lg bg-slate-200 
  dark:bg-slate-800 text-slate-800 dark:text-slate-200 
  hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer`;

const TEXTAREA_PRE = `whitespace-pre-wrap text-sm leading-7 
  text-slate-700 dark:text-slate-300 font-sans`;

const RISK_BADGE = `px-4 py-2 rounded-xl flex items-center gap-2 
  border font-bold`;

const PARTY_ROLE = `text-slate-600 bg-white border border-slate-200 
  dark:text-slate-300 dark:bg-slate-900 dark:border-slate-800 
  px-2 py-0.5 rounded text-xs`;

const ACTION_CARD = `flex gap-4 items-start p-4 rounded-xl 
  border border-nyaya-100 dark:border-nyaya-800/40 
  bg-nyaya-50/40 dark:bg-nyaya-950/20`;

const ACTION_NUMBER = `w-8 h-8 rounded-full bg-nyaya-100 
  dark:bg-nyaya-900/30 text-nyaya-600 dark:text-nyaya-400 
  flex items-center justify-center font-bold text-sm shrink-0`;

const DETAILED_BUTTON = `flex-1 bg-white dark:bg-slate-900 
  border-2 border-nyaya-500 dark:border-nyaya-600 
  text-nyaya-650 dark:text-nyaya-300 
  hover:bg-nyaya-50 dark:hover:bg-nyaya-950/40 
  font-bold py-3 px-4 rounded-xl transition-colors 
  flex items-center justify-center gap-2 cursor-pointer shadow-sm`;

const RISK_WARN_BOX = `bg-amber-50 dark:bg-amber-950/10 rounded-xl 
  p-6 border border-amber-200 dark:border-amber-900/30`;

const RISK_WARN_ICON = `w-12 h-12 bg-amber-100 dark:bg-amber-950/30 
  text-amber-600 dark:text-amber-400 rounded-full 
  flex items-center justify-center shrink-0`;

const CONSULT_BUTTON = `bg-slate-900 hover:bg-slate-850 dark:bg-white 
  dark:hover:bg-slate-100 text-white dark:text-slate-900 
  font-semibold py-2 px-6 rounded-xl transition-colors 
  inline-block cursor-pointer shadow-sm`;

const KG_SECTION = `h-fit bg-white dark:bg-slate-900 rounded-2xl 
  shadow-sm border border-slate-200 dark:border-slate-800 
  p-6 transition-colors duration-300`;

const KG_TITLE = "text-3xl font-bold text-slate-900 dark:text-white leading-tight";

const SEARCH_INPUT = `w-full px-4 py-2 rounded-xl border 
  border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 
  text-slate-800 dark:text-white focus:outline-none`;

const KG_FLOW_CONTAINER = `h-[260px] rounded-xl overflow-hidden 
  border border-slate-200 dark:border-slate-800 
  bg-slate-50 dark:bg-slate-950/20`;

const NODE_DETAILS = `bg-slate-50 dark:bg-slate-950 
  border border-slate-200 dark:border-slate-800 rounded-xl p-4`;

const NODE_INFO_LABEL = "font-semibold text-slate-650 dark:text-slate-400";

const NODE_INFO_VALUE = "text-slate-800 dark:text-slate-200";

const KG_STAT_CARD = `bg-slate-50 dark:bg-slate-950 rounded-lg p-3 
  border border-slate-200 dark:border-slate-800 min-w-0 overflow-hidden`;

const KG_STAT_LABEL = "font-semibold text-slate-900 dark:text-white";

const KG_STAT_VALUE = "text-slate-600 dark:text-slate-400 font-medium";

const CHAT_PANEL = `lg:col-span-3 min-h-[400px] sticky top-24 
  flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-lg 
  border border-slate-200 dark:border-slate-800 overflow-hidden 
  transition-colors duration-300`;

const CHAT_HEADER = "bg-slate-900 dark:bg-slate-950 text-white p-4 flex items-center gap-3";

const CHAT_BODY = "flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20";

const USER_AVATAR = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-nyaya-500 text-white";

const ASSISTANT_AVATAR = `w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 
  text-slate-600 dark:text-slate-400 flex items-center justify-center 
  shrink-0 border dark:border-slate-700`;

const USER_BUBBLE = `p-4 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap 
  bg-nyaya-900 text-white rounded-tr-sm shadow-md border border-nyaya-850`;

const ASSISTANT_BUBBLE = `p-4 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap 
  bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 
  rounded-tl-sm text-slate-750 dark:text-slate-200 shadow-sm`;

const PROSE = `prose prose-sm max-w-none prose-li:my-0.5 prose-ul:my-1 
  prose-p:my-1 text-slate-700 dark:text-slate-200 
  prose-headings:text-slate-800 dark:prose-headings:text-white 
  prose-strong:text-slate-900 dark:prose-strong:text-white 
  prose-code:text-amber-600 dark:prose-code:text-amber-250`;

const TYPING_INDICATOR = `p-4 rounded-2xl bg-white dark:bg-slate-950 
  border border-slate-200 dark:border-slate-800 rounded-tl-sm 
  text-slate-750 dark:text-slate-200 shadow-sm flex gap-1 items-center`;

const TYPING_DOT = "w-2 h-2 rounded-full bg-nyaya-500 animate-bounce";

const CHAT_FORM = `p-4 bg-white dark:bg-slate-900 
  border-t border-slate-200 dark:border-slate-800 
  flex gap-2 transition-colors duration-300`;

const CHAT_INPUT = `flex-1 bg-slate-100 dark:bg-slate-950 
  border border-slate-200 dark:border-slate-800 
  text-slate-900 dark:text-slate-100 
  placeholder-slate-450 dark:placeholder-slate-500 
  focus:bg-white dark:focus:bg-slate-950 
  focus:border-nyaya-500 focus:ring-2 focus:ring-nyaya-500/20 
  rounded-full px-5 outline-none transition-all py-3 text-sm`;

const SEND_BUTTON = `bg-nyaya-600 text-white w-12 h-12 rounded-full 
  flex items-center justify-center hover:bg-nyaya-700 
  transition-colors shadow-md disabled:opacity-50 cursor-pointer shrink-0`;

const CLASSIFICATION_BOX = `mt-3 p-3 rounded-xl border 
  bg-blue-50 dark:bg-blue-950/20 
  border-blue-200 dark:border-blue-800/40 
  text-blue-850 dark:text-blue-200`;

const DETECTED_TYPE = "text-sm font-bold text-blue-700 dark:text-blue-300";

const CONFIDENCE_TEXT = "text-xs text-slate-650 dark:text-slate-400 mt-1";

const ALTERNATIVES_TEXT = "mt-2 text-xs text-slate-500 dark:text-slate-400";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const file = location.state?.file || null;
  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
  if (file) {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }
}, [file]);
  const { saveToHistory } = useDocumentHistory();

  const [analysis, setAnalysis] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classification, setClassification] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', message: 'I have analyzed your document. How can I help you understand it better?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    // Initial fetch for analysis
    const fetchAnalysis = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const sessionId = await ensureSessionId(apiUrl);
        const response = await fetch(`${apiUrl}/api/analyze/${documentId}?language=${language}`, {
          method: 'POST',
          headers: { 'X-Session-Id': sessionId }
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || "Analysis request failed");
        }
        const data = await response.json();
        setAnalysis(data.analysis);
        setClassification(data.classification);
        setKnowledgeGraph(data.knowledge_graph);
        setExtractedText(data.extracted_text);
        saveToHistory({
          documentId,
          fileName: file?.name || 'Unknown Document',
          fileType: file?.type?.includes('pdf') ? 'PDF' : file?.type?.includes('image') ? 'Image' : 'Document',
          riskLevel: data.analysis?.risk_level || data.classification?.risk_level || 'unknown',
          analyzedAt: new Date().toISOString(),
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Error:", error);}
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        let msg = err.message !== "Failed to fetch" && err.message !== "Analysis request failed" 
                   ? err.message 
                   : "Analysis failed. Please try uploading the document again.";
        
        if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
          msg = "Configuration Error: API URL is set to localhost in production. Please set VITE_API_URL in Vercel.";
        }
        setError(msg);
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
      const sessionId = await ensureSessionId(apiUrl);
      const response = await fetch(`${apiUrl}/api/chat/${documentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
        body: JSON.stringify({
          user_message: userMsg.message,
          chat_history: chatHistory,
          language: language
        })
      });

      if (!response.ok) throw new Error("Chat failed");

      // Set up a stream reader to consume the plaintext chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMsg = '';

      // Add a placeholder assistant message that will be progressively populated
      setChatHistory([...newHistory, { role: 'assistant', message: '' }]);
      setChatLoading(false); // Turn off loading state once streaming begins

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkValue = decoder.decode(value);
          assistantMsg += chunkValue;
          
          setChatHistory(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = { role: 'assistant', message: assistantMsg };
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error(err);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      let msg = "This is a fallback response. The backend might not be running correctly.";
      
      if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
        msg = "Configuration Error: API URL is still set to localhost. Fix this in Vercel Environment Variables.";
      }

      setChatHistory([...newHistory, { role: 'assistant', message: msg }]);
      setChatLoading(false);
    } finally {
      setChatLoading(false);
    }
  };
 const filteredNodes = knowledgeGraph?.nodes?.filter((node) => {

  const matchesSearch =
    node.label.toLowerCase().includes(
      searchTerm.toLowerCase()
    );

  const matchesType =
    selectedType === 'all'
      ? true
      : node.type === selectedType;

  return matchesSearch && matchesType;

}) || [];

const graphNodes = filteredNodes.map((node, index) => ({

  id: node.id,

 data: {
  label: node.label,
  type: node.type
},

  position: {
    x: (index % 4) * 250,
    y: Math.floor(index / 4) * 150
  },

  style: {
    padding: 10,
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    background:
      node.type === 'clauses'
        ? '#dbeafe'
        : node.type === 'obligations'
        ? '#fef3c7'
        : node.type === 'parties'
        ? '#dcfce7'
        : node.type === 'dates'
        ? '#fee2e2'
        : '#ffffff',

    width: 180,
    fontSize: 12
  }

}));

const visibleNodeIds = new Set(
  graphNodes.map(node => node.id)
);

const graphEdges = knowledgeGraph?.edges?.filter((edge) => {

  return (
    visibleNodeIds.has(edge.source) &&
    visibleNodeIds.has(edge.target)
  );

}).map((edge) => ({

  id: edge.id,
  source: edge.source,
  target: edge.target,
  label: edge.label,
  animated: true

})) || [];

  if (loading) {
    return (
      <div className={LOADING_CONTAINER}>
        <div className={SPINNER}></div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Analyzing Document via Advanced AI...</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Extracting clauses and cross-referencing Indian Law</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={ERROR_CONTAINER}>
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className={TEXT_PRIMARY + " text-2xl font-bold"}>Something went wrong</h2>
        <p className={TEXT_MUTED + " mt-2 mb-6"}>{error}</p>
        <button onClick={() => navigate('/')} className={GO_BACK_BUTTON}>Go Back</button>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40";
    if (risk === "Medium") return "text-amber-650 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40";
    return "text-green-650 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40";
  };

  return (
    <div className={MAIN_CONTAINER}>
      <nav className={NAV_BASE}>
        <div className={NAV_CONTAINER}>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className={NAV_BUTTON}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={NAV_LOGO}>
              <Scale className="text-nyaya-500 w-6 h-6" /> NyayaVanni
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={DOC_BADGE}>
              Doc ID: {documentId.substring(0, 8)}...
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

     <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
  {/* OCR Verification Section */}
  <div className={`${CARD_BASE} p-6`}>

    <div className="mb-6">
      <h2 className={SECTION_TITLE}>
        OCR Verification
      </h2>

      <p className={SUBTITLE}>
        Compare uploaded document with extracted OCR text
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Uploaded Document */}
      <div>
        <h3 className={`${TEXT_SEMI} mb-3`}>
          Uploaded Document
        </h3>

        <div className={`${BORDER_BASE} rounded-xl overflow-hidden h-[400px] bg-slate-50 dark:bg-slate-950`}>

          {previewUrl ? (
            file?.type?.includes('pdf') ? (
            <iframe
            src={previewUrl}
            title="Document Preview"
            className="w-full h-full"
            />
          ) : (
            <img
          src={previewUrl}
          alt="Uploaded Document"
          className="w-full h-full object-contain bg-white"
          />
      )
    ) : (
  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
    No document preview available
  </div>
)}
 </div>
      </div>

      {/* OCR Text */}
      <div>

        <div className="flex items-center justify-between mb-3">
          <h3 className={TEXT_SEMI}>
            Extracted OCR Text
          </h3>

          <button
            onClick={() => navigator.clipboard.writeText(extractedText)}
            className={COPY_BUTTON}
          >
            Copy Text
          </button>
        </div>

        <div className={`${BORDER_BASE} rounded-xl p-4 h-[400px] overflow-auto bg-slate-50 dark:bg-slate-950`}>

          <pre className={TEXTAREA_PRE}>
            {extractedText?.trim()
              ? extractedText
              : "OCR text could not be extracted from this document."}
          </pre>

        </div>
      </div>

    </div>
  </div>

  {/* Main Dashboard Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

    {/* Left Column: Analysis Results */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`${CARD_BASE} p-8 transition-all hover:shadow-md transition-colors duration-300`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-sm font-bold tracking-wider uppercase text-nyaya-600 dark:text-nyaya-400 mb-1 block">{t("dashboard.doctype")}</span>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{analysis?.document_type || "Unknown Document"}</h1>
                {classification && (
                  <div className={CLASSIFICATION_BOX}>
                    <div className={DETECTED_TYPE}>
                      Detected Type: {classification.predicted_type}
                    </div>

                    <div className={CONFIDENCE_TEXT}>
                      Confidence: {(classification.confidence * 100).toFixed(1)}%
                    </div>

                    <div className={ALTERNATIVES_TEXT}>
                      Alternatives:
                      <ul className="list-disc ml-5 mt-1">
                        {classification.alternatives?.map((alt, i) => (
                          <li key={i}>
                            {alt.type} → {(alt.score * 100).toFixed(0)}%
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className={`${RISK_BADGE} ${getRiskColor(analysis?.risk_level)}`}>
                <AlertTriangle className="w-5 h-5" />
                {analysis?.risk_level} {t("dashboard.risk")}
              </div>
            </div>

            <p className="text-lg text-slate-700 dark:text-slate-350 leading-relaxed mb-6">
              {analysis?.summary}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className={`${CARD_SUB} flex items-start gap-3`}>
                <Calendar className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-450 mb-1">{t("dashboard.status")}</div>
                  <div className="font-medium text-slate-900 dark:text-white">{analysis?.urgency}</div>
                  {analysis?.deadline && <div className="text-sm text-red-600 dark:text-red-400 mt-1 font-semibold">{analysis.deadline}</div>}
                </div>
              </div>
              <div className={`${CARD_SUB} flex items-start gap-3`}>
                <FileText className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-450 mb-1">{t("dashboard.sections")}</div>
                  <div className="font-medium text-slate-900 dark:text-white leading-tight">
                    {analysis?.sections?.join(', ') || "None identified"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {analysis?.parties && analysis.parties.length > 0 && (
                <div className={CARD_SUB}>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white">{t("dashboard.parties")}</h4>
                  </div>
                  <ul className="space-y-2">
                    {analysis.parties.map((party, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-805 dark:text-slate-200">{party.name}</span>
                        <span className={PARTY_ROLE}>{party.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis?.consequences && analysis.consequences.length > 0 && (
                <div className={CARD_SUB}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white">{t("dashboard.consequences")}</h4>
                  </div>
                  <ul className="space-y-2 list-disc pl-4 text-sm text-slate-700 dark:text-slate-300">
                    {analysis.consequences.map((cons, idx) => (
                      <li key={idx}>{cons}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t("dashboard.actions")}</h3>
            <div className="space-y-3">
              {analysis?.actions?.map((action, idx) => (
                <div key={idx} className={ACTION_CARD}>
                  <div className={ACTION_NUMBER}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{action.action}</h4>
                    <p className="text-sm text-slate-650 dark:text-slate-400 mt-1">{action.timeline} • {action.why}</p>
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
                className={DETAILED_BUTTON}
              >
                <Search className="w-5 h-5" /> {t("dashboard.btn.detailed")}
              </button>
            </div>
            
            {(analysis?.risk_level === "High" || analysis?.risk_level === "Medium") && (
              <div className={RISK_WARN_BOX}>
                <div className="flex items-start gap-4">
                  <div className={RISK_WARN_ICON}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{t("dashboard.consult.title")}</h4>
                    <p className="text-slate-700 dark:text-slate-350 mb-4 whitespace-pre-wrap text-sm leading-relaxed">
                      Due to the {analysis?.risk_level?.toLowerCase()} risk nature of this {analysis?.document_type}, we strongly suggest consulting with a specialized lawyer to protect your interests.
                    </p>
                    <button 
                      onClick={() => navigate('/lawyers')}
                      className={CONSULT_BUTTON}
                    >
                      {t("dashboard.consult.btn")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        {knowledgeGraph && (
          <div className={KG_SECTION}>
            
            <div className="mb-6">
  <h2 className={KG_TITLE}>
    Legal Knowledge Graph
  </h2>

  <p className={TEXT_MUTED + " mt-2"}>
    Interactive visualization of clauses, obligations, parties, and relationships
  </p>

  <div className="mt-4">
    <input
      type="text"
      placeholder="Search nodes..."
      className={SEARCH_INPUT}
    />
  </div>
</div>
            <div className={KG_FLOW_CONTAINER}>
              <ReactFlow
                nodes={graphNodes}
                edges={graphEdges}
                fitView
                onNodeClick={(event, node) => {
                  setSelectedNode(node);
                }}
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </div>

            {selectedNode && (
              <div className={NODE_DETAILS}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  Node Details
                </h3>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className={NODE_INFO_LABEL}>
                      Label:
                    </span>{" "}
                    <span className={NODE_INFO_VALUE}>{selectedNode.data.label}</span>
                  </div>

                  <div>
                    <span className={NODE_INFO_LABEL}>
                      Type:
                    </span>{" "}
                    <span className={NODE_INFO_VALUE}>{selectedNode.data.type}</span>
                  </div>

                  <div>
                    <span className={NODE_INFO_LABEL}>
                      Node ID:
                    </span>{" "}
                    <span className="text-slate-850 dark:text-slate-200 font-mono text-[10px]">{selectedNode.id}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
              <div className={KG_STAT_CARD}>
                <div className={KG_STAT_LABEL}>Nodes</div>
                <div className={KG_STAT_VALUE}>
                  {knowledgeGraph.nodes?.length || 0}
                </div>
              </div>

              <div className={`${KG_STAT_CARD} min-w-0`}>
                <div className={KG_STAT_LABEL}>Relationships</div>
                <div className={KG_STAT_VALUE}>
                  {knowledgeGraph.edges?.length || 0}
                </div>
              </div>

              <div className={`${KG_STAT_CARD} min-w-0`}>
                <div className={KG_STAT_LABEL}>Clauses</div>
                <div className={KG_STAT_VALUE}>
                  {
                    knowledgeGraph.nodes?.filter(
                      n => n.type === "clauses"
                    ).length || 0
                  }
                </div>
              </div>

              <div className={`${KG_STAT_CARD} min-w-0`}>
                <div className={KG_STAT_LABEL}>Obligations</div>
                <div className={KG_STAT_VALUE}>
                  {
                    knowledgeGraph.nodes?.filter(
                      n => n.type === "obligations"
                    ).length || 0
                  }
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Right Column: AI Chat */}
        <div className={CHAT_PANEL}>
          <div className={CHAT_HEADER}>
            <Bot className="w-6 h-6 text-nyaya-400" />
            <h3 className="font-semibold text-lg">Nyaya Assistant</h3>
          </div>
          
          <div className={CHAT_BODY}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`${msg.role === 'user' ? USER_AVATAR : ASSISTANT_AVATAR}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`${msg.role === 'user' ? USER_BUBBLE : ASSISTANT_BUBBLE}`}>
                  {msg.role === 'assistant' ? (
                    <div className={PROSE}>
                      <ReactMarkdown>{msg.message}</ReactMarkdown>
                    </div>
                  ) : msg.message}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-3">
                <div className={ASSISTANT_AVATAR}>
                  <Bot className="w-5 h-5" />
                </div>
                <div className={TYPING_INDICATOR}>
                  <div className={TYPING_DOT}></div>
                  <div className={TYPING_DOT} style={{animationDelay: '0.1s'}}></div>
                  <div className={TYPING_DOT} style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleChat} className={CHAT_FORM}>
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className={CHAT_INPUT}
            />
            <button 
              type="submit" 
              disabled={chatLoading || !chatInput.trim()}
              className={SEND_BUTTON}
            >
              <Send className="w-5 h-5 pl-0.5" />
            </button>
          </form>
        </div>
          </div>

      </main>
    </div>
  );
}
