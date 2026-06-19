import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, X } from 'lucide-react';
import { lawyers } from '../data/lawyers';

function HighlightedText({ text, query }) {
  if (!query?.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-nyaya-100 dark:bg-nyaya-800 text-nyaya-800 dark:text-nyaya-200">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function HireLawyer() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [filterType, setFilterType] = useState('All');
  const inputRef = useRef(null);

  const categories = [...new Set(lawyers.map((l) => l.specialty))];

  // Autocomplete suggestions
  const suggestions = searchTerm.trim()
    ? lawyers.filter((lawyer) => {
        const query = searchTerm.toLowerCase();
        return (
          lawyer.name.toLowerCase().includes(query) ||
          lawyer.specialty.toLowerCase().includes(query) ||
          lawyer.location?.toLowerCase().includes(query)
        );
      })
    : [];

  // Show dropdown only when input focused and search term present
  useEffect(() => {
    setIsDropdownOpen(isSearchFocused && searchTerm.trim().length > 0);
  }, [isSearchFocused, searchTerm]);

  const handleSelectSuggestion = (lawyer) => {
    setSearchTerm(lawyer.name);
    setIsDropdownOpen(false);
    setIsSearchFocused(false);
    inputRef.current?.blur();
  };

  const handleSearchKeyDown = (e) => {
    if (!isDropdownOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      inputRef.current?.blur();
    }
  };

  // Filtered lawyers for main list
  const filteredLawyers = searchTerm.trim()
    ? suggestions
    : filterType === 'All'
      ? lawyers
      : lawyers.filter((l) => l.specialty === filterType);

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-controls="lawyer-search-suggestions"
          aria-activedescendant={
            highlightedIndex >= 0
              ? `lawyer-suggestion-${suggestions[highlightedIndex]?.id}`
              : undefined
          }
          placeholder={t('lawyers.search')}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          onKeyDown={handleSearchKeyDown}
          className="w-full py-4 pl-12 pr-20 text-slate-900 dark:text-white transition border rounded-2xl bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-white/10 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-nyaya-500/70 focus:border-nyaya-500/50"
        />
        {/* Autocomplete Dropdown */}
        {isDropdownOpen && (
          <div
            id="lawyer-search-suggestions"
            role="listbox"
            className="absolute z-20 w-full mt-1 overflow-hidden border shadow-lg rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900"
          >
            {suggestions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                No lawyers found
              </p>
            ) : (
              <ul className="py-1">
                {suggestions.map((lawyer, index) => (
                  <li
                    key={lawyer.id}
                    id={`lawyer-suggestion-${lawyer.id}`}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelectSuggestion(lawyer)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                      highlightedIndex === index
                        ? 'bg-nyaya-500/10 dark:bg-nyaya-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <img
                      src={lawyer.image}
                      alt=""
                      className="object-cover w-9 h-9 border rounded-full border-slate-200 dark:border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-800 dark:text-white">
                        <HighlightedText text={lawyer.name} query={searchTerm} />
                      </p>
                      <p className="text-xs truncate text-nyaya-600 dark:text-nyaya-300">
                        <HighlightedText text={lawyer.specialty} query={searchTerm} />
                      </p>
                      <p className="flex items-center gap-1 mt-0.5 text-xs truncate text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" />
                        <HighlightedText text={lawyer.location} query={searchTerm} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Buttons (only when not searching) */}
      {!searchTerm.trim() && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterType('All')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition ${
              filterType === 'All'
                ? 'bg-nyaya-500 text-white'
                : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                filterType === cat
                  ? 'bg-nyaya-500 text-white'
                  : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Content: Empty State or Lawyer Grid */}
      {filteredLawyers.length === 0 ? (
        <div className="p-10 text-center border rounded-4xl border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-md">
          {/* Illustration */}
          <div className="flex items-center justify-center mx-auto mb-6 w-24 h-24 rounded-full bg-nyaya-500/10 dark:bg-nyaya-500/20 ring-1 ring-nyaya-500/30 dark:ring-nyaya-500/50">
            <Search className="w-10 h-10 text-nyaya-500 dark:text-nyaya-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-850 dark:text-white">No lawyers found</h3>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchTerm.trim().length > 0 ? (
              <>
                No results for{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  &ldquo;{searchTerm}&rdquo;
                </span>
                . Try a different name, specialty, or location.
              </>
            ) : (
              <>No lawyers match the selected filter. Try selecting a different practice area.</>
            )}
          </p>
          {/* Suggestions */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Criminal Defense', 'Family Law & Divorce', 'Corporate & Business'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setFilterType(suggestion);
                  setSearchTerm('');
                }}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-nyaya-500/20 bg-nyaya-500/10 text-nyaya-600 dark:text-nyaya-300 hover:bg-nyaya-500/20 transition-all cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('All');
            }}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 mt-6 font-semibold text-white transition rounded-xl bg-gradient-to-r from-nyaya-500 to-blue-600 hover:from-nyaya-400 hover:to-blue-500 shadow-lg hover:scale-105 cursor-pointer"
          >
            <X className="w-4 h-4" /> Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="group relative rounded-4xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl p-6 transition hover:shadow-lg"
            >
              <img
                src={lawyer.image}
                alt={lawyer.name}
                className="object-cover w-full h-40 mb-4 rounded-xl"
              />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {lawyer.name}
              </h3>
              <p className="text-sm text-nyaya-600 dark:text-nyaya-300">{lawyer.specialty}</p>
              <p className="flex items-center gap-1 mt-2 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4" /> {lawyer.location}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}