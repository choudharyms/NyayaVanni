import React, { useMemo } from 'react';
import { ListTree, FileQuestion } from 'lucide-react';
import {
  CLAUSE_TYPE_RULES,
  inferClauseType,
  inferClauseRisk,
} from '../../utils/clauseTypes';

function parseClauseTitle(clauseText) {
  const colonIndex = clauseText.indexOf(':');
  if (colonIndex > 0 && colonIndex < 80) {
    return clauseText.slice(0, colonIndex).trim();
  }
  const lower = clauseText.toLowerCase();
  const match = CLAUSE_TYPE_RULES.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword))
  );
  return match ? match.category : 'Clause';
}

export default function ClausePanel({ clauses = [], selectedIndex, onSelect }) {
  const items = useMemo(
    () =>
      (Array.isArray(clauses) ? clauses : []).map((text, index) => ({
        index,
        text,
        title: parseClauseTitle(text),
        type: inferClauseType(text),
        risk: inferClauseRisk(text),
      })),
    [clauses]
  );

  if (!items.length) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800">
          <FileQuestion className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No clauses were detected in this document.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-6 pt-6 pb-4">
        <ListTree className="w-5 h-5 text-nyaya-600 dark:text-nyaya-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Extracted Clauses
        </h3>
        <span className="ml-auto rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {items.length}
        </span>
      </div>

      <ul className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => {
          const active = item.index === selectedIndex;
          return (
            <li key={item.index}>
              <button
                onClick={() => onSelect?.(item.index)}
                aria-pressed={active}
                aria-label={`Navigate to ${item.title}`}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                  active
                    ? 'border-nyaya-500 bg-nyaya-50 dark:bg-nyaya-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-nyaya-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      item.risk === 'high'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400'
                    }`}
                  >
                    {item.risk === 'high' ? 'High risk' : 'Review'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.type}
                  </span>
                  <span className="text-xs font-medium text-nyaya-600 dark:text-nyaya-400">
                    {active ? 'Viewing' : 'Jump to'}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
