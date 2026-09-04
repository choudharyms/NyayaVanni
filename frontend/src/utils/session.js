let sessionInitialized = false;

/**
 * Ensures a session cookie is initialized by calling the session API.
 * @param {string} apiUrl - The base URL of the API server.
 * @returns {Promise<void>}
 */

export async function ensureSessionId(apiUrl) {
  if (sessionInitialized) return;

  try {
    const response = await fetch(`${apiUrl}/api/session`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      sessionInitialized = true;
    }
  } catch (error) {
    console.warn('Failed to initialize session cookie:', error);
  }
}
