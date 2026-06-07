/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import conversationDB from '../utils/indexedDB';

const ConversationHistoryContext = createContext();

export const useConversationHistory = () => {
  const context = useContext(ConversationHistoryContext);
  if (!context) {
    throw new Error(
      'useConversationHistory must be used within a ConversationHistoryProvider'
    );
  }
  return context;
};

export const ConversationHistoryProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const allConversations = await conversationDB.getAllConversations();
      setConversations(allConversations);
      setError(null);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConversation = async (title, messages) => {
    try {
      const conversationId = await conversationDB.addConversation({
        title,
        messages,
        timestamp: new Date().toISOString(),
      });

      await loadConversations();
      setActiveConversationId(conversationId);
      return conversationId;
    } catch (err) {
      console.error('Failed to save conversation:', err);
      setError('Failed to save conversation');
      throw err;
    }
  };

  const updateConversation = async (id, messages) => {
    try {
      await conversationDB.updateConversation(id, {
        messages,
        updatedAt: new Date().toISOString(),
      });

      await loadConversations();
    } catch (err) {
      console.error('Failed to update conversation:', err);
      setError('Failed to update conversation');
      throw err;
    }
  };

  const deleteConversation = async (id) => {
    try {
      await conversationDB.deleteConversation(id);
      await loadConversations();

      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Failed to delete conversation');
      throw err;
    }
  };

  const clearAllConversations = async () => {
    try {
      await conversationDB.clearAllConversations();
      setConversations([]);
      setActiveConversationId(null);
    } catch (err) {
      console.error('Failed to clear conversations:', err);
      setError('Failed to clear conversation history');
      throw err;
    }
  };

  const searchConversations = async (query) => {
    try {
      if (!query.trim()) {
        return conversations;
      }

      const results = await conversationDB.searchConversations(query);
      return results;
    } catch (err) {
      console.error('Failed to search conversations:', err);
      setError('Failed to search conversations');
      return [];
    }
  };

  const getConversation = async (id) => {
    try {
      return await conversationDB.getConversation(id);
    } catch (err) {
      console.error('Failed to get conversation:', err);
      setError('Failed to load conversation');
      return null;
    }
  };

  const value = {
    conversations,
    activeConversationId,
    setActiveConversationId,
    saveConversation,
    updateConversation,
    deleteConversation,
    clearAllConversations,
    searchConversations,
    getConversation,
    loadConversations,
    isLoading,
    error,
  };

  return (
    <ConversationHistoryContext.Provider value={value}>
      {children}
    </ConversationHistoryContext.Provider>
  );
};
