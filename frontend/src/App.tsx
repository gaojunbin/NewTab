import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from './stores/useSettingsStore';
import { useAppStore } from './stores/useAppStore';
import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import AppGrid from './components/AppGrid';
import BookmarkList from './components/BookmarkList';
import Weather from './components/Weather';
import Settings from './components/Settings';
import EditModeToggle from './components/EditModeToggle';

function App() {
  const { settings } = useSettingsStore();
  const { appGroups, bookmarks, fetchApps, fetchBookmarks, fetchProviders } = useAppStore();
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    fetchApps();
    fetchBookmarks();
    fetchProviders();
  }, [fetchApps, fetchBookmarks, fetchProviders]);

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

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Search Section */}
        {settings.showSearch && (
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <SearchBar onFilterChange={setFilterQuery} />
          </motion.section>
        )}

        {/* Header Section - Time, Greeting centered */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          {settings.showClock && <Clock />}
        </motion.section>

        {/* Weather */}
        {settings.showWeather && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center mb-12"
          >
            <Weather />
          </motion.section>
        )}

        {/* Filter indicator */}
        {filterQuery && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{
                background: `${settings.accentColor}15`,
                border: `1px solid ${settings.accentColor}30`,
                color: settings.accentColor,
              }}
            >
              Filtering: "{filterQuery}"
              <span style={{ color: settings.textColor }}>
                {filteredAppGroups.reduce((acc, g) => acc + g.apps.length, 0)} apps,{' '}
                {filteredBookmarks.reduce((acc, b) => acc + b.links.length, 0)} bookmarks
              </span>
            </span>
          </motion.div>
        )}

        {/* Applications Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <AppGrid appGroups={filteredAppGroups} />
        </motion.section>

        {/* Bookmarks Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <BookmarkList bookmarks={filteredBookmarks} />
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center py-8"
        >
          <p className="text-sm" style={{ color: settings.accentColor + '80' }}>
            <a
              href="https://github.com/gaojunbin/NewTab"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              style={{ color: settings.accentColor }}
            >
              NewTab
            </a>
            {' '}· Built with React · © 2024
          </p>
        </motion.footer>
      </main>

      {/* Edit Mode Toggle & Settings */}
      <EditModeToggle />
      <Settings />
    </div>
  );
}

export default App;
