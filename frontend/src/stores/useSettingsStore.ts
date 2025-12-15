import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, ThemePreset } from '../types';

// Original theme presets from the old version
export const themePresets: ThemePreset[] = [
  { name: 'Blackboard', primary: '#1a1a1a', accent: '#5c5c5c', text: '#FFFDEA', isDark: true },
  { name: 'Gazette', primary: '#F2F7FF', accent: '#5c5c5c', text: '#000000', isDark: false },
  { name: 'Espresso', primary: '#21211F', accent: '#4E4E4E', text: '#D1B59A', isDark: true },
  { name: 'Cab', primary: '#F6D305', accent: '#424242', text: '#1F1F1F', isDark: false },
  { name: 'Cloud', primary: '#f1f2f0', accent: '#37bbe4', text: '#35342f', isDark: false },
  { name: 'Lime', primary: '#263238', accent: '#aeea00', text: '#AABBC3', isDark: true },
  { name: 'Tron', primary: '#242B33', accent: '#6EE2FF', text: '#EFFBFF', isDark: true },
  { name: 'Blues', primary: '#2B2C56', accent: '#6677EB', text: '#EFF1FC', isDark: true },
  { name: 'Passion', primary: '#f5f5f5', accent: '#8e24aa', text: '#12005e', isDark: false },
  { name: 'Chalk', primary: '#263238', accent: '#FF869A', text: '#AABBC3', isDark: true },
  { name: 'Paper', primary: '#F8F6F1', accent: '#AA9A73', text: '#4C432E', isDark: false },
];

const defaultSettings: Settings = {
  theme: 'light',
  primaryColor: '#F2F7FF',
  accentColor: '#5c5c5c',
  textColor: '#000000',
  backgroundColor: '#F2F7FF',
  showClock: true,
  showWeather: true,
  showGreeting: true,
  greetingName: '',
  showSearch: true,
  clockFormat: '24h',
  clockShowSeconds: true,
  weatherCity: 'Singapore',
  defaultSearchEngine: 'google',
  searchHistory: [],
  countdowns: [],
};

interface SettingsState {
  settings: Settings;
  isEditMode: boolean;
  setSettings: (settings: Partial<Settings>) => void;
  setThemePreset: (preset: ThemePreset) => void;
  toggleEditMode: () => void;
  addSearchHistory: (query: string) => void;
  removeSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  addCountdown: (countdown: { name: string; date: string; color?: string }) => void;
  removeCountdown: (id: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      isEditMode: false,

      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setThemePreset: (preset) =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: preset.isDark ? 'dark' : 'light',
            primaryColor: preset.primary,
            accentColor: preset.accent,
            textColor: preset.text,
            backgroundColor: preset.primary,
          },
        })),

      toggleEditMode: () =>
        set((state) => ({ isEditMode: !state.isEditMode })),

      addSearchHistory: (query) =>
        set((state) => {
          const history = [query, ...state.settings.searchHistory.filter((h) => h !== query)].slice(0, 20);
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
    }),
    {
      name: 'newtab-settings',
    }
  )
);
