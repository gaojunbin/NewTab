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

  // CSS variables based on settings
  const cssVars = {
    '--color-background': settings.backgroundColor,
    '--color-text-pri': settings.textColor,
    '--color-text-acc': settings.accentColor,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen w-full"
      style={{
        ...cssVars,
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      {/* Main Container - matching original layout */}
      <main className="max-w-[60%] mx-auto px-4 py-8 min-w-[800px]">

        {/* Search Section - at top like original */}
        {settings.showSearch && (
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <SearchBar onFilterChange={setFilterQuery} />
          </motion.section>
        )}

        {/* Header Section - Time, Greeting centered */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-6"
        >
          {settings.showClock && <Clock />}
        </motion.section>

        {/* Weather - below clock, smaller */}
        {settings.showWeather && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center mb-8"
          >
            <Weather />
          </motion.section>
        )}

        {/* Filter indicator */}
        {filterQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-center"
            style={{ color: settings.accentColor }}
          >
            Filtering: "{filterQuery}" - Found {filteredAppGroups.reduce((acc, g) => acc + g.apps.length, 0)} apps, {filteredBookmarks.reduce((acc, b) => acc + b.links.length, 0)} bookmarks
          </motion.div>
        )}

        {/* Applications Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-10"
        >
          <h3
            className="text-lg font-light mb-6 pb-2 border-b"
            style={{
              color: settings.textColor,
              borderColor: `${settings.accentColor}40`
            }}
          >
            Applications
          </h3>
          <AppGrid appGroups={filteredAppGroups} />
        </motion.section>

        {/* Bookmarks Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-10"
        >
          <h3
            className="text-lg font-light mb-6 pb-2 border-b"
            style={{
              color: settings.textColor,
              borderColor: `${settings.accentColor}40`
            }}
          >
            Bookmarks
          </h3>
          <BookmarkList bookmarks={filteredBookmarks} />
        </motion.section>

        {/* Footer */}
        <footer
          className="text-center py-6 text-sm"
          style={{ color: settings.accentColor }}
        >
          <p>
            Click <a
              href="https://github.com/gaojunbin/NewTab"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: settings.accentColor }}
            >here</a> to see more details on GitHub project page.
          </p>
          <p className="mt-1">CopyRight © 2024 Junbin Gao All Rights Reserved.</p>
        </footer>
      </main>

      {/* Edit Mode Toggle & Settings */}
      <EditModeToggle />
      <Settings />
    </div>
  );
}

export default App;
