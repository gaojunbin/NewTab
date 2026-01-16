import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Search, X } from 'lucide-react';
import { useSettingsStore } from './stores/useSettingsStore';
import { useAppStore } from './stores/useAppStore';
import { geolocationApi } from './services/api';
import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import AppGrid from './components/AppGrid';
import BookmarkList from './components/BookmarkList';
import Weather from './components/Weather';
import Settings from './components/Settings';
import EditModeToggle from './components/EditModeToggle';

function App() {
  const { settings, initializeFromLocation, locationInitialized } = useSettingsStore();
  const { appGroups, bookmarks, fetchApps, fetchBookmarks, fetchProviders } = useAppStore();
  const [filterQuery, setFilterQuery] = useState('');
  const [isFilterMode, setIsFilterMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchApps();
    fetchBookmarks();
    fetchProviders();
  }, [fetchApps, fetchBookmarks, fetchProviders]);

  // Initialize location from IP geolocation
  useEffect(() => {
    if (locationInitialized) return;

    geolocationApi.getLocation()
      .then(location => {
        initializeFromLocation(location);
      })
      .catch(error => {
        console.error('Failed to fetch geolocation:', error);
      });
  }, [locationInitialized, initializeFromLocation]);

  // Filter apps and bookmarks based on query
  const filteredAppGroups = useMemo(() => {
    if (!filterQuery.trim()) return appGroups;
    const query = filterQuery.toLowerCase();
    return appGroups.map(group => ({
      ...group,
      apps: group.apps.filter(app =>
        app.name.toLowerCase().includes(query) ||
        app.url.toLowerCase().includes(query)
      )
    })).filter(group => group.apps.length > 0);
  }, [appGroups, filterQuery]);

  const filteredBookmarks = useMemo(() => {
    if (!filterQuery.trim()) return bookmarks;
    const query = filterQuery.toLowerCase();
    return bookmarks.map(category => ({
      ...category,
      links: category.links.filter(link =>
        link.name.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query)
      )
    })).filter(category => category.links.length > 0);
  }, [bookmarks, filterQuery]);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle filter mode change from SearchBar
  const handleFilterModeChange = useCallback((active: boolean, query: string) => {
    setIsFilterMode(active);
    setFilterQuery(query);
    if (active) {
      // Scroll to content section when entering filter mode
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ behavior: 'smooth' });
        // Focus the filter input after scroll
        setTimeout(() => filterInputRef.current?.focus(), 300);
      }, 100);
    }
  }, []);

  // Handle filter query change (for mini search bar)
  const handleFilterQueryChange = (query: string) => {
    setFilterQuery(query);
  };

  // Exit filter mode
  const exitFilterMode = () => {
    setIsFilterMode(false);
    setFilterQuery('');
  };

  // Track if user was on first page (to detect scroll transition)
  const wasOnFirstPageRef = useRef(true);

  // Auto-activate filter mode when scrolling from first page to content section
  useEffect(() => {
    const container = document.querySelector('.snap-y');
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = window.innerHeight;
      const isOnFirstPage = scrollTop < viewportHeight * 0.5;

      // Detect transition from first page to second page
      if (wasOnFirstPageRef.current && !isOnFirstPage) {
        // User just scrolled from first page to second page
        setIsFilterMode(true);
        setTimeout(() => filterInputRef.current?.focus(), 100);
      }

      wasOnFirstPageRef.current = isOnFirstPage;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="w-full h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      {/* Hero Section - Full Screen */}
      <section className="min-h-screen h-screen flex flex-col relative snap-start snap-always">
        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
          {/* Greeting */}
          {settings.showGreeting && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <Clock />
            </motion.div>
          )}

          {/* Weather */}
          {settings.showWeather && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-10"
            >
              <Weather />
            </motion.div>
          )}

          {/* Search Bar */}
          {settings.showSearch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-2xl"
            >
              <SearchBar
                onFilterChange={setFilterQuery}
                onFilterModeChange={handleFilterModeChange}
              />
            </motion.div>
          )}
        </div>

        {/* Bottom Area - Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pb-10 flex flex-col items-center"
        >
          <button
            onClick={scrollToContent}
            className="flex flex-col items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: settings.accentColor + '80' }}
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </button>
        </motion.div>
      </section>

      {/* Content Section - Apps & Bookmarks */}
      <section
        ref={contentRef}
        className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 snap-start"
      >
        <div className="max-w-5xl mx-auto">
          {/* Mini Filter Search Bar */}
          {isFilterMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex justify-center"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl max-w-md w-full"
                style={{
                  background: `${settings.accentColor}10`,
                  border: `1px solid ${settings.accentColor}30`,
                }}
              >
                <Search className="w-4 h-4" style={{ color: settings.accentColor }} />
                <input
                  ref={filterInputRef}
                  type="text"
                  value={filterQuery}
                  onChange={(e) => handleFilterQueryChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && exitFilterMode()}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  style={{ color: settings.textColor }}
                  placeholder="Filter apps and bookmarks..."
                  autoFocus
                />
                <span className="text-xs" style={{ color: settings.accentColor }}>
                  {filteredAppGroups.reduce((acc, g) => acc + g.apps.length, 0)} + {filteredBookmarks.reduce((acc, b) => acc + b.links.length, 0)}
                </span>
                <button
                  onClick={exitFilterMode}
                  className="p-1 rounded hover:opacity-70"
                >
                  <X className="w-4 h-4" style={{ color: settings.accentColor }} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Applications Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <AppGrid appGroups={filteredAppGroups} />
          </motion.section>

          {/* Bookmarks Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-16"
          >
            <BookmarkList bookmarks={filteredBookmarks} />
          </motion.section>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center py-8"
          >
            <p className="text-sm" style={{ color: settings.accentColor + '60' }}>
              © 2025{' '}
              <a
                href="https://github.com/gaojunbin/NewTab"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
                style={{ color: settings.accentColor }}
              >
                NewTab
              </a>
              {' '}· All rights reserved
            </p>
          </motion.footer>
        </div>
      </section>

      {/* Edit Mode Toggle & Settings */}
      <EditModeToggle />
      <Settings />
    </div>
  );
}

export default App;
