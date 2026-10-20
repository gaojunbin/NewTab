import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X, LayoutGrid, Rows3, ArrowUp } from 'lucide-react';
import { useSettingsStore, rgba, isColorDark, themePresets } from './stores/useSettingsStore';
import { useAppStore } from './stores/useAppStore';
import { geolocationApi } from './services/api';
import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import AppGrid from './components/AppGrid';
import BookmarkList from './components/BookmarkList';
import Weather from './components/Weather';
import Settings from './components/Settings';
import EditModeToggle from './components/EditModeToggle';
import CommandPalette from './components/CommandPalette';

type WorkspaceSectionFilter = 'all' | 'bookmarks' | string;

function App() {
  const { settings, setSettings, initializeFromLocation, locationInitialized } = useSettingsStore();
  const { appGroups, bookmarks, fetchApps, fetchBookmarks, fetchProviders } = useAppStore();
  const [filterQuery, setFilterQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<WorkspaceSectionFilter>('all');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  const dark = isColorDark(settings.backgroundColor);
  const isDashboard = settings.layoutMode === 'dashboard';

  useEffect(() => {
    fetchApps();
    fetchBookmarks();
    fetchProviders();
  }, [fetchApps, fetchBookmarks, fetchProviders]);

  // Initialize location from IP geolocation
  useEffect(() => {
    if (locationInitialized) return;

    geolocationApi
      .getLocation()
      .then((location) => {
        initializeFromLocation(location);
      })
      .catch((error) => {
        console.error('Failed to fetch geolocation:', error);
      });
  }, [locationInitialized, initializeFromLocation]);

  // Sync system dark/light preference when settings.theme === 'auto'
  useEffect(() => {
    if (settings.theme !== 'auto' || typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = (prefersDark: boolean) => {
      const currentDark = isColorDark(settings.backgroundColor);
      if (prefersDark !== currentDark) {
        const preset = prefersDark ? themePresets[1] : themePresets[0];
        setSettings({
          presetName: preset.name,
          primaryColor: preset.primary,
          backgroundColor: preset.primary,
          accentColor: preset.accent,
          textColor: preset.text,
        });
      }
    };

    applySystemTheme(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => applySystemTheme(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [settings.theme, settings.backgroundColor, setSettings]);

  // Sync CSS root variables for glass & surface utilities
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nt-bg', settings.backgroundColor);
    root.style.setProperty('--nt-text', settings.textColor);
    root.style.setProperty('--nt-accent', settings.accentColor);
    root.style.setProperty(
      '--nt-surface',
      dark ? rgba('#ffffff', 0.04) : rgba('#ffffff', 0.65)
    );
    root.style.setProperty(
      '--nt-surface-hover',
      dark ? rgba('#ffffff', 0.075) : rgba('#ffffff', 0.92)
    );
    root.style.setProperty(
      '--nt-surface-elevated',
      dark ? rgba('#18181b', 0.92) : rgba('#ffffff', 0.94)
    );
    root.style.setProperty('--nt-border', rgba(settings.textColor, 0.08));
    root.style.setProperty('--nt-border-hover', rgba(settings.textColor, 0.16));
  }, [settings.backgroundColor, settings.textColor, settings.accentColor, dark]);

  // Global Cmd+K / Ctrl+K shortcut for Command Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Track scroll position to show/hide Back to Top button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowBackToTop(container.scrollTop > window.innerHeight * 0.45);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter apps and bookmarks based on query and active category tab
  const filteredAppGroups = useMemo(() => {
    if (activeCategory === 'bookmarks') return [];
    const baseGroups =
      activeCategory === 'all'
        ? appGroups
        : appGroups.filter((g) => g.id === activeCategory);

    if (!filterQuery.trim()) return baseGroups;
    const query = filterQuery.toLowerCase();
    return baseGroups
      .map((group) => ({
        ...group,
        apps: group.apps.filter(
          (app) =>
            app.name.toLowerCase().includes(query) ||
            app.url.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.apps.length > 0);
  }, [appGroups, filterQuery, activeCategory]);

  const filteredBookmarks = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'bookmarks') return [];
    if (!filterQuery.trim()) return bookmarks;
    const query = filterQuery.toLowerCase();
    return bookmarks
      .map((category) => ({
        ...category,
        links: category.links.filter(
          (link) =>
            link.name.toLowerCase().includes(query) ||
            link.url.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.links.length > 0);
  }, [bookmarks, filterQuery, activeCategory]);

  const scrollToContent = useCallback(() => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Handle /f filter command from SearchBar
  const handleFilterModeChange = useCallback(
    (active: boolean, query: string) => {
      if (active) {
        setFilterQuery(query);
        setActiveCategory('all');
        setTimeout(() => {
          contentRef.current?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => filterInputRef.current?.focus(), 320);
        }, 60);
      }
    },
    []
  );

  const totalMatchingApps = useMemo(
    () => filteredAppGroups.reduce((acc, g) => acc + g.apps.length, 0),
    [filteredAppGroups]
  );

  const totalMatchingBookmarks = useMemo(
    () => filteredBookmarks.reduce((acc, b) => acc + b.links.length, 0),
    [filteredBookmarks]
  );

  const categoryTabs = useMemo(() => {
    const tabs: { id: WorkspaceSectionFilter; label: string; count: number }[] = [
      {
        id: 'all',
        label: '全部',
        count:
          appGroups.reduce((acc, g) => acc + g.apps.length, 0) +
          bookmarks.reduce((acc, b) => acc + b.links.length, 0),
      },
      ...appGroups.map((g) => ({
        id: g.id,
        label: g.category,
        count: g.apps.length,
      })),
    ];
    if (bookmarks.length > 0) {
      tabs.push({
        id: 'bookmarks',
        label: '书签收藏',
        count: bookmarks.reduce((acc, b) => acc + b.links.length, 0),
      });
    }
    return tabs;
  }, [appGroups, bookmarks]);

  const currentYear = new Date().getFullYear();

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-screen overflow-y-auto scroll-smooth relative transition-colors duration-500"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      {/* Subtle Ambient Background Luminescence (Apple/OpenAI Atmospheric Touch) */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div
          className="absolute -top-[28%] left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full blur-[130px] transition-opacity duration-700"
          style={{
            background: dark
              ? `radial-gradient(circle, ${rgba(settings.textColor, 0.055)} 0%, transparent 70%)`
              : `radial-gradient(circle, ${rgba(settings.accentColor, 0.08)} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* HERO SECTION */}
      <section
        className={
          isDashboard
            ? 'relative z-10 pt-8 sm:pt-12 pb-4 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center'
            : 'relative z-10 min-h-screen h-screen flex flex-col justify-between px-4 sm:px-6'
        }
      >
        {!isDashboard && <div className="h-8" />}

        {/* Center Hero Content */}
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          {/* Clock & Greeting */}
          {(settings.showGreeting || settings.showClock) && (
            <div className={isDashboard ? 'mb-4' : 'mb-6 sm:mb-7'}>
              <Clock compact={isDashboard} />
            </div>
          )}

          {/* Weather Pill */}
          {settings.showWeather && (
            <div className={isDashboard ? 'mb-5' : 'mb-8 sm:mb-9'}>
              <Weather />
            </div>
          )}

          {/* Search Bar */}
          {settings.showSearch && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <SearchBar
                onFilterChange={setFilterQuery}
                onFilterModeChange={handleFilterModeChange}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
              />
            </motion.div>
          )}
        </div>

        {/* Bottom Scroll Indicator (Immersive Mode Only) */}
        {!isDashboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="pb-8 sm:pb-10 flex flex-col items-center"
          >
            <button
              type="button"
              onClick={scrollToContent}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:opacity-90"
              style={{
                background: rgba(settings.textColor, 0.035),
                border: `1px solid ${rgba(settings.textColor, 0.07)}`,
                color: settings.textColor,
              }}
            >
              <span className="opacity-65 group-hover:opacity-100 transition-opacity">
                Workspace
              </span>
              <motion.span
                animate={{ y: [0, 2.5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="opacity-60 group-hover:opacity-100"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
          </motion.div>
        )}
      </section>

      {/* WORKSPACE SECTION - Apps & Bookmarks */}
      <section
        ref={contentRef}
        className={`relative z-10 px-4 sm:px-6 ${
          isDashboard ? 'pt-4 pb-16' : 'min-h-screen py-8 sm:py-12'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          {/* Sticky Workspace Control Bar: Category Pills + Inline Filter + Density Switch */}
          <div
            className="sticky top-3 z-30 mb-8 p-2 rounded-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-all"
            style={{
              background: dark ? rgba('#141416', 0.82) : rgba('#ffffff', 0.82),
              border: `1px solid ${rgba(settings.textColor, 0.09)}`,
              boxShadow: `0 8px 28px -8px ${rgba('#000000', dark ? 0.45 : 0.06)}`,
            }}
          >
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className="relative px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5"
                    style={{
                      color: isActive ? settings.backgroundColor : settings.textColor,
                      opacity: isActive ? 1 : 0.65,
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="workspaceCategoryPill"
                        transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                        className="absolute inset-0 rounded-xl"
                        style={{ background: settings.textColor }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                    <span
                      className="relative z-10 text-[10px] tabular-nums opacity-70"
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Controls: Filter Input & Density Switch */}
            <div className="flex items-center gap-2">
              <div
                className="flex-1 sm:w-56 flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors"
                style={{
                  background: rgba(settings.textColor, 0.045),
                  border: `1px solid ${rgba(settings.textColor, filterQuery ? 0.18 : 0.07)}`,
                }}
              >
                <Search className="w-3.5 h-3.5 opacity-50 flex-shrink-0" style={{ color: settings.textColor }} />
                <input
                  ref={filterInputRef}
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setFilterQuery('');
                      filterInputRef.current?.blur();
                    }
                  }}
                  className="flex-1 bg-transparent text-xs focus:outline-none placeholder:opacity-45 min-w-0"
                  style={{ color: settings.textColor }}
                  placeholder="快速过滤应用或书签..."
                />
                {filterQuery && (
                  <>
                    <span
                      className="text-[10px] font-mono tabular-nums opacity-60 flex-shrink-0"
                      style={{ color: settings.textColor }}
                    >
                      {totalMatchingApps + totalMatchingBookmarks}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterQuery('')}
                      className="p-0.5 rounded hover:opacity-100 opacity-60"
                    >
                      <X className="w-3 h-3" style={{ color: settings.textColor }} />
                    </button>
                  </>
                )}
              </div>

              {/* Card Density Quick Switch */}
              <button
                type="button"
                onClick={() =>
                  setSettings({
                    cardDensity:
                      settings.cardDensity === 'compact' ? 'comfortable' : 'compact',
                  })
                }
                className="p-2 rounded-xl transition-opacity opacity-65 hover:opacity-100 flex-shrink-0"
                style={{
                  background: rgba(settings.textColor, 0.045),
                  border: `1px solid ${rgba(settings.textColor, 0.07)}`,
                  color: settings.textColor,
                }}
                title={
                  settings.cardDensity === 'compact'
                    ? '切换为舒适网格视图'
                    : '切换为紧凑胶囊视图'
                }
              >
                {settings.cardDensity === 'compact' ? (
                  <LayoutGrid className="w-3.5 h-3.5" />
                ) : (
                  <Rows3 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Empty Filter State */}
          {totalMatchingApps === 0 && totalMatchingBookmarks === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center rounded-3xl"
              style={{
                background: rgba(settings.textColor, 0.025),
                border: `1px dashed ${rgba(settings.textColor, 0.1)}`,
              }}
            >
              <p className="text-sm font-medium opacity-70" style={{ color: settings.textColor }}>
                未找到匹配「{filterQuery}」的应用或书签
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterQuery('');
                  setActiveCategory('all');
                }}
                className="mt-3 px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity opacity-80 hover:opacity-100"
                style={{
                  background: rgba(settings.textColor, 0.08),
                  color: settings.textColor,
                }}
              >
                清除过滤条件
              </button>
            </motion.div>
          )}

          {/* Applications Section */}
          {filteredAppGroups.length > 0 && (
            <div className="mb-12">
              <AppGrid appGroups={filteredAppGroups} />
            </div>
          )}

          {/* Bookmarks Section */}
          {filteredBookmarks.length > 0 && (
            <div className="mb-12">
              {activeCategory === 'all' && (
                <div className="flex items-center gap-2.5 mb-4">
                  <h3
                    className="text-sm sm:text-base font-semibold tracking-tight"
                    style={{ color: settings.textColor }}
                  >
                    书签收藏
                  </h3>
                  <span
                    className="text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-full opacity-55"
                    style={{
                      background: rgba(settings.textColor, 0.05),
                      color: settings.textColor,
                    }}
                  >
                    {totalMatchingBookmarks}
                  </span>
                </div>
              )}
              <BookmarkList bookmarks={filteredBookmarks} />
            </div>
          )}

          {/* Minimalist Footer */}
          <footer className="text-center pt-6 pb-8">
            <p className="text-xs opacity-45" style={{ color: settings.textColor }}>
              © {currentYear}{' '}
              <a
                href="https://github.com/gaojunbin/NewTab"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:opacity-100 transition-opacity underline underline-offset-4"
                style={{ color: settings.textColor }}
              >
                NewTab
              </a>{' '}
              · Crafted for focus & clarity
            </p>
          </footer>
        </div>
      </section>

      {/* Back to Top Floating Button (when scrolled down) */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-40 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-2xl transition-transform hover:scale-105 active:scale-95"
            style={{
              background: dark ? rgba('#18181b', 0.78) : rgba('#ffffff', 0.82),
              border: `1px solid ${rgba(settings.textColor, 0.11)}`,
              boxShadow: `0 8px 24px -6px ${rgba('#000000', dark ? 0.45 : 0.12)}`,
              color: settings.textColor,
            }}
            title="回到顶部"
          >
            <ArrowUp className="w-4 h-4 opacity-80" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenSettings={() => window.dispatchEvent(new CustomEvent('openSettings'))}
        onRequestEditMode={() => window.dispatchEvent(new CustomEvent('requestEditMode'))}
      />

      {/* Floating Dock & Settings Modal */}
      <EditModeToggle onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
      <Settings />
    </div>
  );
}

export default App;
