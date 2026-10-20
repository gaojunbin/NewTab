import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, ThemePreset, GeoLocation, ToastItem } from '../types';

export const themePresets: ThemePreset[] = [
  // Flagship Apple & OpenAI inspired minimalist presets
  { name: 'OpenAI Ivory', primary: '#FAF9F5', accent: '#6B6A65', text: '#141413', isDark: false, badge: 'New' },
  { name: 'OpenAI Carbon', primary: '#0D0D0D', accent: '#8E8E93', text: '#F5F5F3', isDark: true, badge: 'New' },
  { name: 'Apple Daylight', primary: '#F5F5F7', accent: '#6E6E73', text: '#1D1D1F', isDark: false, badge: 'New' },
  { name: 'Apple Midnight', primary: '#09090B', accent: '#86868B', text: '#F5F5F7', isDark: true, badge: 'New' },
  // Classic SUI presets
  { name: 'Gazette', primary: '#F2F7FF', accent: '#5c5c5c', text: '#111827', isDark: false },
  { name: 'Blackboard', primary: '#141416', accent: '#7c7c84', text: '#FFFDEA', isDark: true },
  { name: 'Paper', primary: '#F8F6F1', accent: '#8C7D5B', text: '#383122', isDark: false },
  { name: 'Espresso', primary: '#1E1D1B', accent: '#8A7968', text: '#E6CCB2', isDark: true },
  { name: 'Cloud', primary: '#F1F4F6', accent: '#0284C7', text: '#1E293B', isDark: false },
  { name: 'Tron', primary: '#131920', accent: '#38BDF8', text: '#EFFBFF', isDark: true },
  { name: 'Blues', primary: '#1E1F3B', accent: '#818CF8', text: '#EFF1FC', isDark: true },
  { name: 'Chalk', primary: '#1F2933', accent: '#FB7185', text: '#E4E7EB', isDark: true },
  { name: 'Lime', primary: '#1C2529', accent: '#A3E635', text: '#D1DCE2', isDark: true },
  { name: 'Passion', primary: '#F7F5FA', accent: '#9333EA', text: '#1E1035', isDark: false },
  { name: 'Cab', primary: '#F6D305', accent: '#424242', text: '#1F1F1F', isDark: false },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return {
    r: isNaN(r) ? 245 : r,
    g: isNaN(g) ? 245 : g,
    b: isNaN(b) ? 247 : b,
  };
}

export function isColorDark(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const defaultSettings: Settings = {
  theme: 'light',
  presetName: 'OpenAI Ivory',
  primaryColor: '#FAF9F5',
  accentColor: '#6B6A65',
  textColor: '#141413',
  backgroundColor: '#FAF9F5',
  layoutMode: 'immersive',
  cardDensity: 'comfortable',
  showAppUrl: true,
  showBookmarkFavicons: true,
  showClock: true,
  showWeather: true,
  showGreeting: true,
  greetingName: '',
  showSearch: true,
  clockFormat: '24h',
  clockShowSeconds: true,
  showMultiTimezone: false,
  weatherCity: 'Singapore',
  defaultSearchEngine: 'google',
  searchHistory: [],
  countdowns: [],
};

interface SettingsState {
  settings: Settings;
  isEditMode: boolean;
  detectedLocation: GeoLocation | null;
  locationInitialized: boolean;
  toasts: ToastItem[];
  setSettings: (settings: Partial<Settings>) => void;
  setThemePreset: (preset: ThemePreset) => void;
  toggleEditMode: () => void;
  setEditMode: (value: boolean) => void;
  addSearchHistory: (query: string) => void;
  removeSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  addCountdown: (countdown: { name: string; date: string; color?: string }) => void;
  removeCountdown: (id: string) => void;
  resetSettings: () => void;
  initializeFromLocation: (location: GeoLocation) => void;
  notify: (message: string, type?: ToastItem['type']) => void;
  dismissToast: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isEditMode: false,
      detectedLocation: null,
      locationInitialized: false,
      toasts: [],

      setSettings: (newSettings) =>
        set((state) => {
          const updates: Partial<Settings> = { ...newSettings };

          if ('weatherCity' in newSettings && newSettings.weatherCity !== state.settings.weatherCity) {
            updates.weatherCityManuallySet = true;
          }

          // When switching theme mode (light / dark / auto), ensure palette matches target luminance
          if ('theme' in newSettings && newSettings.theme) {
            const systemDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
            const targetIsDark =
              newSettings.theme === 'dark' || (newSettings.theme === 'auto' && systemDark);
            const currentBgIsDark = isColorDark(updates.backgroundColor || state.settings.backgroundColor);

            if (targetIsDark !== currentBgIsDark && !('backgroundColor' in newSettings)) {
              const targetPreset = targetIsDark
                ? themePresets.find((p) => p.name === 'OpenAI Carbon') || themePresets[1]
                : themePresets.find((p) => p.name === 'OpenAI Ivory') || themePresets[0];

              updates.presetName = targetPreset.name;
              updates.primaryColor = targetPreset.primary;
              updates.backgroundColor = targetPreset.primary;
              updates.accentColor = targetPreset.accent;
              updates.textColor = targetPreset.text;
            }
          }

          return {
            settings: { ...state.settings, ...updates },
          };
        }),

      setThemePreset: (preset) =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: preset.isDark ? 'dark' : 'light',
            presetName: preset.name,
            primaryColor: preset.primary,
            accentColor: preset.accent,
            textColor: preset.text,
            backgroundColor: preset.primary,
          },
        })),

      toggleEditMode: () =>
        set((state) => ({ isEditMode: !state.isEditMode })),

      setEditMode: (value) =>
        set({ isEditMode: value }),

      addSearchHistory: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) return state;
          const history = [trimmed, ...state.settings.searchHistory.filter((h) => h !== trimmed)].slice(0, 20);
          return { settings: { ...state.settings, searchHistory: history } };
        }),

      removeSearchHistory: (query) =>
        set((state) => ({
          settings: {
            ...state.settings,
            searchHistory: state.settings.searchHistory.filter((h) => h !== query),
          },
        })),

      clearSearchHistory: () =>
        set((state) => ({ settings: { ...state.settings, searchHistory: [] } })),

      addCountdown: (countdown) =>
        set((state) => ({
          settings: {
            ...state.settings,
            countdowns: [
              ...state.settings.countdowns,
              { ...countdown, id: Date.now().toString() },
            ],
          },
        })),

      removeCountdown: (id) =>
        set((state) => ({
          settings: {
            ...state.settings,
            countdowns: state.settings.countdowns.filter((c) => c.id !== id),
          },
        })),

      resetSettings: () => set({ settings: defaultSettings }),

      initializeFromLocation: (location) =>
        set((state) => {
          const updates: Partial<SettingsState> = {
            detectedLocation: location,
            locationInitialized: true,
          };

          if (!state.settings.weatherCityManuallySet) {
            updates.settings = {
              ...state.settings,
              weatherCity: location.city,
            };
          }

          return updates;
        }),

      notify: (message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toasts: [...state.toasts.slice(-2), { id, message, type }],
        }));
        setTimeout(() => {
          get().dismissToast(id);
        }, 2800);
      },

      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'newtab-settings',
      partialize: (state) => ({
        settings: state.settings,
      }),
      merge: (persistedState: any, currentState) => {
        const persistedSettings = persistedState?.settings || {};
        return {
          ...currentState,
          settings: {
            ...defaultSettings,
            ...persistedSettings,
          },
        };
      },
    }
  )
);
