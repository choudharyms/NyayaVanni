import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, User, Send, ArrowLeft, Scale, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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

          setChatHistory((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                role: 'assistant',
                message: assistantMsg,
              };
            }
            return updated;
          });
        }
      }
    } catch (err) {
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
    let content = 'NyayaVanni Legal Assistant - Consultation History\n';
    content += '=================================================\n\n';
    chatHistory.forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'NyayaVanni';
      content += `[${role}]:\n${msg.message}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NyayaVanni_Consultation_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const chatContainerRef = useRef(null);
  useEffect(() => {
    window.scrollTo(0, 0);

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300">
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-sm transition-colors duration-300">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              aria-label="Go back home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-850 dark:text-white cursor-pointer"
              onClick={() => navigate('/')}
            >
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-nyaya-500/15 border border-nyaya-500/25">
                <Scale className="text-nyaya-500 w-5 h-5" />
              </span>
              <span>
                Nyaya<span className="text-nyaya-500">Vanni</span>
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                | Assistant
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              title="Download Chat History"
            >
              <Download className="w-5 h-5" />
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

      <div className="flex-1 flex overflow-hidden">
        {/* History Sidebar */}
        <HistorySidebar
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />

        {/* Main Chat Area */}
        <main className="flex-1 w-full flex flex-col overflow-hidden">
          <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-hidden">
            {/* Main Chat Container Block */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors duration-300 relative">
              {/* Scrollable Message Timeline Area */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/20"
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
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-nyaya-500 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>

                    {/* Message Bubble Grid */}
                    <div
                      className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-nyaya-900 text-white rounded-tr-sm shadow-md border border-nyaya-800'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm text-slate-800 dark:text-slate-100 shadow-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{msg.message}</ReactMarkdown>
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
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-150 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 rounded-tl-sm text-slate-750 dark:text-slate-200 shadow-sm flex gap-1.5 items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-nyaya-500 animate-bounce"></div>
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-nyaya-500 animate-bounce"
                        style={{ animationDelay: '0.15s' }}
                      ></div>
                      <div
                        className="w-2.5 h-2.5 rounded-full bg-nyaya-500 animate-bounce"
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
                className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-2 sm:gap-3 transition-colors duration-300"
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
                  className="
                    chat-textarea
                    flex-1
                    resize-none
                    overflow-y-auto
                    bg-slate-50 dark:bg-slate-950
                    border border-slate-200 dark:border-slate-800
                    text-slate-900 dark:text-slate-100
                    placeholder-slate-500 dark:placeholder-slate-400
                    focus:bg-white dark:focus:bg-slate-950
                    focus:border-nyaya-500
                    focus:ring-4 focus:ring-nyaya-500/10
                    rounded-xl
                    px-5 sm:px-6
                    py-3
                    outline-none
                    transition-all
                    text-sm sm:text-base
                    min-h-[52px]
                    max-h-[160px]
                  "
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-nyaya-600 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center hover:bg-nyaya-500 hover:shadow-lg transition-all disabled:opacity-40 disabled:hover:shadow-none shrink-0 cursor-pointer"
                >
                  <Send className="text-center w-5 h-5 sm:w-6 sm:h-6" />
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
