import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import SearchBar from './SearchBar';
import ConversationItem from './ConversationItem';
import { useConversationHistory } from '../contexts/ConversationHistoryContext';
import { ARIA_LABELS, TITLES, PLACEHOLDERS, MESSAGES } from '../constants';

export default function HistorySidebar({ onSelectConversation, onNewChat }) {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    deleteConversation,
    clearAllConversations,
    searchConversations,
    isLoading,
    error,
  } = useConversationHistory();

  const [isOpen, setIsOpen] = useState(true);
  const [displayedConversations, setDisplayedConversations] =
    useState(conversations);
  const [isSearching, setIsSearching] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setDisplayedConversations(conversations);
  }, [conversations]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setDisplayedConversations(conversations);
      setIsSearching(false);
    } else {
      setIsSearching(true);
      const results = await searchConversations(query);
      setDisplayedConversations(results);
    }
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    onSelectConversation(id);
  };

  const handleDelete = async (id) => {
    try {
      await deleteConversation(id);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllConversations();
      setShowClearConfirm(false);
    } catch (err) {
      console.error('Failed to clear conversations:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    onNewChat();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-16 left-4 z-40 p-2 rounded-lg bg-nyaya-500 text-white hover:bg-nyaya-600 transition-colors"
        aria-label={ARIA_LABELS.TOGGLE_SIDEBAR}
        title={TITLES.TOGGLE_SIDEBAR}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setIsOpen(false)}
          aria-label={ARIA_LABELS.CLOSE_SIDEBAR}
        />
      )}

      <aside
        className={`fixed md:relative left-0 top-16 md:top-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-lg md:shadow-none flex flex-col transform transition-transform duration-300 md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">
              Chat History
            </h2>
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded-lg bg-nyaya-500 text-white hover:bg-nyaya-600 transition-colors"
              aria-label={ARIA_LABELS.NEW_CHAT}
              title={TITLES.NEW_CHAT}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <SearchBar
            onSearch={handleSearch}
            placeholder={PLACEHOLDERS.SEARCH_CHATS}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading history...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 m-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {!isLoading && !error && displayedConversations.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isSearching ? MESSAGES.NO_SEARCH_RESULTS : MESSAGES.NO_HISTORY}
              </p>
            </div>
          )}

          {!isLoading && displayedConversations.length > 0 && (
            <div className="p-2">
              {displayedConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={activeConversationId === conversation.id}
                  onSelect={handleSelectConversation}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {conversations.length > 0 && !isSearching && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            {showClearConfirm ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Delete all conversations?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAll}
                    className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-sm"
                title={TITLES.CLEAR_HISTORY}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
