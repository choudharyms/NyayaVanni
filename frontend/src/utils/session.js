let sessionInitialized = false;
let storedSessionId = null;

export async function ensureSessionId(apiUrl) {
  if (sessionInitialized) return storedSessionId;

  try {
    const response = await fetch(`${apiUrl}/api/session`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      storedSessionId = data.sessionId || null;
      sessionInitialized = true;
      return storedSessionId;
    }
  } catch (error) {
    console.warn('Failed to initialize session cookie:', error);
  }
}
