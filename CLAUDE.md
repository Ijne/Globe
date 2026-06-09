# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Globe" — a client-side travel-planning web app built as university coursework (курсовая работа). Vanilla JavaScript ES modules, no framework, **no build step, no bundler, no tests, no linter**. UI text is in Russian. The large `.docx`/`.pdf`/`.pptx` files in the root are the coursework report and presentation, not application assets.

## Running the app

The pages load `src/index.js` and `src/styles/...` via paths relative to the repo root, so the repo root must be the web server's document root.

- **Primary workflow: VS Code Live Server** (port `5501`, set in [.vscode/settings.json](.vscode/settings.json)). Open `index.html` with Live Server.
- `npm run dev` / `npm start` runs [server.js](server.js) (Express, port 5500), but it serves static files from a non-existent `frontend/` directory and `GET /` sends `frontend/index.html` — so it **does not serve the HTML pages as written**. Its one working purpose is the `/api/weather` proxy endpoint. Treat server.js as out of sync with the current layout; do not assume `node server.js` brings up the UI.

When you change how pages are served or where `index.js`/CSS live, update both the HTML `<link>`/`<script>` paths and server.js together.

## Architecture

**Single entry point, page routing by data attribute.** Every HTML page (`index.html`, `dashboard.html`, `trip.html`) sets `<body data-page="main|dashboard|trip">` and loads `<script type="module" src="src/index.js">`. [src/index.js](src/index.js) reads `document.body.dataset.page` and instantiates exactly one page class (`MainPage`, `DashboardPage`, or `TripPage`), each exposing an `init()` entry point. `ThemeToggle` runs on every page.

**Layered structure under `src/`:**
- `pages/` — one orchestrator class per page; wires DOM, binds events, calls services
- `blocks/` — reusable UI behavior classes (`Nav`, `FeedbackTabs`, `AuthModal`, `ThemeToggle`), grouped by BEM block
- `services/` — `StorageService` (localStorage) and `WeatherService` (HTTP)
- `utils/` — pure helpers (`date.js`, `dom.js` incl. `escapeHTML`, `currency.js`)
- `styles/` — see CSS section below

**Persistence is localStorage only**, via [StorageService](src/services/storage-service.js) with namespace `globe`. Keys: `globe_users`, `globe_current_user`, `globe_trips_<email>`. There is no backend database; trips, users, and session all live in the browser.

**Auth is client-side and intentionally insecure** ([auth-modal.js](src/blocks/auth/auth-modal.js)): passwords are stored in plaintext in localStorage and compared directly. This is a coursework demo, not real authentication — do not treat it as a security baseline, but also do not "harden" it into something the coursework scope doesn't ask for without checking.

**Page access control** is done by redirect inside each page's `init()`: dashboard/trip redirect to `index.html` if no current user; `MainPage` redirects an already-logged-in user to `dashboard.html`. The trip page also reads the trip id from `?id=` query string and redirects to `dashboard.html` if missing/invalid.

**Weather has a dual path** ([weather-service.js](src/services/weather-service.js)): it first tries the `/api/weather` Express proxy, and on failure falls back to calling the open-meteo geocoding + forecast APIs directly from the browser. The direct fallback is what makes the app work on static hosting (e.g. GitHub Pages) where server.js isn't running.

**Trip data model** (built in `DashboardPage`, extended lazily in `TripPage.ensureTripCollections`): `{ id, name, destination, startDate, endDate, budget, currency, expenses[], checklist[], notes, isCompleted, completedAt }`. A trip can be "completed" (`isCompleted`), which locks all editing UI and shows a read-only summary — most event handlers early-return via `isTripCompleted()`.

## CSS conventions

Strict **BEM** (`block__element--modifier`), see [ARCHITECTURE.md](ARCHITECTURE.md) for the naming map. Styles are split into many small per-block files under `src/styles/blocks/<page>/` and **aggregated by a single per-page file** in `src/styles/pages/` using `@import` (e.g. [main.css](src/styles/pages/main.css)). HTML pages link only the `pages/*.css` aggregator. When adding a block stylesheet, add its `@import` line to the relevant page aggregator or it won't load.

## Conventions

- Render dynamic HTML via string templates + `innerHTML`; always wrap user-supplied values in `escapeHTML()` from [utils/dom.js](src/utils/dom.js) (see existing trip/dashboard render methods).
- Currency must go through `normalizeCurrency`/`formatCurrency` in [utils/currency.js](src/utils/currency.js); supported codes are `USD`, `EUR`, `RUB`, `GBP`.
- New user-facing strings should be Russian to match the existing UI.

## Stale docs caveat

[ARCHITECTURE.md](ARCHITECTURE.md) and [src/README.md](src/README.md) describe an older `frontend/static/js` production layer and frame `src/` as a future migration target. That migration has already happened — `src/` **is** the live code and there is no `frontend/static/js`. Trust the actual files over those two documents.
