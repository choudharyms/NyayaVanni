import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nyayavanni_doc_history';
const MAX_ENTRIES = 5;

export function useDocumentHistory() {
  const [history, setHistory] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      setHistory([]);
    }
  }, []);

  const saveToHistory = useCallback((entry) => {
    // entry: { documentId, fileName, fileType, riskLevel, analyzedAt }
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.documentId !== entry.documentId);
      const updated = [entry, ...filtered].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, saveToHistory, clearHistory };
}