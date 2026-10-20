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

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0] || url;
  }
}

export function getFaviconUrl(url: string, size: number = 64): string {
  try {
    const domain = new URL(normalizeUrl(url)).hostname;
    if (!domain) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
  } catch {
    return '';
  }
}

export interface WeatherResponse {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  icon: string;
  feelsLike: number;
  windSpeed?: number;
  high?: number;
  low?: number;
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
      `${API_BASE}/search/suggest?q=${encodeURIComponent(query)}&engine=${encodeURIComponent(engine)}`
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
    const res = await fetch(`${API_BASE}/settings/import`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });
    if (!res.ok) {
      throw new Error('Failed to import config');
    }
  },
};

export const iconApi = {
  async fetchFavicon(url: string): Promise<string> {
    return getFaviconUrl(url, 64);
  },
};

export interface GeoLocationResponse {
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  lat: number;
  lon: number;
}

export const geolocationApi = {
  async getLocation(): Promise<GeoLocationResponse> {
    const res = await fetch(`${API_BASE}/geolocation`);
    if (!res.ok) throw new Error('Failed to fetch geolocation');
    return res.json();
  },
};

export const authApi = {
  async verifyPassword(password: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    return !!data.success;
  },

  async isPasswordRequired(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/auth/required`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await res.json();
    return !!data.required;
  },

  async checkStatus(): Promise<{ required: boolean; authenticated: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/auth/required`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) return { required: false, authenticated: true };
      const data = await res.json();
      return {
        required: !!data.required,
        authenticated: data.authenticated ?? !data.required,
      };
    } catch {
      return { required: false, authenticated: true };
    }
  },
};
