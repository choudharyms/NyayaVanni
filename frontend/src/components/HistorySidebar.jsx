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
    renameConversation,
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

  const handleRename = async (id, newTitle) => {
    try {
      await renameConversation(id, newTitle);
    } catch (err) {
      console.error('Failed to rename conversation:', err);
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
        className="bg-nyaya-500 hover:bg-nyaya-600 fixed top-16 left-4 z-40 rounded-lg p-2 text-white transition-colors md:hidden"
        aria-label={ARIA_LABELS.TOGGLE_SIDEBAR}
        title={TITLES.TOGGLE_SIDEBAR}
      >
        {isOpen ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-label={ARIA_LABELS.CLOSE_SIDEBAR}
        />
      )}

      <aside
        className={`fixed top-16 left-0 flex h-[calc(100vh-4rem)] w-64 transform flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-300 md:relative md:top-0 md:h-screen md:transform-none md:shadow-none dark:border-slate-700 dark:bg-slate-900 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">
              Chat History
            </h2>
            <button
              onClick={handleNewChat}
              className="bg-nyaya-500 hover:bg-nyaya-600 rounded-lg p-1.5 text-white transition-colors"
              aria-label={ARIA_LABELS.NEW_CHAT}
              title={TITLES.NEW_CHAT}
            >
              <Plus className="h-5 w-5" />
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
            <div className="m-2 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
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
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </div>

        {conversations.length > 0 && !isSearching && (
          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            {showClearConfirm ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Delete all conversations?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAll}
                    className="flex-1 rounded-md bg-red-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-900 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                title={TITLES.CLEAR_HISTORY}
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
