import React, { useMemo } from 'react';

const SearchShortcutHint = () => {
  const isMac = useMemo(
    () => navigator.userAgent.toLowerCase().includes('mac'),
    []
  );

  const shortcutText = isMac ? '⌘ K' : 'Ctrl K';

  return (
    <div className="ml-2 inline-flex items-center gap-1.5">
      <kbd className="rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {shortcutText}
      </kbd>
      <span className="hidden text-xs text-gray-500 sm:inline dark:text-gray-400">
        to focus search
      </span>
    </div>
  );
};

export default SearchShortcutHint;
