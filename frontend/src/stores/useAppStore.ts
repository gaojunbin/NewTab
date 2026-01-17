import { create } from 'zustand';
import type { AppGroup, Bookmark, SearchProvider } from '../types';

interface AppState {
  appGroups: AppGroup[];
  bookmarks: Bookmark[];
  providers: SearchProvider[];
  loading: boolean;
  error: string | null;

  fetchApps: () => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  fetchProviders: () => Promise<void>;

  addApp: (groupId: string, app: Omit<AppGroup['apps'][0], 'id'>) => Promise<void>;
  updateApp: (groupId: string, appId: string, app: Partial<AppGroup['apps'][0]>) => Promise<void>;
  deleteApp: (groupId: string, appId: string) => Promise<void>;

  addAppGroup: (group: Omit<AppGroup, 'id' | 'apps'>) => Promise<void>;
  updateAppGroup: (groupId: string, group: Partial<AppGroup>) => Promise<void>;
  deleteAppGroup: (groupId: string) => Promise<void>;
  toggleGroupCollapse: (groupId: string) => void;

  addBookmark: (categoryId: string, link: Omit<Bookmark['links'][0], 'id'>) => Promise<void>;
  updateBookmark: (categoryId: string, linkId: string, link: Partial<Bookmark['links'][0]>) => Promise<void>;
  deleteBookmark: (categoryId: string, linkId: string) => Promise<void>;

  addBookmarkCategory: (category: Omit<Bookmark, 'id' | 'links'>) => Promise<void>;
  updateBookmarkCategory: (categoryId: string, category: Partial<Bookmark>) => Promise<void>;
  deleteBookmarkCategory: (categoryId: string) => Promise<void>;
  toggleBookmarkCollapse: (categoryId: string) => void;

  reorderApps: (groupId: string, fromIndex: number, toIndex: number) => Promise<void>;
  reorderGroups: (fromIndex: number, toIndex: number) => Promise<void>;
  reorderBookmarks: (categoryId: string, fromIndex: number, toIndex: number) => Promise<void>;
  reorderBookmarkCategories: (fromIndex: number, toIndex: number) => Promise<void>;
}

