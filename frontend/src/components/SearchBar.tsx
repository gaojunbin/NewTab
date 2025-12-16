import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowRight, ChevronDown, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { searchApi } from '../services/api';

const searchEngines = [
  { id: 'google', name: 'Google', icon: 'logos:google-icon', url: 'https://www.google.com/search?q=', home: 'https://www.google.com' },
  { id: 'github', name: 'GitHub', icon: 'mdi:github', url: 'https://github.com/search?q=', home: 'https://github.com' },
  { id: 'youtube', name: 'YouTube', icon: 'logos:youtube-icon', url: 'https://www.youtube.com/results?search_query=', home: 'https://www.youtube.com' },
];

const engineIcons: Record<string, string> = Object.fromEntries(searchEngines.map(e => [e.id, e.icon]));
const searchUrls: Record<string, string> = Object.fromEntries(searchEngines.map(e => [e.id, e.url]));
const homeUrls: Record<string, string> = Object.fromEntries(searchEngines.map(e => [e.id, e.home]));

interface SearchBarProps {
  onFilterChange?: (query: string) => void;  // Kept for compatibility
  onFilterModeChange?: (active: boolean, query: string) => void;
}

function SearchBar({ onFilterModeChange }: SearchBarProps) {
  const { providers } = useAppStore();
  const { settings, addSearchHistory, removeSearchHistory, clearSearchHistory } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [activeEngine, setActiveEngine] = useState('google');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredEngine, setHoveredEngine] = useState<string | null>(null);
  const [hoveredHistory, setHoveredHistory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineDropdownRef = useRef<HTMLDivElement>(null);

  // Handle prefix commands
  useEffect(() => {
    if (query.startsWith('/')) {
      const parts = query.split(' ');
      const prefix = parts[0];

      // Check for filter mode - need space after /f or /filter
      if ((prefix === '/f' || prefix === '/filter') && parts.length > 1) {
        const filterQuery = parts.slice(1).join(' ');
        setQuery(''); // Clear the main search bar
        onFilterModeChange?.(true, filterQuery);
        return;
      }

      const provider = providers.find((p) => p.prefix === prefix);
      if (provider && parts.length > 1) {
        setActiveEngine(provider.name.toLowerCase());
        setQuery(parts.slice(1).join(' '));
      }
    }
  }, [query, providers, onFilterModeChange]);

  // Fetch suggestions
  useEffect(() => {

    const fetchSuggestions = async () => {
      if (query.length < 2 || query.startsWith('/')) {
        setSuggestions([]);
        return;
      }
      try {
        const results = await searchApi.getSuggestions(query, activeEngine);
        setSuggestions(results.slice(0, 8));
      } catch {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query, activeEngine]);

  const handleSearch = useCallback(
    (searchQuery: string = query) => {
      // If empty query, open homepage
      if (!searchQuery.trim()) {
        const homeUrl = homeUrls[activeEngine] || homeUrls.google;
        window.open(homeUrl, '_blank');
        return;
      }

      const url = searchUrls[activeEngine] || searchUrls.google;
      addSearchHistory(searchQuery);
      window.open(url + encodeURIComponent(searchQuery), '_blank');
      setQuery('');
      setShowSuggestions(false);
    },
    [query, activeEngine, addSearchHistory]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = suggestions.length + settings.searchHistory.filter(h => h.includes(query)).slice(0, 3).length;

    switch (e.key) {
      case 'Enter':
        if (selectedIndex >= 0) {
          const allItems = [
            ...settings.searchHistory.filter(h => h.includes(query)).slice(0, 3),
            ...suggestions,
          ];
          handleSearch(allItems[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        e.preventDefault();
        if (suggestions[0]) {
          setQuery(suggestions[0]);
        }
        break;
    }
  };

  // Close suggestions and engine dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (engineDropdownRef.current && !engineDropdownRef.current.contains(e.target as Node)) {
        setShowEngineDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus on space key
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, []);

  const historyMatches = settings.searchHistory.filter((h) =>
    h.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input - Glass style like original */}
      <div
        className="rounded-2xl backdrop-blur-[12px] transition-all duration-300"
        style={{
          background: settings.theme === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.04)',
          border: `1px solid ${settings.theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
        }}
      >
        <div className="flex items-center px-6 py-4">
          {/* Search Engine Selector */}
          <button
            onClick={() => setShowEngineDropdown(!showEngineDropdown)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity mr-2"
            style={{ backgroundColor: `${settings.accentColor}20` }}
          >
            <Icon icon={engineIcons[activeEngine] || 'mdi:search'} className="w-6 h-6" />
            <ChevronDown className="w-3 h-3" style={{ color: settings.accentColor }} />
          </button>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={`Search in ${searchEngines.find(e => e.id === activeEngine)?.name || 'Google'} · /f to filter`}
            className="flex-1 bg-transparent text-xl focus:outline-none"
            style={{ color: settings.textColor }}
            autoFocus
          />

          {/* Clear / Search Button */}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 rounded-lg transition-colors hover:opacity-70"
            >
              <X className="w-6 h-6" style={{ color: settings.accentColor }} />
            </button>
          )}
          <button
            onClick={() => handleSearch()}
            className="p-2 ml-1 rounded-lg transition-colors"
            style={{ backgroundColor: `${settings.accentColor}20` }}
          >
            <Search className="w-6 h-6" style={{ color: settings.textColor }} />
          </button>
        </div>
      </div>

      {/* Engine Dropdown - Outside search box to avoid overflow clipping */}
      <AnimatePresence>
        {showEngineDropdown && (
          <motion.div
            ref={engineDropdownRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-4 top-16 py-2 rounded-xl z-50 min-w-[160px] overflow-hidden"
            style={{
              background: settings.backgroundColor,
              border: `1px solid ${settings.accentColor}40`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            {searchEngines.map((engine) => (
              <button
                key={engine.id}
                onClick={() => {
                  setActiveEngine(engine.id);
                  setShowEngineDropdown(false);
                }}
                onMouseEnter={() => setHoveredEngine(engine.id)}
                onMouseLeave={() => setHoveredEngine(null)}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                style={{
                  backgroundColor: activeEngine === engine.id
                    ? `${settings.accentColor}30`
                    : hoveredEngine === engine.id
                      ? `${settings.accentColor}15`
                      : 'transparent',
                }}
              >
                <Icon icon={engine.icon} className="w-5 h-5" />
                <span className="text-sm" style={{ color: settings.textColor }}>{engine.name}</span>
                {activeEngine === engine.id && (
                  <span className="ml-auto text-xs" style={{ color: settings.accentColor }}>✓</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (query || historyMatches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-40 backdrop-blur-[12px]"
            style={{
              background: settings.theme === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${settings.theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
            }}
          >
            {/* History */}
            {historyMatches.length > 0 && (
              <div className="p-2" style={{ borderBottom: `1px solid ${settings.accentColor}20` }}>
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="text-xs" style={{ color: settings.accentColor }}>Search History</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSearchHistory();
                    }}
                    className="text-xs px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
                    style={{ color: settings.accentColor }}
                  >
                    Clear All
                  </button>
                </div>
                {historyMatches.map((item, idx) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: selectedIndex === idx || hoveredHistory === item
                        ? `${settings.accentColor}15`
                        : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredHistory(item)}
                    onMouseLeave={() => setHoveredHistory(null)}
                  >
                    <button
                      onClick={() => handleSearch(item)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: settings.accentColor }} />
                      <span className="text-sm flex-1 text-left truncate" style={{ color: settings.textColor }}>{item}</span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: settings.accentColor }} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchHistory(item);
                      }}
                      className="p-1 rounded transition-all duration-200"
                      style={{
                        opacity: hoveredHistory === item ? 1 : 0,
                        visibility: hoveredHistory === item ? 'visible' : 'hidden',
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs px-2 mb-1" style={{ color: settings.accentColor }}>Suggestions</div>
                {suggestions.map((item, idx) => (
                  <button
                    key={item}
                    onClick={() => handleSearch(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: selectedIndex === idx + historyMatches.length ? `${settings.accentColor}20` : 'transparent',
                    }}
                  >
                    <Search className="w-4 h-4" style={{ color: settings.accentColor }} />
                    <span className="text-sm flex-1 text-left" style={{ color: settings.textColor }}>{item}</span>
                    <ArrowRight className="w-4 h-4" style={{ color: settings.accentColor }} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
