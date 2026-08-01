import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileSearch, MousePointerClick } from 'lucide-react';
import { inferClauseType } from '../utils/clauseTypes';
import { buildSnippet, findMatches } from '../utils/textMatch';

function renderHighlightedText(text, ranges) {
  if (!ranges.length) return text;
  const parts = [];
  let cursor = 0;
  const merged = [...ranges].sort((a, b) => a.start - b.start);

  for (const range of merged) {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }
    parts.push(
      <mark
        key={range.start}
        className="bg-yellow-200 dark:bg-yellow-500/40 text-inherit rounded px-0.5"
      >
        {text.slice(range.start, range.end)}
      </mark>
    );
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

export default function ClauseHighlightViewer({ text = '', clauses = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const viewerRef = useRef(null);
  const activeMarkRef = useRef(null);

  const clauseItems = useMemo(
    () =>
      (Array.isArray(clauses) ? clauses : []).map((clause, index) => ({
        index,
        text: clause,
        snippet: buildSnippet(clause),
        type: inferClauseType(clause),
      })),
    [clauses]
  );

  const activeRanges = useMemo(() => {
    if (selectedIndex === null) return [];
    const clauseText = clauseItems[selectedIndex]?.text;
    if (!clauseText) return [];
    return findMatches(text, clauseText).length
      ? findMatches(text, clauseText)
      : [];
  }, [selectedIndex, clauseItems, text]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const timer = setTimeout(() => {
      activeMarkRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedIndex, activeRanges]);

  if (!clauseItems.length) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800">
          <FileSearch className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No clauses to highlight in the extracted document text.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileSearch className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Clause Highlight in Document
        </h3>
      </div>

      <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <MousePointerClick className="w-3.5 h-3.5" />
        Select a clause to jump to and highlight it in the extracted document
        text.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {clauseItems.map((item) => {
          const active = item.index === selectedIndex;
          return (
            <button
              key={item.index}
              onClick={() => setSelectedIndex(item.index)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? 'border-nyaya-500 bg-nyaya-600 text-white shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-nyaya-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              {item.type}
            </button>
          );
        })}
      </div>

      <div
        ref={viewerRef}
        className="h-[400px] overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800"
      >
        {selectedIndex === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {text
              ? 'Click a clause above to see where it appears in the document.'
              : 'No extracted text available to highlight.'}
          </p>
        ) : (
          <>
            {activeRanges.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                The exact clause text could not be located in the extracted
                document text.
              </p>
            ) : (
              <div
                ref={(node) => {
                  activeMarkRef.current =
                    node?.querySelector('mark') || null;
                }}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {renderHighlightedText(text, activeRanges)}
                </pre>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
