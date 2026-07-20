import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ARIA_LABELS, TITLES } from '../constants';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="focus:ring-nyaya-500/50 group relative cursor-pointer overflow-hidden rounded-full border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-100 focus:ring-2 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
      title={theme === 'light' ? TITLES.SWITCH_TO_LIGHT : TITLES.SWITCH_TO_DARK}
      aria-label={ARIA_LABELS.TOGGLE_THEME}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        {theme === 'light' ? (
          <Sun className="h-5 w-5 scale-100 rotate-0 text-amber-400 transition-transform duration-500 group-hover:rotate-45" />
        ) : (
          <Moon className="h-5 w-5 scale-100 rotate-0 transition-transform duration-500 group-hover:rotate-12" />
        )}
      </div>
    </button>
  );
}
