const SESSION_STORAGE_KEY = "nyayavanni_session_id";

export async function ensureSessionId(apiUrl) {
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const response = await fetch(`${apiUrl}/api/session`, { method: "GET" });
  if (!response.ok) throw new Error("Session initialization failed");

  const data = await response.json();
  if (!data.sessionId) throw new Error("Session ID missing from response");

  localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
  return data.sessionId;
}
