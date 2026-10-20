import { create } from 'zustand';
import type { AppGroup, Bookmark, SearchProvider } from '../types';
import { getAuthHeaders, clearAuthToken } from '../services/api';
import { useSettingsStore } from './useSettingsStore';

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

async function syncApps(appGroups: AppGroup[], rollback: () => void, successMsg?: string) {
  try {
    const res = await fetch(`${API_BASE}/apps`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ appGroups }),
    });
    if (res.status === 401) {
      clearAuthToken();
      useSettingsStore.getState().setEditMode(false);
      rollback();
      useSettingsStore.getState().notify('认证已过期，请重新验证编辑密码', 'error');
      return;
    }
    if (!res.ok) {
      throw new Error('Failed to sync apps');
    }
    if (successMsg) {
      useSettingsStore.getState().notify(successMsg, 'success');
    }
  } catch {
    rollback();
    useSettingsStore.getState().notify('保存失败，请检查网络连接', 'error');
  }
}

async function syncBookmarks(bookmarks: Bookmark[], rollback: () => void, successMsg?: string) {
  try {
    const res = await fetch(`${API_BASE}/links`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ bookmarks }),
    });
    if (res.status === 401) {
      clearAuthToken();
      useSettingsStore.getState().setEditMode(false);
      rollback();
      useSettingsStore.getState().notify('认证已过期，请重新验证编辑密码', 'error');
      return;
    }
    if (!res.ok) {
      throw new Error('Failed to sync bookmarks');
    }
    if (successMsg) {
      useSettingsStore.getState().notify(successMsg, 'success');
    }
  } catch {
    rollback();
    useSettingsStore.getState().notify('保存失败，请检查网络连接', 'error');
  }
}

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
      const appGroups = (data.appGroups || []).map((g: AppGroup, idx: number) => ({
        ...g,
        id: g.id || `group-${idx}`,
        apps: (g.apps || []).map((a, aidx) => ({ ...a, id: a.id || `app-${idx}-${aidx}` })),
      }));
      set({ appGroups, loading: false });
    } catch {
      set({ error: 'Failed to fetch apps', loading: false });
    }
  },

  fetchBookmarks: async () => {
    try {
      const res = await fetch(`${API_BASE}/links`);
      const data = await res.json();
      const bookmarks = (data.bookmarks || []).map((b: Bookmark, idx: number) => ({
        ...b,
        id: b.id || `bookmark-${idx}`,
        links: (b.links || []).map((l, lidx) => ({ ...l, id: l.id || `link-${idx}-${lidx}` })),
      }));
      set({ bookmarks });
    } catch {
      set({ error: 'Failed to fetch bookmarks' });
    }
  },

  fetchProviders: async () => {
    try {
      const res = await fetch(`${API_BASE}/providers`);
      const data = await res.json();
      const providers = (data.providers || []).map((p: SearchProvider, idx: number) => ({
        ...p,
        id: p.id || `provider-${idx}`,
      }));
      set({ providers });
    } catch {
      set({ error: 'Failed to fetch providers' });
    }
  },

  addApp: async (groupId, app) => {
    const prev = get().appGroups;
    const newApp = { ...app, id: generateId() };
    const updated = prev.map((g) =>
      g.id === groupId ? { ...g, apps: [...g.apps, newApp] } : g
    );
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }), `已添加「${app.name}」`);
  },

  updateApp: async (groupId, appId, app) => {
    const prev = get().appGroups;
    const updated = prev.map((g) =>
      g.id === groupId
        ? { ...g, apps: g.apps.map((a) => (a.id === appId ? { ...a, ...app } : a)) }
        : g
    );
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }), '应用已更新');
  },

  deleteApp: async (groupId, appId) => {
    const prev = get().appGroups;
    const updated = prev.map((g) =>
      g.id === groupId ? { ...g, apps: g.apps.filter((a) => a.id !== appId) } : g
    );
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }), '应用已删除');
  },

  addAppGroup: async (group) => {
    const prev = get().appGroups;
    const newGroup = { ...group, id: generateId(), apps: [] };
    const updated = [...prev, newGroup];
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }), `已创建分组「${group.category}」`);
  },

  updateAppGroup: async (groupId, group) => {
    const prev = get().appGroups;
    const updated = prev.map((g) => (g.id === groupId ? { ...g, ...group } : g));
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }), '分组已更新');
  },

  deleteAppGroup: async (groupId) => {
    const prev = get().appGroups;
    const updated = prev.filter((g) => g.id !== groupId);
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }), '分组已删除');
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
    const prev = get().bookmarks;
    const newLink = { ...link, id: generateId() };
    const updated = prev.map((b) =>
      b.id === categoryId ? { ...b, links: [...b.links, newLink] } : b
    );
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }), `已添加书签「${link.name}」`);
  },

  updateBookmark: async (categoryId, linkId, link) => {
    const prev = get().bookmarks;
    const updated = prev.map((b) =>
      b.id === categoryId
        ? { ...b, links: b.links.map((l) => (l.id === linkId ? { ...l, ...link } : l)) }
        : b
    );
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }), '书签已更新');
  },

  deleteBookmark: async (categoryId, linkId) => {
    const prev = get().bookmarks;
    const updated = prev.map((b) =>
      b.id === categoryId ? { ...b, links: b.links.filter((l) => l.id !== linkId) } : b
    );
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }), '书签已删除');
  },

  addBookmarkCategory: async (category) => {
    const prev = get().bookmarks;
    const newCategory = { ...category, id: generateId(), links: [] };
    const updated = [...prev, newCategory];
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }), `已创建分类「${category.category}」`);
  },

  updateBookmarkCategory: async (categoryId, category) => {
    const prev = get().bookmarks;
    const updated = prev.map((b) => (b.id === categoryId ? { ...b, ...category } : b));
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }), '分类已更新');
  },

  deleteBookmarkCategory: async (categoryId) => {
    const prev = get().bookmarks;
    const updated = prev.filter((b) => b.id !== categoryId);
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }), '分类已删除');
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
    const prev = get().appGroups;
    const updated = prev.map((g) => {
      if (g.id !== groupId) return g;
      const apps = [...g.apps];
      const [removed] = apps.splice(fromIndex, 1);
      apps.splice(toIndex, 0, removed);
      return { ...g, apps };
    });
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }));
  },

  reorderGroups: async (fromIndex, toIndex) => {
    const prev = get().appGroups;
    const updated = [...prev];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    set({ appGroups: updated });
    await syncApps(updated, () => set({ appGroups: prev }));
  },

  reorderBookmarks: async (categoryId, fromIndex, toIndex) => {
    const prev = get().bookmarks;
    const updated = prev.map((b) => {
      if (b.id !== categoryId) return b;
      const links = [...b.links];
      const [removed] = links.splice(fromIndex, 1);
      links.splice(toIndex, 0, removed);
      return { ...b, links };
    });
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }));
  },

  reorderBookmarkCategories: async (fromIndex, toIndex) => {
    const prev = get().bookmarks;
    const updated = [...prev];
    const [removed] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, removed);
    set({ bookmarks: updated });
    await syncBookmarks(updated, () => set({ bookmarks: prev }));
  },
}));
