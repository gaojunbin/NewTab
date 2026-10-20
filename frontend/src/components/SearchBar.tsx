import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, ArrowUpRight, ChevronDown, Trash2, Sparkles, Compass } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore, rgba, isColorDark } from '../stores/useSettingsStore';
import { searchApi, normalizeUrl, extractDomain } from '../services/api';

export const searchEngines = [
  { id: 'google', name: 'Google', icon: 'logos:google-icon', url: 'https://www.google.com/search?q=', home: 'https://www.google.com', prefix: '/g' },
  { id: 'bing', name: 'Bing', icon: 'logos:bing', url: 'https://www.bing.com/search?q=', home: 'https://www.bing.com', prefix: '/bi' },
  { id: 'baidu', name: 'Baidu', icon: 'simple-icons:baidu', url: 'https://www.baidu.com/s?wd=', home: 'https://www.baidu.com', prefix: '/bd' },
  { id: 'github', name: 'GitHub', icon: 'mdi:github', url: 'https://github.com/search?q=', home: 'https://github.com', prefix: '/gh' },
  { id: 'youtube', name: 'YouTube', icon: 'logos:youtube-icon', url: 'https://www.youtube.com/results?search_query=', home: 'https://www.youtube.com', prefix: '/y' },
  { id: 'chatgpt', name: 'ChatGPT', icon: 'simple-icons:openai', url: 'https://chatgpt.com/?q=', home: 'https://chatgpt.com', prefix: '/ai' },
  { id: 'perplexity', name: 'Perplexity', icon: 'simple-icons:perplexity', url: 'https://www.perplexity.ai/search?q=', home: 'https://www.perplexity.ai', prefix: '/p' },
  { id: 'nodeseek', name: 'NodeSeek', icon: 'mdi:server-network', url: 'https://www.nodeseek.com/search?q=', home: 'https://www.nodeseek.com', prefix: '/ns' },
  { id: 'linux.do', name: 'Linux.do', icon: 'mdi:linux', url: 'https://linux.do/search?q=', home: 'https://linux.do', prefix: '/ld' },
];

const filterOption = { id: 'filter', name: 'JunbinUniverse', icon: 'mdi:filter-variant', prefix: '/f' };

const engineIcons: Record<string, string> = Object.fromEntries(searchEngines.map((e) => [e.id, e.icon]));
const searchUrls: Record<string, string> = Object.fromEntries(searchEngines.map((e) => [e.id, e.url]));
const homeUrls: Record<string, string> = Object.fromEntries(searchEngines.map((e) => [e.id, e.home]));

interface SearchBarProps {
  onFilterChange?: (query: string) => void;
  onFilterModeChange?: (active: boolean, query: string) => void;
  onOpenCommandPalette?: () => void;
}

interface QuickMatchItem {
  id: string;
  name: string;
  url: string;
  category: string;
  icon?: string;
  kind: 'app' | 'bookmark';
}

