# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `EDIT_PASSWORD` | Optional password to protect edit mode. Leave empty for unrestricted access. |

## Development Commands

```bash
# Docker deployment (recommended)
docker compose up -d                    # Start at http://localhost:8015
docker compose up -d --build            # Rebuild and start

# Frontend development (port 5173)
cd frontend && npm install && npm run dev

# Backend development (port 3001)
cd backend && npm install && npm run dev

# Frontend linting
cd frontend && npm run lint             # ESLint
cd frontend && npm run build            # TypeScript check + Vite build
```

## Architecture

Personal navigation homepage with React frontend and Express backend (JSON file storage).

### Frontend (`frontend/`)
- **React 18 + TypeScript + Vite 5** with TailwindCSS
- **State Management**: Zustand stores in `stores/`
  - `useAppStore.ts` - Apps, bookmarks, providers (fetched from API, optimistic updates)
  - `useSettingsStore.ts` - User preferences (persisted to localStorage via Zustand persist)
- **Components**: Flat structure in `components/` (no nesting)
- **Types**: All interfaces in `types/index.ts`

### Backend (`backend/`)
- **Express.js** with JSON file storage in `data/`
- **Routes**: One file per resource in `routes/` - apps, links, providers, settings, weather, search, auth
- **Data files**: `apps.json`, `links.json`, `providers.json`

### Data Flow
1. Frontend stores fetch from `/api/*` endpoints on mount
2. Updates are optimistically applied to Zustand state
3. PUT requests sync full data to backend JSON files

## Key Patterns

- Use `fetch` directly (no axios) - see `stores/useAppStore.ts`
- Generate IDs client-side: `Math.random().toString(36).substring(2, 9)`
- Edit mode is global state in `useSettingsStore.isEditMode`
- API updates use PUT with full data replacement (not PATCH)
