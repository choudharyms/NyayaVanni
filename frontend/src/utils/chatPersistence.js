const STORAGE_PREFIX = 'nyayavanni_chat_';

export function getChatStorageKey(documentId) {
  return `${STORAGE_PREFIX}${documentId}`;
}

export function getStoredChat(documentId) {
  if (!documentId) return null;
  try {
    const raw = localStorage.getItem(getChatStorageKey(documentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeChat(documentId, history) {
  if (!documentId || !Array.isArray(history)) return;
  try {
    localStorage.setItem(
      getChatStorageKey(documentId),
      JSON.stringify(history)
    );
  } catch {
    // Storage may be unavailable (private mode / quota). Persistence is best-effort.
  }
}

export function clearStoredChat(documentId) {
  if (!documentId) return;
  try {
    localStorage.removeItem(getChatStorageKey(documentId));
  } catch {
    // Ignore storage failures.
  }
}
