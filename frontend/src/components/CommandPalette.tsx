import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import {
  Search,
  ArrowUpRight,
  Bookmark as BookmarkIcon,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LayoutGrid,
  Pencil,
  Globe,
  CornerDownLeft,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore, rgba, isColorDark, themePresets } from '../stores/useSettingsStore';
import { normalizeUrl, extractDomain } from '../services/api';
import { searchEngines } from './SearchBar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onRequestEditMode: () => void;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ReactNode;
  section: 'Apps' | 'Bookmarks' | 'Actions' | 'Web Search';
  onSelect: () => void;
}

function CommandPalette({
  isOpen,
  onClose,
  onOpenSettings,
  onRequestEditMode,
}: CommandPaletteProps) {
  const { appGroups, bookmarks } = useAppStore();
  const { settings, setSettings, setThemePreset, isEditMode } = useSettingsStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const dark = isColorDark(settings.backgroundColor);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: PaletteItem[] = [];

    // 1. Matching Apps
    for (const group of appGroups) {
      for (const app of group.apps) {
        if (
          !q ||
          app.name.toLowerCase().includes(q) ||
          app.url.toLowerCase().includes(q) ||
          group.category.toLowerCase().includes(q)
        ) {
          list.push({
            id: `app-${app.id}`,
            title: app.name,
            subtitle: extractDomain(app.url),
            badge: group.category,
            section: 'Apps',
            icon: (
              <Icon
                icon={app.icon?.includes(':') ? app.icon : `mdi:${app.icon || 'web'}`}
                className="w-4 h-4"
                style={{ color: settings.textColor }}
              />
            ),
            onSelect: () => {
              window.open(normalizeUrl(app.url), '_blank');
              onClose();
            },
          });
        }
      }
    }

    // 2. Matching Bookmarks
    for (const cat of bookmarks) {
      for (const link of cat.links) {
        if (
          !q ||
          link.name.toLowerCase().includes(q) ||
          link.url.toLowerCase().includes(q) ||
          cat.category.toLowerCase().includes(q)
        ) {
          list.push({
            id: `bm-${link.id}`,
            title: link.name,
            subtitle: extractDomain(link.url),
            badge: cat.category,
            section: 'Bookmarks',
            icon: <BookmarkIcon className="w-3.5 h-3.5 opacity-75" style={{ color: settings.textColor }} />,
            onSelect: () => {
              window.open(normalizeUrl(link.url), '_blank');
              onClose();
            },
          });
        }
      }
    }

    // Limit apps + bookmarks when query is empty so Actions are easily reachable
    const filteredList = q ? list.slice(0, 14) : list.slice(0, 8);

    // 3. Quick Actions
    const actions: PaletteItem[] = [
      {
        id: 'action-theme',
        title: dark ? 'Switch to Light Theme (OpenAI Ivory)' : 'Switch to Dark Theme (OpenAI Carbon)',
        subtitle: 'Appearance',
        section: 'Actions',
        icon: dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        onSelect: () => {
          const target = dark ? themePresets[0] : themePresets[1];
          setThemePreset(target);
          onClose();
        },
      },
      {
        id: 'action-layout',
        title:
          settings.layoutMode === 'dashboard'
            ? 'Switch to Immersive View (双屏沉浸)'
            : 'Switch to Dashboard View (单屏高效)',
        subtitle: 'Layout Mode',
        section: 'Actions',
        icon: <LayoutGrid className="w-4 h-4" />,
        onSelect: () => {
          setSettings({
            layoutMode: settings.layoutMode === 'dashboard' ? 'immersive' : 'dashboard',
          });
          onClose();
        },
      },
      {
        id: 'action-edit',
        title: isEditMode ? 'Exit Edit Mode (退出编辑)' : 'Enter Edit Mode (编辑应用与书签)',
        subtitle: 'Workspace',
        section: 'Actions',
        icon: <Pencil className="w-4 h-4" />,
        onSelect: () => {
          onClose();
          onRequestEditMode();
        },
      },
      {
        id: 'action-settings',
        title: 'Open Settings (打开偏好设置)',
        subtitle: 'Preferences & Backup',
        section: 'Actions',
        icon: <SettingsIcon className="w-4 h-4" />,
        onSelect: () => {
          onClose();
          onOpenSettings();
        },
      },
    ];

    for (const act of actions) {
      if (
        !q ||
        act.title.toLowerCase().includes(q) ||
        (act.subtitle && act.subtitle.toLowerCase().includes(q))
      ) {
        filteredList.push(act);
      }
    }

    // 4. Web Search fallback when query is non-empty
    if (q) {
      const engine =
        searchEngines.find((e) => e.id === settings.defaultSearchEngine) || searchEngines[0];
      filteredList.push({
        id: 'web-search',
        title: `Search "${query.trim()}" with ${engine.name}`,
        subtitle: engine.home,
        section: 'Web Search',
        icon: <Globe className="w-4 h-4" />,
        onSelect: () => {
          window.open(engine.url + encodeURIComponent(query.trim()), '_blank');
          onClose();
        },
      });
    }

    return filteredList;
  }, [
    query,
    appGroups,
    bookmarks,
    dark,
    settings.textColor,
    settings.layoutMode,
    settings.defaultSearchEngine,
    isEditMode,
    setThemePreset,
    setSettings,
    onClose,
    onOpenSettings,
    onRequestEditMode,
  ]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          items.length > 0 ? (prev - 1 + items.length) % items.length : 0
        );
      } else if (e.key === 'Enter' && items[selectedIndex]) {
        e.preventDefault();
        items[selectedIndex].onSelect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-start justify-center pt-[12vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 34 }}
            className="w-full max-w-xl rounded-2xl overflow-hidden backdrop-blur-2xl"
            style={{
              background: dark ? rgba('#161618', 0.94) : rgba('#ffffff', 0.96),
              border: `1px solid ${rgba(settings.textColor, 0.14)}`,
              boxShadow: `0 24px 64px -12px ${rgba('#000000', dark ? 0.7 : 0.22)}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: `1px solid ${rgba(settings.textColor, 0.08)}` }}
            >
              <Search className="w-4 h-4 opacity-55 flex-shrink-0" style={{ color: settings.textColor }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps, bookmarks, or commands..."
                className="flex-1 bg-transparent text-sm sm:text-base focus:outline-none placeholder:opacity-45"
                style={{ color: settings.textColor }}
              />
              <span
                className="text-[11px] font-mono px-1.5 py-0.5 rounded opacity-50"
                style={{
                  background: rgba(settings.textColor, 0.06),
                  color: settings.textColor,
                }}
              >
                ESC
              </span>
            </div>

            {/* Results List */}
            <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2 space-y-0.5">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm opacity-50" style={{ color: settings.textColor }}>
                  No matching items found
                </div>
              ) : (
                items.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const showSectionHeader =
                    idx === 0 || items[idx - 1].section !== item.section;

                  return (
                    <div key={item.id}>
                      {showSectionHeader && (
                        <div
                          className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider opacity-45"
                          style={{ color: settings.textColor }}
                        >
                          {item.section}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={item.onSelect}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-100"
                        style={{
                          background: isSelected ? rgba(settings.textColor, 0.08) : 'transparent',
                          color: settings.textColor,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: rgba(settings.textColor, 0.06) }}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded opacity-60 flex-shrink-0"
                                style={{ background: rgba(settings.textColor, 0.06) }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <p className="text-[11px] truncate opacity-45">{item.subtitle}</p>
                          )}
                        </div>
                        {isSelected ? (
                          <CornerDownLeft className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-25 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Hints */}
            <div
              className="flex items-center justify-between px-4 py-2 text-[11px] opacity-55"
              style={{
                borderTop: `1px solid ${rgba(settings.textColor, 0.07)}`,
                background: rgba(settings.textColor, 0.02),
                color: settings.textColor,
              }}
            >
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
              </div>
              <span>⌘K Spotlight</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
