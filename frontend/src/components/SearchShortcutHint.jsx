import React, { useMemo } from 'react';

const SearchShortcutHint = () => {
  const isMac = useMemo(() => navigator.userAgent.toLowerCase().includes('mac'), []);

  const shortcutText = isMac ? '⌘ K' : 'Ctrl K';

  return (
    <div className="inline-flex items-center gap-1.5 ml-2">
      <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-300 rounded-md shadow-sm dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600">
        {shortcutText}
      </kbd>
      <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
        to focus search
      </span>
    </div>
  );
};

export default SearchShortcutHint;
