import { useEffect } from 'react';

/**
 * Custom hook to handle keyboard shortcuts
 * @param {string} key - The key to listen for (e.g., 'k', 'Escape')
 * @param {Function} callback - Function to execute when shortcut is pressed
 * @param {boolean} requireCtrl - Whether Ctrl/Cmd is required (default: true)
 */
const useKeyboardShortcut = (key, callback, requireCtrl = true) => {
  useEffect(() => {
    const handler = (event) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const isTyping = event.target?.tagName === 'INPUT' ||
                       event.target?.tagName === 'TEXTAREA' ||
                       event.target?.isContentEditable;

      if (isTyping) return;

      const isCtrlOrCmd = requireCtrl ? (event.ctrlKey || event.metaKey) : true;
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();

      if (isCtrlOrCmd && isKeyMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, requireCtrl]);
};

export default useKeyboardShortcut;