const API_BASE = '/api';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useAppStore = create<AppState>((set, get) => ({
  appGroups: [],
  bookmarks: [],
  providers: [],
  loading: false,
  error: null,

  fetchApps: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/apps`);
      const data = await res.json();
      const appGroups = data.appGroups.map((g: AppGroup, idx: number) => ({
        ...g,
        id: g.id || `group-${idx}`,
        apps: g.apps.map((a, aidx) => ({ ...a, id: a.id || `app-${idx}-${aidx}` })),
      }));
      set({ appGroups, loading: false });
    } catch (err) {
      set({ error: 'Failed to fetch apps', loading: false });
    }
  },

  fetchBookmarks: async () => {
    try {
      const res = await fetch(`${API_BASE}/links`);
      const data = await res.json();
      const bookmarks = data.bookmarks.map((b: Bookmark, idx: number) => ({
        ...b,
        id: b.id || `bookmark-${idx}`,
        links: b.links.map((l, lidx) => ({ ...l, id: l.id || `link-${idx}-${lidx}` })),
      }));
      set({ bookmarks });
    } catch (err) {
      set({ error: 'Failed to fetch bookmarks' });
    }
  },

  fetchProviders: async () => {
    try {
      const res = await fetch(`${API_BASE}/providers`);
      const data = await res.json();
      const providers = data.providers.map((p: SearchProvider, idx: number) => ({
        ...p,
        id: p.id || `provider-${idx}`,
      }));
      set({ providers });
    } catch (err) {
      set({ error: 'Failed to fetch providers' });
    }
  },

  addApp: async (groupId, app) => {
    const { appGroups } = get();
    const newApp = { ...app, id: generateId() };
    const updated = appGroups.map((g) =>
      g.id === groupId ? { ...g, apps: [...g.apps, newApp] } : g
    );
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  updateApp: async (groupId, appId, app) => {
    const { appGroups } = get();
    const updated = appGroups.map((g) =>
      g.id === groupId
        ? { ...g, apps: g.apps.map((a) => (a.id === appId ? { ...a, ...app } : a)) }
        : g
    );
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  deleteApp: async (groupId, appId) => {
    const { appGroups } = get();
    const updated = appGroups.map((g) =>
      g.id === groupId ? { ...g, apps: g.apps.filter((a) => a.id !== appId) } : g
    );
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  addAppGroup: async (group) => {
    const { appGroups } = get();
    const newGroup = { ...group, id: generateId(), apps: [] };
    const updated = [...appGroups, newGroup];
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  updateAppGroup: async (groupId, group) => {
    const { appGroups } = get();
    const updated = appGroups.map((g) => (g.id === groupId ? { ...g, ...group } : g));
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  deleteAppGroup: async (groupId) => {
    const { appGroups } = get();
    const updated = appGroups.filter((g) => g.id !== groupId);
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  toggleGroupCollapse: (groupId) => {
    const { appGroups } = get();
    set({
      appGroups: appGroups.map((g) =>
        g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
      ),
    });
  },

  addBookmark: async (categoryId, link) => {
    const { bookmarks } = get();
    const newLink = { ...link, id: generateId() };
    const updated = bookmarks.map((b) =>
      b.id === categoryId ? { ...b, links: [...b.links, newLink] } : b
    );
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },

  updateBookmark: async (categoryId, linkId, link) => {
    const { bookmarks } = get();
    const updated = bookmarks.map((b) =>
      b.id === categoryId
        ? { ...b, links: b.links.map((l) => (l.id === linkId ? { ...l, ...link } : l)) }
        : b
    );
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },

  deleteBookmark: async (categoryId, linkId) => {
    const { bookmarks } = get();
    const updated = bookmarks.map((b) =>
      b.id === categoryId ? { ...b, links: b.links.filter((l) => l.id !== linkId) } : b
    );
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },

  addBookmarkCategory: async (category) => {
    const { bookmarks } = get();
    const newCategory = { ...category, id: generateId(), links: [] };
    const updated = [...bookmarks, newCategory];
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },

  updateBookmarkCategory: async (categoryId, category) => {
    const { bookmarks } = get();
    const updated = bookmarks.map((b) => (b.id === categoryId ? { ...b, ...category } : b));
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },

  deleteBookmarkCategory: async (categoryId) => {
    const { bookmarks } = get();
    const updated = bookmarks.filter((b) => b.id !== categoryId);
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },

  toggleBookmarkCollapse: (categoryId) => {
    const { bookmarks } = get();
    set({
      bookmarks: bookmarks.map((b) =>
        b.id === categoryId ? { ...b, collapsed: !b.collapsed } : b
      ),
    });
  },

  reorderApps: async (groupId, fromIndex, toIndex) => {
    const { appGroups } = get();
    const updated = appGroups.map((g) => {
      if (g.id !== groupId) return g;
      const apps = [...g.apps];
      const [removed] = apps.splice(fromIndex, 1);
      apps.splice(toIndex, 0, removed);
      return { ...g, apps };
    });
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  reorderGroups: async (fromIndex, toIndex) => {
    const { appGroups } = get();
    const updated = [...appGroups];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    set({ appGroups: updated });
    await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appGroups: updated }),
    });
  },

  reorderBookmarks: async (categoryId, fromIndex, toIndex) => {
    const { bookmarks } = get();
    const updated = bookmarks.map((b) => {
      if (b.id !== categoryId) return b;
      const links = [...b.links];
      const [removed] = links.splice(fromIndex, 1);
      links.splice(toIndex, 0, removed);
      return { ...b, links };
    });
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },

  reorderBookmarkCategories: async (fromIndex, toIndex) => {
    const { bookmarks } = get();
    const updated = [...bookmarks];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    set({ bookmarks: updated });
    await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarks: updated }),
    });
  },
}));
