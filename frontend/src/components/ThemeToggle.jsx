import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-nyaya-500/50 cursor-pointer overflow-hidden group shadow-sm bg-white dark:bg-slate-950"
      title={theme === 'light' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {theme === 'light' ? (
          <Sun className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 text-amber-400 group-hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-500 rotate-0 scale-100 group-hover:rotate-12" />
        )}
      </div>
    </button>
  );
}
