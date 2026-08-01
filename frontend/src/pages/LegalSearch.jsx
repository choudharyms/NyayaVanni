import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SOURCES = [
  { value: '', label: 'All sources' },
  { value: 'IPC', label: 'IPC' },
  { value: 'BNS', label: 'BNS' },
  { value: 'CONSTITUTION', label: 'Constitution' },
  { value: 'NI ACT', label: 'NI Act' },
  { value: 'HINDU MARRIAGE ACT', label: 'Hindu Marriage Act' },
];

export default function LegalSearch() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const runSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2) {
      setError(
        language === 'en'
          ? 'Please enter at least 2 characters.'
          : 'कृपया कम से कम 2 अक्षर दर्ज करें।',
      );
      return;
    }
    setError('');
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: '15' });
      if (source) params.set('source', source);
      const response = await fetch(`${API_URL}/api/legal/search?${params}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total_count || 0);
    } catch {
      setError(
        language === 'en'
          ? 'Unable to reach the legal search service. Please try again.'
          : 'कानूनी खोज सेवा तक नहीं पहुंच पा रहे हैं। कृपया पुनः प्रयास करें।',
      );
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <div className="max-w-5xl mx-auto flex flex-col flex-1 w-full px-6 py-6">
        <header className="flex items-center justify-between py-4 mb-8 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />{' '}
            {language === 'en' ? 'Back' : 'वापस'}
          </button>
          <ThemeToggle />
        </header>

        <main className="flex-1">
          <h1 className="text-4xl font-extrabold text-slate-850 dark:text-white flex items-center gap-3">
            <Scale className="w-9 h-9 text-indigo-600 dark:text-indigo-400" />
            {language === 'en' ? 'Legal Search' : 'कानूनी खोज'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-3 max-w-2xl">
            {language === 'en'
              ? 'Search Indian statutory provisions by section numbers, Constitution articles, Act names, keywords or legal phrases.'
              : 'धारा संख्या, संविधान अनुच्छेद, अधिनियम नाम, कीवर्ड या कानूनी वाक्यांशों द्वारा भारतीय कानूनी प्रावधान खोजें।'}
          </p>

          <form
            onSubmit={runSearch}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'e.g. Section 420 IPC, Article 21, cheque bounce...'
                    : 'जैसे धारा 420, अनुच्छेद 21, चेक बाउंस...'
                }
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SOURCES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition"
            >
              {loading
                ? language === 'en'
                  ? 'Searching...'
                  : 'खोज रहे हैं...'
                : language === 'en'
                  ? 'Search'
                  : 'खोजें'}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {searched && !loading && !error && (
            <div className="mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? `${total} result(s) found`
                  : `${total} परिणाम मिले`}
              </p>
              {total === 0 ? (
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                  {language === 'en'
                    ? 'No matching provisions found. Try different keywords or section numbers.'
                    : 'कोई मिलता-जुलता प्रावधान नहीं मिला। अलग कीवर्ड या धारा संख्या आज़माएं।'}
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {results.map((item, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 text-xs font-semibold">
                          {item.source || 'Legal Provision'}
                        </span>
                        {item.section_number && (
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 text-xs font-semibold">
                            {item.section_number}
                          </span>
                        )}
                        {item.matched_terms && item.matched_terms.length > 0 && (
                          <span className="text-xs text-slate-400">
                            matches: {item.matched_terms.join(', ')}
                          </span>
                        )}
                      </div>
                      {item.title && (
                        <h3 className="mt-3 font-semibold text-slate-850 dark:text-white">
                          {item.title}
                        </h3>
                      )}
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.text}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
