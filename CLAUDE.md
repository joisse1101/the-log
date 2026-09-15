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

Dexie (`LogDatabase`) defines five tables backed by these schemas:
- `logEntries` — free-form journal entries (the "log"), optionally linked to a ticket via `ticketId`
- `boards` — kanban boards, each with an ordered `columnIds: string[]` — this array is the **single source of truth** for board→column membership and display order; `Column` itself has no `boardId` back-reference, so a column only belongs to whichever board's `columnIds` lists it
- `columns` — kanban columns (id, name), reconciled by id via `syncColumns` in `useBoards.ts` so renaming/reordering columns (edited through `ConfigureBoardModal`) doesn't disturb existing ticket placement
- `tickets` — kanban cards, board-agnostic on their own
- `columnTickets` — the join table placing a ticket in a specific column, with a fractional `position` for ordering within that column (see `src/utils/positioning.ts`)

Deleting a board cascades to its columns and `columnTickets` rows (see `removeBoard`), but **not** to the `tickets` themselves — orphaned tickets are left in place intentionally, since tickets are board-agnostic and can outlive the column/board they were last placed on.

A `logDb.on('ready', ...)` hook seeds a default board on first load so `TheBoard` always has something to render.

There is no repository/service layer — components call into hooks, and hooks talk to `logDb` directly.

### Data access hooks (`src/hooks/`)

`useLogs.ts`, `useBoards.ts`, and `useColumns.ts` wrap Dexie tables with `dexie-react-hooks`' `useLiveQuery`, so components re-render automatically on any DB write — there is no separate global state store (no Redux/Zustand/context). Each hook returns both the live-queried data and the mutator functions (add/update/remove) that operate on it, e.g. `useTicket(id)`, `useColumns(columnId)`, `useBoards()`, `useBoardData(boardId)`. When adding a new piece of persisted state, follow this pattern: extend the Zod schema/Dexie table, then add or extend a hook — don't reach for `logDb` directly from components.

### Routing & pages (`src/App.tsx`, `src/pages/`)

Three routes under `MainLayout` (`src/layouts/MainLayout.tsx`, which wraps `Outlet` with the ui-library `Header`/`Footer`):
- `/the-log` → `Home.tsx` — the log/journal view (list of `logEntries`)
- `/the-log/the-board` → `TheBoard.tsx` — kanban board; renders one `Column` per `board.columnIds` entry, each column pulling its own data and tickets via `useColumns(columnId)`
- `/the-log/the-board/tickets/:ticketId` → `TicketDetails.tsx` — edit/delete a single ticket

Board-specific presentational pieces live in `src/components/partials/theBoard/` (`Column`, `TicketCard`, `ConfigureBoardModal`).

### Ticket drag-and-drop

Built on `react-dnd` + `react-dnd-html5-backend`, scoped to `TheBoard.tsx` via a single `DndProvider`. `TicketCard` is the drag source; `Column` is the only drop target (dropping is resolved against the whole column, not per-card, so there's no dead space between cards for a drop to fall through). `Column.resolveDropTarget` finds the card nearest the cursor and decides before/after by comparing that card's original position to the dragged card's — not by cursor half — since half-based detection is a no-op for adjacent swaps. `useColumns().moveTicket(ticketId, fromColumnId, target?)` handles both cross-column moves and same-column reorders using fractional positions from `src/utils/positioning.ts`, rebalancing the column in one batch when positions get too tight to insert between.

### Other conventions

- Path alias `@/*` → `src/*` (configured in `tsconfig.app.json` and resolved via `vite-tsconfig-paths` in `vite.config.ts`).
- Toasts go through `sonner` (`<Toaster />` mounted once in `App.tsx`; call `toast.error(...)` etc. from hooks on failed DB operations, not from components).
- Styling is hand-written SCSS in `src/styles/`, imported globally from `main.scss` (no CSS-in-JS, no Tailwind).
- The React Compiler is enabled (via `babel-plugin-react-compiler` in `vite.config.ts`) — avoid manual `useMemo`/`useCallback` micro-optimizations unless there's a proven need, the compiler handles most of that.
