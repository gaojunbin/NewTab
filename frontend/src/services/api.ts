const API_BASE = '/api';

// Token management
const AUTH_TOKEN_KEY = 'newtab-auth-token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export interface WeatherResponse {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  icon: string;
  feelsLike: number;
}

export interface SearchSuggestion {
  query: string;
  type: 'history' | 'suggestion';
}

export const weatherApi = {
  async getWeather(city: string): Promise<WeatherResponse> {
    const res = await fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('Failed to fetch weather');
    return res.json();
  },
};

export const searchApi = {
  async getSuggestions(query: string, engine: string = 'google'): Promise<string[]> {
    const res = await fetch(
      `${API_BASE}/search/suggest?q=${encodeURIComponent(query)}&engine=${engine}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions || [];
  },
};

export const settingsApi = {
  async exportConfig(): Promise<Blob> {
    const res = await fetch(`${API_BASE}/settings/export`);
    return res.blob();
  },

  async importConfig(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('config', file);
    await fetch(`${API_BASE}/settings/import`, {
      method: 'POST',
      body: formData,
    });
  },
};

export const iconApi = {
  async fetchFavicon(url: string): Promise<string> {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  },
};

export const authApi = {
  async verifyPassword(password: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    return data.success;
  },

  async isPasswordRequired(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/auth/required`);
    const data = await res.json();
    return data.required;
  },
};
