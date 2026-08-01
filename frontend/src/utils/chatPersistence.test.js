import { describe, it, expect, beforeEach } from 'vitest';
import {
  getChatStorageKey,
  getStoredChat,
  storeChat,
  clearStoredChat,
} from './chatPersistence';

const DOC_ID = 'doc-123';

describe('chatPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('builds a document-scoped storage key', () => {
    expect(getChatStorageKey(DOC_ID)).toBe('nyayavanni_chat_doc-123');
  });

  it('stores and retrieves chat history', () => {
    const history = [{ role: 'user', message: 'hi' }];
    storeChat(DOC_ID, history);
    expect(getStoredChat(DOC_ID)).toEqual(history);
  });

  it('keeps histories isolated per document', () => {
    storeChat(DOC_ID, [{ role: 'user', message: 'a' }]);
    storeChat('doc-456', [{ role: 'user', message: 'b' }]);
    expect(getStoredChat(DOC_ID)).toEqual([{ role: 'user', message: 'a' }]);
    expect(getStoredChat('doc-456')).toEqual([{ role: 'user', message: 'b' }]);
  });

  it('clears stored history for a document', () => {
    storeChat(DOC_ID, [{ role: 'user', message: 'hi' }]);
    clearStoredChat(DOC_ID);
    expect(getStoredChat(DOC_ID)).toBeNull();
  });

  it('returns null for missing or invalid history', () => {
    expect(getStoredChat(DOC_ID)).toBeNull();
    localStorage.setItem(getChatStorageKey(DOC_ID), 'not-json');
    expect(getStoredChat(DOC_ID)).toBeNull();
  });

  it('ignores non-array payloads on store', () => {
    storeChat(DOC_ID, null);
    expect(getStoredChat(DOC_ID)).toBeNull();
  });
});
