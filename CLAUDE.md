# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Docker deployment (recommended)
docker compose up -d                    # Start at http://localhost:8015
docker compose up -d --build            # Rebuild and start

# Frontend development (port 5173)
cd frontend && npm install && npm run dev

# Backend development (port 3001)
cd backend && npm install && npm run dev

# Frontend only
npm run build     # Build: tsc + vite
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Architecture

This is a personal navigation homepage with React frontend and Express backend.

### Frontend (`frontend/`)
- **React 18 + TypeScript + Vite 5**
- **State**: Zustand stores in `stores/`
  - `useAppStore.ts` - Apps, bookmarks, providers data (fetched from API)
  - `useSettingsStore.ts` - User preferences (persisted to localStorage)
- **Components**: Flat structure in `components/` (no nesting)
- **Styling**: TailwindCSS with Glassmorphism design
- **Types**: All interfaces in `types/index.ts`

### Backend (`backend/`)
- **Express.js** with JSON file storage in `data/`
- **Routes**: One file per resource in `routes/`
  - `/api/apps` - App groups and applications
  - `/api/links` - Bookmark categories
  - `/api/providers` - Search engines
  - `/api/settings` - Config import/export
  - `/api/weather`, `/api/search`, `/api/auth`
- **Data files**: `apps.json`, `links.json`, `providers.json`

### Data Flow
1. Frontend stores fetch from `/api/*` endpoints on mount
2. Updates are optimistically applied to Zustand state
3. PUT requests sync full data to backend JSON files
4. Settings persist client-side via Zustand persist middleware

## Key Patterns

- Frontend uses `fetch` directly (no axios) - see `stores/useAppStore.ts`
- IDs are generated client-side with `Math.random().toString(36).substring(2, 9)`
- Edit mode is global state in `useSettingsStore`
- Optional edit password via `EDIT_PASSWORD` env var
