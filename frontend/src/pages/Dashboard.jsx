import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Scale, AlertTriangle, ArrowLeft, Calendar, FileText, 
  Bot, Send, User, Users, AlertCircle, Briefcase, Search 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../contexts/LanguageContext';
import { ensureSessionId } from '../utils/session';
import ThemeToggle from '../components/ThemeToggle';
import { useDocumentHistory } from '../hooks/useDocumentHistory';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { documentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const file = location.state?.file || null;
  const { saveToHistory } = useDocumentHistory();

  const [previewUrl, setPreviewUrl] = useState(null);
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
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
          console.error("Error:", err);
        }
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantMsg = '';

      setChatHistory([...newHistory, { role: 'assistant', message: '' }]);
      setChatLoading(false); 

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
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' ? true : node.type === selectedType;
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
        node.type === 'clauses' ? '#dbeafe'
        : node.type === 'obligations' ? '#fef3c7'
        : node.type === 'parties' ? '#dcfce7'
        : node.type === 'dates' ? '#fee2e2'
        : '#ffffff',
      width: 180,
      fontSize: 12
    }
  }));

  const visibleNodeIds = new Set(graphNodes.map(node => node.id));

  const graphEdges = knowledgeGraph?.edges?.filter((edge) => {
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
  }).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
        <div className="w-16 h-16 border-4 rounded-full animate-spin mb-6 border-nyaya-200 border-t-nyaya-500 dark:border-slate-800 dark:border-t-nyaya-500"></div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Analyzing Document via Advanced AI...</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Extracting clauses and cross-referencing Indian Law</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
        <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Something went wrong</h2>
        <p className="mt-2 mb-6 text-slate-500 dark:text-slate-400">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 text-white rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900">Go Back</button>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    if (risk === "High") return "text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40";
    if (risk === "Medium") return "text-amber-650 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40";
    return "text-green-650 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40";
  };

  return (
    <div className="relative min-h-screen pb-12 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      <nav className="sticky top-0 z-20 transition-colors duration-300 bg-white shadow-sm dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between h-16 px-6 mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 transition-colors rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 dark:hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              <Scale className="w-6 h-6 text-nyaya-500" /> NyayaVanni
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 text-sm font-medium rounded-full text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800">
              Doc ID: {documentId.substring(0, 8)}...
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

     <main className="px-6 mt-8 space-y-8 mx-auto max-w-7xl">
        <div className="p-6 bg-white border shadow-sm rounded-2xl dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">OCR Verification</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Compare uploaded document with extracted OCR text</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold text-slate-800 dark:text-white">Uploaded Document</h3>
              <div className="overflow-hidden border h-[400px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                {previewUrl ? (
                  file?.type?.includes('pdf') ? (
                    <iframe src={previewUrl} title="Document Preview" className="w-full h-full" />
                  ) : (
                    <img src={previewUrl} alt="Uploaded Document" className="object-contain w-full h-full bg-white" />
                  )
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-sm text-slate-400">No document preview available</div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 dark:text-white">Extracted OCR Text</h3>
                <button
                  onClick={() => navigator.clipboard.writeText(extractedText)}
                  className="px-3 py-1 text-xs transition-colors rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  Copy Text
                </button>
              </div>
              <div className="p-4 overflow-auto border h-[400px] rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                <pre className="text-sm leading-7 font-sans whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {extractedText?.trim() ? extractedText : "OCR text could not be extracted from this document."}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="grid items-start grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <div className="p-8 transition-all duration-300 transform bg-white border shadow-sm rounded-2xl dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="block mb-1 text-sm font-bold tracking-wider uppercase text-nyaya-600 dark:text-nyaya-400">{t("dashboard.doctype")}</span>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{analysis?.document_type || "Unknown Document"}</h1>
                  {classification && (
                    <div className="p-3 mt-3 border rounded-xl bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 text-blue-850 dark:text-blue-200">
                      <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        Detected Type: {classification.predicted_type}
                      </div>
                      <div className="mt-1 text-xs text-slate-650 dark:text-slate-400">
                        Confidence: {(classification.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Alternatives:
                        <ul className="ml-5 mt-1 list-disc">
                          {classification.alternatives?.map((alt, i) => (
                            <li key={i}>{alt.type} → {(alt.score * 100).toFixed(0)}%</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-bold ${getRiskColor(analysis?.risk_level)}`}>
                  <AlertTriangle className="w-5 h-5" />
                  {analysis?.risk_level} {t("dashboard.risk")}
                </div>
              </div>

              <p className="mb-6 text-lg leading-relaxed text-slate-700 dark:text-slate-350">
                {analysis?.summary}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3 p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800">
                  <Calendar className="w-5 h-5 mt-0.5 text-nyaya-600 dark:text-nyaya-400" />
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-450">{t("dashboard.status")}</div>
                    <div className="font-medium text-slate-900 dark:text-white">{analysis?.urgency}</div>
                    {analysis?.deadline && <div className="mt-1 text-sm font-semibold text-red-600 dark:text-red-400">{analysis.deadline}</div>}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800">
                  <FileText className="w-5 h-5 mt-0.5 text-nyaya-600 dark:text-nyaya-400" />
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase text-slate-500 dark:text-slate-450">{t("dashboard.sections")}</div>
                    <div className="font-medium leading-tight text-slate-900 dark:text-white">
                      {analysis?.sections?.join(', ') || "None identified"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2">
                {analysis?.parties && analysis.parties.length > 0 && (
                  <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
                      <h4 className="font-bold text-slate-900 dark:text-white">{t("dashboard.parties")}</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.parties.map((party, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-805 dark:text-slate-200">{party.name}</span>
                          <span className="px-2 py-0.5 text-xs border rounded bg-white text-slate-600 border-slate-200 dark:text-slate-300 dark:bg-slate-900 dark:border-slate-800">{party.role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis?.consequences && analysis.consequences.length > 0 && (
                  <div className="p-4 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
                      <h4 className="font-bold text-slate-900 dark:text-white">{t("dashboard.consequences")}</h4>
                    </div>
                    <ul className="pl-4 text-sm space-y-2 list-disc text-slate-700 dark:text-slate-300">
                      {analysis.consequences.map((cons, idx) => (
                        <li key={idx}>{cons}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">{t("dashboard.actions")}</h3>
              <div className="space-y-3">
                {analysis?.actions?.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border rounded-xl border-nyaya-100 dark:border-nyaya-800/40 bg-nyaya-50/40 dark:bg-nyaya-950/20">
                    <div className="flex items-center justify-center shrink-0 w-8 h-8 text-sm font-bold rounded-full bg-nyaya-100 dark:bg-nyaya-900/30 text-nyaya-600 dark:text-nyaya-400">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{action.action}</h4>
                      <p className="mt-1 text-sm text-slate-650 dark:text-slate-400">{action.timeline} • {action.why}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 mt-8 sm:flex-row">
                <button 
                  onClick={() => {
                    setChatInput("Please provide a detailed, paragraph-by-paragraph analysis of this document.");
                    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }}
                  className="flex items-center justify-center flex-1 gap-2 px-4 py-3 font-bold transition-colors bg-white border-2 rounded-xl shadow-sm cursor-pointer dark:bg-slate-900 border-nyaya-500 dark:border-nyaya-600 text-nyaya-650 dark:text-nyaya-300 hover:bg-nyaya-50 dark:hover:bg-nyaya-950/40"
                >
                  <Search className="w-5 h-5" /> {t("dashboard.btn.detailed")}
                </button>
              </div>
              
              {(analysis?.risk_level === "High" || analysis?.risk_level === "Medium") && (
                <div className="p-6 mt-8 border rounded-xl bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">{t("dashboard.consult.title")}</h4>
                      <p className="mb-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-350">
                        Due to the {analysis?.risk_level?.toLowerCase()} risk nature of this {analysis?.document_type}, we strongly suggest consulting with a specialized lawyer to protect your interests.
                      </p>
                      <button 
                        onClick={() => navigate('/lawyers')}
                        className="inline-block px-6 py-2 font-semibold text-white transition-colors rounded-xl shadow-sm cursor-pointer bg-slate-900 hover:bg-slate-850 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900"
                      >
                        {t("dashboard.consult.btn")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {knowledgeGraph && (
              <div className="p-6 transition-colors duration-300 border shadow-sm h-fit lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white">Legal Knowledge Graph</h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-400">Interactive visualization of clauses, obligations, parties, and relationships</p>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Search nodes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="h-[260px] overflow-hidden border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
                  <ReactFlow
                    nodes={graphNodes}
                    edges={graphEdges}
                    fitView
                    onNodeClick={(event, node) => setSelectedNode(node)}
                  >
                    <MiniMap />
                    <Controls />
                    <Background />
                  </ReactFlow>
                </div>

                {selectedNode && (
                  <div className="p-4 mt-5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Node Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-semibold text-slate-650 dark:text-slate-400">Label:</span> <span className="text-slate-800 dark:text-slate-200">{selectedNode.data.label}</span></div>
                      <div><span className="font-semibold text-slate-655 dark:text-slate-400">Type:</span> <span className="text-slate-800 dark:text-slate-200">{selectedNode.data.type}</span></div>
                      <div><span className="font-semibold text-slate-650 dark:text-slate-400">Node ID:</span> <span className="font-mono text-[10px] text-slate-850 dark:text-slate-200">{selectedNode.id}</span></div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                  <div className="p-3 overflow-hidden border rounded-lg min-w-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white">Nodes</div>
                    <div className="font-medium text-slate-600 dark:text-slate-400">{knowledgeGraph.nodes?.length || 0}</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white">Relationships</div>
                    <div className="font-medium text-slate-600 dark:text-slate-400">{knowledgeGraph.edges?.length || 0}</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white">Clauses</div>
                    <div className="font-medium text-slate-600 dark:text-slate-400">{knowledgeGraph.nodes?.filter(n => n.type === "clauses").length || 0}</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                    <div className="font-semibold text-slate-900 dark:text-white">Obligations</div>
                    <div className="font-medium text-slate-600 dark:text-slate-400">{knowledgeGraph.nodes?.filter(n => n.type === "obligations").length || 0}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-hidden transition-colors duration-300 bg-white border shadow-lg lg:col-span-3 min-h-[400px] sticky top-24 rounded-2xl dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 p-4 text-white bg-slate-900 dark:bg-slate-950">
              <Bot className="w-6 h-6 text-nyaya-400" />
              <h3 className="text-lg font-semibold">Nyaya Assistant</h3>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-full border ${msg.role === 'user' ? 'bg-nyaya-500 text-white dark:border-nyaya-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 dark:border-slate-700'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-4 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap shadow-sm border ${msg.role === 'user' ? 'bg-nyaya-900 text-white rounded-tr-sm border-nyaya-850' : 'bg-white dark:bg-slate-950 rounded-tl-sm text-slate-750 dark:text-slate-200 border-slate-200 dark:border-slate-800'}`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-li:my-0.5 prose-ul:my-1 prose-p:my-1 text-slate-700 dark:text-slate-200 prose-headings:text-slate-800 dark:prose-headings:text-white prose-strong:text-slate-900 dark:prose-strong:text-white prose-code:text-amber-600 dark:prose-code:text-amber-250">
                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                      </div>
                    ) : msg.message}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3">
                  <div className="flex items-center justify-center shrink-0 w-8 h-8 border rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 dark:border-slate-700">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1 p-4 border shadow-sm rounded-2xl bg-white dark:bg-slate-950 rounded-tl-sm border-slate-200 dark:border-slate-800">
                    <div className="w-2 h-2 rounded-full animate-bounce bg-nyaya-500"></div>
                    <div className="w-2 h-2 rounded-full animate-bounce bg-nyaya-500" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce bg-nyaya-500" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleChat} className="flex gap-2 p-4 transition-colors duration-300 bg-white border-t dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                className="flex-1 px-5 py-3 text-sm transition-all border rounded-full outline-none bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-450 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:border-nyaya-500 focus:ring-2 focus:ring-nyaya-500/20"
              />
              <button 
                type="submit" 
                disabled={chatLoading || !chatInput.trim()}
                className="flex items-center justify-center shrink-0 w-12 h-12 text-white transition-colors rounded-full shadow-md cursor-pointer bg-nyaya-600 hover:bg-nyaya-700 disabled:opacity-50"
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