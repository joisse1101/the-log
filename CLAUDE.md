# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run dev:force` — dev server with `--force` (clears Vite's dep cache; use if you hit stale-optimize-deps issues, especially after touching the linked ui-library)
- `npm run dev:host` — dev server bound to `--host` (for testing from another device)
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — ESLint over the whole repo
- `npm run preview` — serve the production build locally

There is no test runner configured in this project.

### Working with `@joisse1101/ui-library`

All UI primitives (`Button`, `Modal`, `TextArea`, `Switch`, `InlineSelect`, `Header`/`Footer`, etc.) come from the private package `@joisse1101/ui-library`, published to GitHub Packages and normally installed as a regular dependency. For local development against an unreleased version of that library, it's linked in via [yalc](https://github.com/wclr/yalc) (see `.yalc/`, `yalc.lock`):

- `npm run dev:link` — yalc-link the local ui-library build, then start the dev server with `--force`
- `npm run dev:update` — pull the latest yalc-published build of ui-library, then `dev:force`
- `npm run build:unlink` — remove the yalc link, restore the real npm-installed version, and build (use before shipping/deploying)

If ui-library components appear stale or missing exports, suspect a yalc link that needs updating rather than a code bug.

## Architecture

This is a client-only React 19 + TypeScript + Vite SPA with **no backend** — all data lives in the browser via IndexedDB (through Dexie). It's built to be served from a `/the-log/` subpath (see `base: '/the-log/'` in `vite.config.ts`); every route in `App.tsx` is nested under `/the-log`.

### Data layer (`src/db/theLogsDb.ts`)

Zod schemas double as both runtime validators and the source of TypeScript types:
- `z.infer<typeof XSchema>` → the stored/full type (e.g. `Board`, `Ticket`)
- `z.input<typeof XSchema>` → the "create" type, before Zod defaults (id, timestamps) are applied

Dexie (`LogDatabase`) defines four tables backed by these schemas:
- `logEntries` — free-form journal entries (the "log"), optionally linked to a ticket via `ticketId`
- `boards` — kanban boards, each with an ordered `columns: string[]` (column *names* are the join key, not ids)
- `tickets` — kanban cards, board-agnostic on their own
- `boardTickets` — the join table placing a ticket on a specific board+column with a `position` for ordering

A `logDb.on('ready', ...)` hook seeds a default board on first load so `TheBoard` always has something to render.

There is no repository/service layer — components call into hooks, and hooks talk to `logDb` directly.

### Data access hooks (`src/hooks/`)

`useLogs.ts` and `useBoards.ts` wrap Dexie tables with `dexie-react-hooks`' `useLiveQuery`, so components re-render automatically on any DB write — there is no separate global state store (no Redux/Zustand/context). Each hook returns both the live-queried data and the mutator functions (add/update/remove) that operate on it, e.g. `useTicket(id)`, `useColumns(boardId, columnName)`, `useBoards()`, `useBoardData(boardId)`. When adding a new piece of persisted state, follow this pattern: extend the Zod schema/Dexie table, then add or extend a hook — don't reach for `logDb` directly from components.

### Routing & pages (`src/App.tsx`, `src/pages/`)

Three routes under `MainLayout` (`src/layouts/MainLayout.tsx`, which wraps `Outlet` with the ui-library `Header`/`Footer`):
- `/the-log` → `Home.tsx` — the log/journal view (list of `logEntries`)
- `/the-log/the-board` → `TheBoard.tsx` — kanban board; renders one `Column` per `board.columns` entry, each column pulling its tickets via `useColumns`
- `/the-log/the-board/tickets/:ticketId` → `TicketDetails.tsx` — edit/delete a single ticket

Board-specific presentational pieces live in `src/components/partials/theBoard/` (`Column`, `TicketCard`, `ConfigureBoardModal`).

### Other conventions

- Path alias `@/*` → `src/*` (configured in `tsconfig.app.json` and resolved via `vite-tsconfig-paths` in `vite.config.ts`).
- Toasts go through `sonner` (`<Toaster />` mounted once in `App.tsx`; call `toast.error(...)` etc. from hooks on failed DB operations, not from components).
- Styling is hand-written SCSS in `src/styles/`, imported globally from `main.scss` (no CSS-in-JS, no Tailwind).
- The React Compiler is enabled (via `babel-plugin-react-compiler` in `vite.config.ts`) — avoid manual `useMemo`/`useCallback` micro-optimizations unless there's a proven need, the compiler handles most of that.
