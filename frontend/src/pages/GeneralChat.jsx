import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  User,
  Send,
  ArrowLeft,
  Scale,
  Download,
  Copy,
  Trash2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { useLanguage } from '../contexts/LanguageContext';
import { useConversationHistory } from '../contexts/ConversationHistoryContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import HistorySidebar from '../components/HistorySidebar';

export default function GeneralChat() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    saveConversation,
    updateConversation,
    getConversation,
    setActiveConversationId,
    deleteConversation,
  } = useConversationHistory();

  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      message:
        'Hello! I am NyayaVanni Legal Assistant. How can I help you understand your legal rights today?',
    },
  ]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Auto-save conversation every time chatHistory changes
  useEffect(() => {
    const saveCurrentConversation = async () => {
      // Don't save if chat history only contains the initial greeting
      if (
        chatHistory.length === 1 &&
        chatHistory[0].role === 'assistant' &&
        chatHistory[0].message.includes('NyayaVanni Legal Assistant')
      ) {
        return;
      }

      setIsSaving(true);
      try {
        let title = generateConversationTitle(chatHistory);

        if (currentConversationId) {
          // Update existing conversation
          await updateConversation(currentConversationId, chatHistory);
        } else {
          // Save as new conversation
          const conversationId = await saveConversation(title, chatHistory);
          setCurrentConversationId(conversationId);
          setActiveConversationId(conversationId);
        }
      } catch (err) {
        console.error('Failed to auto-save conversation:', err);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce the save operation
    const saveTimer = setTimeout(saveCurrentConversation, 1000);
    return () => clearTimeout(saveTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistory]);

  /**
   * Generate a conversation title from chat history
   * Uses the first user message or first X characters of content
   */
  const generateConversationTitle = (history) => {
    const userMessage = history.find((msg) => msg.role === 'user');
    if (userMessage && userMessage.message) {
      return userMessage.message.substring(0, 50).trim();
    }
    return 'New Conversation';
  };

  /**
   * Load a conversation from history
   */
  const handleSelectConversation = async (conversationId) => {
    try {
      const conversation = await getConversation(conversationId);
      if (conversation) {
        setChatHistory(conversation.messages);
        setCurrentConversationId(conversationId);
        setActiveConversationId(conversationId);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  /**
   * Start a new conversation
   */
  const handleNewChat = () => {
    setChatHistory([
      {
        role: 'assistant',
        message:
          'Hello! I am NyayaVanni Legal Assistant. How can I help you understand your legal rights today?',
      },
    ]);
    setCurrentConversationId(null);
    setActiveConversationId(null);
    setChatInput('');
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
        credentials: 'include',
        body: JSON.stringify({
          user_message: userMsg.message,
          chat_history: currentHistory,
          language: language,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const data = await response.json();
      const assistantMsg = data?.response || '';

      setChatHistory([
        ...newHistory,
        { role: 'assistant', message: assistantMsg },
      ]);
    } catch {
      //console.error(err);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      let errorMessage =
        "I'm having trouble connecting to the server. Please try again later.";

      if (
        apiUrl.includes('localhost') &&
        window.location.hostname !== 'localhost'
      ) {
        errorMessage =
          'Configuration Error: The app is trying to connect to a local server (localhost) while deployed. Please set the VITE_API_URL environment variable in your Vercel dashboard.';
      }

      setChatHistory([
        ...newHistory,
        { role: 'assistant', message: errorMessage },
      ]);
      setChatLoading(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await submitMessage(text, chatHistory);
  };

  const handleInputChange = (e) => {
    setChatInput(e.target.value);

    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (!chatInput.trim() || chatLoading) return;

      handleChat(e);
    }
  };

  const handleDownload = () => {
    let content = '# NyayaVanni Legal Assistant - Consultation History\n\n';
    content += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
    content += '---\n\n';

    chatHistory.forEach((msg) => {
      const role = msg.role === 'user' ? '### You' : '### NyayaVanni Assistant';
      content += `${role}\n\n${msg.message}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nyaya-vanni-consultation.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearChat = async () => {
    if (
      window.confirm(
        'Clear all messages in this conversation? This will delete it from history.'
      )
    ) {
      if (currentConversationId) {
        try {
          await deleteConversation(currentConversationId);
        } catch (err) {
          console.error('Failed to delete active conversation:', err);
        }
      }
      setChatHistory([
        {
          role: 'assistant',
          message:
            'Hello! I am NyayaVanni Legal Assistant. How can I help you understand your legal rights today?',
        },
      ]);
      setCurrentConversationId(null);
      setActiveConversationId(null);
    }
  };

  const chatContainerRef = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="cursor-pointer rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={ARIA_LABELS.GO_BACK_HOME}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div
              className="text-slate-850 flex cursor-pointer items-center gap-2 text-xl font-bold tracking-tight dark:text-white"
              onClick={() => navigate('/')}
            >
              <span className="bg-nyaya-500/15 border-nyaya-500/25 inline-flex h-9 w-9 items-center justify-center rounded-full border">
                <Scale className="text-nyaya-500 h-5 w-5" />
              </span>
              <span>
                Nyaya<span className="text-nyaya-500">Vanni</span>
              </span>
              <span className="hidden font-medium text-slate-400 sm:inline dark:text-slate-500">
                | Assistant
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="cursor-pointer rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              title="Download Chat History"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={handleClearChat}
              className="cursor-pointer rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
              title="Clear Chat"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            {isSaving && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Saving...
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <HistorySidebar
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />

        {/* Main Chat Area */}
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden p-4 sm:p-6">
            {/* Main Chat Container Block */}
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
              {/* Scrollable Message Timeline Area */}
              <div
                ref={chatContainerRef}
                className="flex-1 space-y-6 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 dark:bg-slate-950/20"
              >
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 sm:gap-4 ${
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    {/* Avatar Icon Wrapper */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                        msg.role === 'user'
                          ? 'bg-nyaya-500 text-white shadow-md'
                          : 'border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>

                    {/* Message Bubble Grid */}
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[75%] sm:text-base ${
                        msg.role === 'user'
                          ? 'bg-nyaya-900 border-nyaya-800 rounded-tr-sm border text-white shadow-md'
                          : 'rounded-tl-sm border border-slate-200 bg-slate-100 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {msg.message}
                          </ReactMarkdown>
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 sm:h-10 sm:w-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="bg-slate-150 dark:bg-slate-850/80 text-slate-750 flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-slate-200 p-4 shadow-sm dark:border-slate-800 dark:text-slate-200">
                      <div className="bg-nyaya-500 h-2.5 w-2.5 animate-bounce rounded-full"></div>
                      <div
                        className="bg-nyaya-500 h-2.5 w-2.5 animate-bounce rounded-full"
                        style={{ animationDelay: '0.15s' }}
                      ></div>
                      <div
                        className="bg-nyaya-500 h-2.5 w-2.5 animate-bounce rounded-full"
                        style={{ animationDelay: '0.3s' }}
                      ></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Message Submission Input Dock */}
              <form
                onSubmit={handleChat}
                className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 transition-colors duration-300 sm:gap-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.placeholder')}
                  disabled={chatLoading}
                  rows={1}
                  autoFocus
                  className="chat-textarea focus:border-nyaya-500 focus:ring-nyaya-500/10 max-h-[160px] min-h-[52px] flex-1 resize-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 placeholder-slate-500 transition-all outline-none focus:bg-white focus:ring-4 sm:px-6 sm:text-base dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:bg-slate-950"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-nyaya-600 hover:bg-nyaya-500 flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl text-white transition-all hover:shadow-lg disabled:opacity-40 disabled:hover:shadow-none sm:h-14 sm:w-14"
                >
                  <Send className="h-5 w-5 text-center sm:h-6 sm:w-6" />
                </button>
              </form>
            </div>
          </div>

          <div className="w-full shrink-0">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}