function SearchBar({ onFilterModeChange, onOpenCommandPalette }: SearchBarProps) {
  const { appGroups, bookmarks, providers } = useAppStore();
  const { settings, setSettings, addSearchHistory, removeSearchHistory, clearSearchHistory } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [activeEngine, setActiveEngine] = useState(() =>
    searchEngines.some((e) => e.id === settings.defaultSearchEngine)
      ? settings.defaultSearchEngine
      : 'google'
  );
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredHistory, setHoveredHistory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineDropdownRef = useRef<HTMLDivElement>(null);

  // Sync activeEngine when settings.defaultSearchEngine changes
  useEffect(() => {
    if (settings.defaultSearchEngine && searchEngines.some((e) => e.id === settings.defaultSearchEngine)) {
      setActiveEngine(settings.defaultSearchEngine);
    }
  }, [settings.defaultSearchEngine]);

  // Handle prefix commands (/g, /bi, /bd, /gh, /y, /ai, /p, /ns, /ld, /f)
  useEffect(() => {
    if (query.startsWith('/')) {
      const parts = query.split(' ');
      const prefix = parts[0].toLowerCase();

      if (prefix === '/f' || prefix === '/filter') {
        const filterQuery = parts.length > 1 ? parts.slice(1).join(' ') : '';
        setQuery('');
        setShowSuggestions(false);
        onFilterModeChange?.(true, filterQuery);
        return;
      }

      if (parts.length > 1) {
        const matchedEngine = searchEngines.find((e) => e.prefix === prefix);
        if (matchedEngine) {
          setActiveEngine(matchedEngine.id);
          setQuery(parts.slice(1).join(' '));
          return;
        }

        const provider = providers.find((p) => p.prefix.toLowerCase() === prefix);
        if (provider) {
          const normalized = provider.name.toLowerCase();
          const byName = searchEngines.find(
            (e) => e.id === normalized || normalized.includes(e.id)
          );
          if (byName) {
            setActiveEngine(byName.id);
            setQuery(parts.slice(1).join(' '));
          }
        }
      }
    }
  }, [query, providers, onFilterModeChange]);

  // Instant local matches across Apps and Bookmarks
  const quickMatches = useMemo<QuickMatchItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.startsWith('/')) return [];

    const results: QuickMatchItem[] = [];
    for (const group of appGroups) {
      for (const app of group.apps) {
        if (
          app.name.toLowerCase().includes(trimmed) ||
          app.url.toLowerCase().includes(trimmed)
        ) {
          results.push({
            id: `app-${app.id}`,
            name: app.name,
            url: normalizeUrl(app.url),
            category: group.category,
            icon: app.icon,
            kind: 'app',
          });
        }
      }
    }
    for (const cat of bookmarks) {
      for (const link of cat.links) {
        if (
          link.name.toLowerCase().includes(trimmed) ||
          link.url.toLowerCase().includes(trimmed)
        ) {
          results.push({
            id: `bm-${link.id}`,
            name: link.name,
            url: normalizeUrl(link.url),
            category: cat.category,
            kind: 'bookmark',
          });
        }
      }
    }
    return results.slice(0, 4);
  }, [query, appGroups, bookmarks]);

  // Fetch web suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2 || query.startsWith('/')) {
        setSuggestions([]);
        return;
      }
      try {
        const results = await searchApi.getSuggestions(query.trim(), activeEngine);
        setSuggestions(results.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 220);
    return () => clearTimeout(debounce);
  }, [query, activeEngine]);

  const historyMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return settings.searchHistory
      .filter((h) => h.toLowerCase().includes(q))
      .slice(0, 3);
  }, [settings.searchHistory, query]);

  const handleSearch = useCallback(
    (searchQuery: string = query) => {
      if (!searchQuery.trim()) {
        const homeUrl = homeUrls[activeEngine] || homeUrls.google;
        window.open(homeUrl, '_blank');
        return;
      }

      const url = searchUrls[activeEngine] || searchUrls.google;
      addSearchHistory(searchQuery.trim());
      window.open(url + encodeURIComponent(searchQuery.trim()), '_blank');
      setQuery('');
      setShowSuggestions(false);
    },
    [query, activeEngine, addSearchHistory]
  );

  // Unified navigable items list: [quickMatches, historyMatches, suggestions]
  const navigableItems = useMemo(() => {
    const items: Array<{ type: 'quick'; item: QuickMatchItem } | { type: 'query'; value: string }> = [];
    for (const qm of quickMatches) {
      items.push({ type: 'quick', item: qm });
    }
    for (const hm of historyMatches) {
      items.push({ type: 'query', value: hm });
    }
    for (const sg of suggestions) {
      items.push({ type: 'query', value: sg });
    }
    return items;
  }, [quickMatches, historyMatches, suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = navigableItems.length;

    switch (e.key) {
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < totalItems) {
          const target = navigableItems[selectedIndex];
          if (target.type === 'quick') {
            window.open(target.item.url, '_blank');
            setQuery('');
            setShowSuggestions(false);
          } else {
            handleSearch(target.value);
          }
        } else {
          handleSearch();
        }
        break;
      case 'ArrowDown':
        if (totalItems > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        }
        break;
      case 'ArrowUp':
        if (totalItems > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        if (suggestions[0]) {
          e.preventDefault();
          setQuery(suggestions[0]);
        }
        break;
    }
  };

  // Close dropdowns on outside click
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

  // Safe "/" shortcut to focus search when not typing in an input
  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect && rect.top >= 0 && rect.bottom <= window.innerHeight) {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleSlashKey);
    return () => window.removeEventListener('keydown', handleSlashKey);
  }, []);

  const dark = isColorDark(settings.backgroundColor);
  const currentEngineObj = searchEngines.find((e) => e.id === activeEngine) || searchEngines[0];

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main Search Capsule */}
      <motion.div
        animate={{
          scale: isFocused ? 1.005 : 1,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="rounded-2xl backdrop-blur-2xl transition-all duration-300"
        style={{
          background: dark
            ? rgba('#ffffff', isFocused ? 0.09 : 0.06)
            : rgba('#ffffff', isFocused ? 0.88 : 0.72),
          border: `1px solid ${rgba(settings.textColor, isFocused ? 0.18 : 0.09)}`,
          boxShadow: isFocused
            ? `0 12px 36px -8px ${rgba('#000000', dark ? 0.45 : 0.09)}, 0 0 0 3px ${rgba(settings.textColor, 0.04)}`
            : `0 4px 20px -4px ${rgba('#000000', dark ? 0.28 : 0.05)}`,
        }}
      >
        <div className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
          {/* Search Engine Pill Selector */}
          <button
            type="button"
            onClick={() => setShowEngineDropdown(!showEngineDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: rgba(settings.textColor, 0.055),
              border: `1px solid ${rgba(settings.textColor, 0.06)}`,
            }}
            title={`Current: ${currentEngineObj.name} (${currentEngineObj.prefix})`}
          >
            <Icon
              icon={engineIcons[activeEngine] || 'mdi:magnify'}
              className="w-4 h-4 sm:w-5 sm:h-5"
              style={
                ['github', 'baidu', 'chatgpt', 'perplexity', 'nodeseek', 'linux.do'].includes(activeEngine)
                  ? { color: settings.textColor }
                  : undefined
              }
            />
            <span
              className="hidden sm:inline text-xs font-medium tracking-tight"
              style={{ color: settings.textColor, opacity: 0.85 }}
            >
              {currentEngineObj.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showEngineDropdown ? 'rotate-180' : ''}`}
              style={{ color: settings.accentColor }}
            />
          </button>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${currentEngineObj.name} or type /f to filter...`}
            className="flex-1 bg-transparent text-sm sm:text-base font-normal focus:outline-none placeholder:opacity-45"
            style={{ color: settings.textColor }}
          />

          {/* Right Controls: Clear, Command Palette Hint, Search Button */}
          <div className="flex items-center gap-1.5">
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg transition-opacity hover:opacity-75"
                title="Clear"
              >
                <X className="w-4 h-4" style={{ color: settings.accentColor }} />
              </button>
            ) : (
              onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono transition-opacity opacity-50 hover:opacity-90"
                  style={{
                    background: rgba(settings.textColor, 0.05),
                    border: `1px solid ${rgba(settings.textColor, 0.08)}`,
                    color: settings.textColor,
                  }}
                  title="Open Command Palette (⌘K)"
                >
                  <span>⌘K</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => handleSearch()}
              className="p-2 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                background: query.trim() ? settings.textColor : rgba(settings.textColor, 0.06),
                color: query.trim() ? settings.backgroundColor : settings.textColor,
              }}
              title="Search"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Engine Dropdown Menu */}
      <AnimatePresence>
        {showEngineDropdown && (
          <motion.div
            ref={engineDropdownRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full mt-2 py-1.5 rounded-2xl z-50 min-w-[200px] max-h-[65vh] overflow-y-auto backdrop-blur-2xl"
            style={{
              background: dark ? rgba('#18181b', 0.94) : rgba('#ffffff', 0.95),
              border: `1px solid ${rgba(settings.textColor, 0.12)}`,
              boxShadow: `0 16px 40px -8px ${rgba('#000000', dark ? 0.55 : 0.15)}`,
            }}
          >
            <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider opacity-50" style={{ color: settings.textColor }}>
              Search Engines
            </div>
            {searchEngines.map((engine) => {
              const isSelected = activeEngine === engine.id;
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => {
                    setActiveEngine(engine.id);
                    setSettings({ defaultSearchEngine: engine.id });
                    setShowEngineDropdown(false);
                    inputRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors duration-150"
                  style={{
                    backgroundColor: isSelected ? rgba(settings.textColor, 0.08) : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = rgba(settings.textColor, 0.04);
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon
                    icon={engine.icon}
                    className="w-4 h-4 flex-shrink-0"
                    style={
                      ['github', 'baidu', 'chatgpt', 'perplexity', 'nodeseek', 'linux.do'].includes(engine.id)
                        ? { color: settings.textColor }
                        : undefined
                    }
                  />
                  <span className="text-xs sm:text-sm font-medium" style={{ color: settings.textColor }}>
                    {engine.name}
                  </span>
                  <span
                    className="ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded opacity-55"
                    style={{
                      background: rgba(settings.textColor, 0.05),
                      color: settings.textColor,
                    }}
                  >
                    {engine.prefix}
                  </span>
                </button>
              );
            })}

            <div className="mx-3 my-1.5 border-t" style={{ borderColor: rgba(settings.textColor, 0.08) }} />

            <button
              type="button"
              onClick={() => {
                setShowEngineDropdown(false);
                onFilterModeChange?.(true, '');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors duration-150"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = rgba(settings.textColor, 0.05);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Icon icon={filterOption.icon} className="w-4 h-4" style={{ color: settings.textColor }} />
              <span className="text-xs sm:text-sm font-medium" style={{ color: settings.textColor }}>
                {filterOption.name}
              </span>
              <span
                className="ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded opacity-55"
                style={{
                  background: rgba(settings.textColor, 0.05),
                  color: settings.textColor,
                }}
              >
                {filterOption.prefix}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions & Quick Launch Dropdown */}
      <AnimatePresence>
        {showSuggestions && (quickMatches.length > 0 || historyMatches.length > 0 || suggestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-40 backdrop-blur-2xl"
            style={{
              background: dark ? rgba('#18181b', 0.92) : rgba('#ffffff', 0.94),
              border: `1px solid ${rgba(settings.textColor, 0.11)}`,
              boxShadow: `0 20px 48px -12px ${rgba('#000000', dark ? 0.55 : 0.14)}`,
            }}
          >
            {/* 1. Quick Launch (Instant Local Apps & Bookmarks) */}
            {quickMatches.length > 0 && (
              <div
                className="p-2"
                style={{
                  borderBottom:
                    historyMatches.length > 0 || suggestions.length > 0
                      ? `1px solid ${rgba(settings.textColor, 0.07)}`
                      : undefined,
                }}
              >
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium opacity-55" style={{ color: settings.textColor }}>
                  <Compass className="w-3 h-3" />
                  <span>Quick Launch</span>
                </div>
                {quickMatches.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        window.open(item.url, '_blank');
                        setQuery('');
                        setShowSuggestions(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left"
                      style={{
                        backgroundColor: isSelected ? rgba(settings.textColor, 0.08) : 'transparent',
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: rgba(settings.textColor, 0.06) }}
                      >
                        <Icon
                          icon={
                            item.icon
                              ? item.icon.includes(':')
                                ? item.icon
                                : `mdi:${item.icon}`
                              : 'mdi:bookmark-outline'
                          }
                          className="w-4 h-4"
                          style={{ color: settings.textColor }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate" style={{ color: settings.textColor }}>
                            {item.name}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md opacity-65"
                            style={{
                              background: rgba(settings.textColor, 0.06),
                              color: settings.textColor,
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] truncate opacity-50" style={{ color: settings.textColor }}>
                          {extractDomain(item.url)}
                        </p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 opacity-50 flex-shrink-0" style={{ color: settings.textColor }} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Search History */}
            {historyMatches.length > 0 && (
              <div
                className="p-2"
                style={{
                  borderBottom:
                    suggestions.length > 0 ? `1px solid ${rgba(settings.textColor, 0.07)}` : undefined,
                }}
              >
                <div className="flex items-center justify-between px-2.5 py-1">
                  <span className="text-[11px] font-medium opacity-55" style={{ color: settings.textColor }}>
                    Recent Searches
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSearchHistory();
                    }}
                    className="text-[11px] px-2 py-0.5 rounded hover:opacity-80 transition-opacity opacity-60"
                    style={{ color: settings.textColor }}
                  >
                    Clear
                  </button>
                </div>
                {historyMatches.map((item, idx) => {
                  const navIdx = quickMatches.length + idx;
                  const isSelected = selectedIndex === navIdx;
                  return (
                    <div
                      key={item}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
                      style={{
                        backgroundColor:
                          isSelected || hoveredHistory === item
                            ? rgba(settings.textColor, 0.07)
                            : 'transparent',
                      }}
                      onMouseEnter={() => {
                        setHoveredHistory(item);
                        setSelectedIndex(navIdx);
                      }}
                      onMouseLeave={() => setHoveredHistory(null)}
                    >
                      <button
                        type="button"
                        onClick={() => handleSearch(item)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      >
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-50" style={{ color: settings.textColor }} />
                        <span className="text-sm flex-1 truncate" style={{ color: settings.textColor }}>
                          {item}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearchHistory(item);
                        }}
                        className="p-1 rounded transition-opacity opacity-50 hover:opacity-100"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Web Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium opacity-55" style={{ color: settings.textColor }}>
                  <Sparkles className="w-3 h-3" />
                  <span>Suggestions</span>
                </div>
                {suggestions.map((item, idx) => {
                  const navIdx = quickMatches.length + historyMatches.length + idx;
                  const isSelected = selectedIndex === navIdx;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSearch(item)}
                      onMouseEnter={() => setSelectedIndex(navIdx)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left"
                      style={{
                        backgroundColor: isSelected ? rgba(settings.textColor, 0.08) : 'transparent',
                      }}
                    >
                      <Search className="w-3.5 h-3.5 opacity-50 flex-shrink-0" style={{ color: settings.textColor }} />
                      <span className="text-sm flex-1 truncate" style={{ color: settings.textColor }}>
                        {item}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-40" style={{ color: settings.textColor }} />
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
