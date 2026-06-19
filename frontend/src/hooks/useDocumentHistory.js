import { useState, useCallback } from 'react';

const STORAGE_KEY = 'nyayavanni_doc_history';
const MAX_ENTRIES = 5;

export function useDocumentHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveToHistory = useCallback((entry) => {
    // entry: { documentId, fileName, fileType, riskLevel, analyzedAt }
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.documentId !== entry.documentId);
      const updated = [entry, ...filtered].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, saveToHistory, clearHistory };
}
