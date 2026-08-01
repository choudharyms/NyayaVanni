import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  SearchX,
  X,
} from 'lucide-react';

function findMatches(text, needle) {
  if (!text || !needle) return [];
  const normalizedText = text.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  const matches = [];
  let fromIndex = 0;
  while (fromIndex < normalizedText.length) {
    const index = normalizedText.indexOf(normalizedNeedle, fromIndex);
    if (index === -1) break;
    matches.push({ start: index, end: index + needle.length });
    fromIndex = index + needle.length;
  }
  return matches;
}

function renderHighlightedText(text, matches, activeIndex) {
  if (!matches.length) return text;
  const parts = [];
  let cursor = 0;

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    if (match.start > cursor) {
      parts.push(text.slice(cursor, match.start));
    }
    parts.push(
      <mark
        key={match.start}
        className={`rounded px-0.5 ${
          i === activeIndex
            ? 'active bg-nyaya-500 text-white'
            : 'bg-yellow-200 dark:bg-yellow-500/40 text-inherit'
        }`}
      >
        {text.slice(match.start, match.end)}
      </mark>
    );
    cursor = match.end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

export default function DocumentSearch({ text = '' }) {
  const [query, setQuery] = useState('');
  const [activeMatch, setActiveMatch] = useState(0);
  const viewerRef = useRef(null);
  const activeMarkRef = useRef(null);

  const matches = useMemo(() => findMatches(text, query.trim()), [text, query]);

  useEffect(() => {
    if (matches.length === 0) return;
    const timer = setTimeout(() => {
      activeMarkRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [matches, activeMatch]);

  const goToMatch = (direction) => {
    if (matches.length === 0) return;
    setActiveMatch((prev) => {
      const next =
        direction === 'next' ? prev + 1 : prev - 1;
      return (next + matches.length) % matches.length;
    });
  };

  const handleClear = () => {
    setQuery('');
    setActiveMatch(0);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Search Document
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveMatch(0);
            }}
            placeholder="Search for a term, date, clause, or party..."
            aria-label="Search inside document"
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-nyaya-500/40"
          />
          {query && (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="min-w-[90px] text-xs font-semibold text-slate-600 dark:text-slate-300">
            {query.trim()
              ? matches.length === 0
                ? 'No matches found'
                : `${matches.length} match${matches.length > 1 ? 'es' : ''} found`
              : ''}
          </span>
          <button
            onClick={() => goToMatch('prev')}
            disabled={matches.length === 0}
            aria-label="Previous match"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => goToMatch('next')}
            disabled={matches.length === 0}
            aria-label="Next match"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={viewerRef}
        className="h-[360px] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800"
      >
        {!text ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <SearchX className="w-8 h-8 mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No extracted text available to search.
            </p>
          </div>
        ) : query.trim() && matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <SearchX className="w-8 h-8 mb-3 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No matches found for “{query}”.
            </p>
          </div>
        ) : (
          <div
            ref={(node) => {
              activeMarkRef.current = node?.querySelector('mark.active') || null;
            }}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {renderHighlightedText(text, matches, activeMatch)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
