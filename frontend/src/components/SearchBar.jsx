import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { ARIA_LABELS, TITLES, PLACEHOLDERS } from '../constants';

export default function SearchBar({
  onSearch,
  placeholder = PLACEHOLDERS.SEARCH_CONVERSATIONS,
}) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div
        className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
          isFocused
            ? 'border-nyaya-500 bg-white dark:bg-slate-800'
            : 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900'
        }`}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-500 outline-none dark:text-slate-100 dark:placeholder-slate-400"
          aria-label={ARIA_LABELS.SEARCH_CONVERSATIONS}
        />
        {query && (
          <button
            onClick={handleClear}
            className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label={ARIA_LABELS.CLEAR_SEARCH}
            title={TITLES.CLEAR_SEARCH}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
