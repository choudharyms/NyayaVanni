/**
 * useSSEChat.js
 * Custom hook for Server-Sent Events based streaming chat.
 * Provides a ChatGPT-like token-by-token streaming UX.
 */
import { useState, useRef, useCallback } from 'react';

export function useSSEChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const streamMessage = useCallback(
    async (userMessage, language = 'en', onChunk, onDone, onError) => {
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const params = new URLSearchParams({
        user_message: userMessage,
        language,
      });

      try {
        const response = await fetch(`${apiUrl}/api/chat/stream?${params}`, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          headers: { Accept: 'text/event-stream' },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onDone?.();
              setIsStreaming(false);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) onChunk?.(parsed.text);
              if (parsed.error) onError?.(parsed.error);
            } catch {
              // ignore malformed chunks
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          onError?.(err.message);
        }
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { streamMessage, isStreaming, abort };
}
