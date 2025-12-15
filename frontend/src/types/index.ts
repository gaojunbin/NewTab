export interface App {
  id: string;
  name: string;
  url: string;
  icon: string;
  target?: string;
}

export interface AppGroup {
  id: string;
  category: string;
  icon: string;
  apps: App[];
  collapsed?: boolean;
}

export interface Link {
  id: string;
  name: string;
  url: string;
  target?: string;
}

export interface Bookmark {
  id: string;
  category: string;
  links: Link[];
  collapsed?: boolean;
}

export interface SearchProvider {
  id: string;
  name: string;
  url: string;
  prefix: string;
  searchUrl?: string;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  icon: string;
  feelsLike?: number;
}

export interface Countdown {
  id: string;
  name: string;
  date: string;
  color?: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  showClock: boolean;
  showWeather: boolean;
  showGreeting: boolean;
  greetingName: string;
  showSearch: boolean;
  clockFormat: '12h' | '24h';
  clockShowSeconds: boolean;
  weatherCity: string;
  defaultSearchEngine: string;
  searchHistory: string[];
  countdowns: Countdown[];
}

export type ThemePreset = {
  name: string;
  primary: string;
  accent: string;
  text: string;
  isDark: boolean;
}
