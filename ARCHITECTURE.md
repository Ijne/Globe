# Project Architecture (BEM + Modules + OOP)

## Current runtime
- App runs from `frontend/` and is served by `server.js`.
- Existing production scripts are in `frontend/static/js`.

## Architecture layer for coursework compliance
A dedicated source architecture has been added under `src/`:

- `src/blocks` - UI blocks by BEM entities
- `src/pages` - page-level composition classes
- `src/services` - data/services (storage, weather)
- `src/utils` - shared helper utilities
- `src/styles` - global style primitives
- `src/assets` - resources location for scalable structure

## BEM mapping examples
- Block: `nav`, `feedback`, `trip-card`, `modal`
- Element: `nav__button`, `trip-card__name`, `modal__close`
- Modifier: `nav--open`, `feedback-review--active`, `trip-budget__bar--over`

## OOP principles in implemented modules
- Encapsulation: classes `Nav`, `Modal`, `WeatherService`, `StorageService`
- Inheritance-ready design: page classes isolate setup and can extend a base page later
- Polymorphism-ready API: each page class exposes common `init()` entry

## Why this does not break current app
The running app still uses `frontend/static/js/*.js` directly. The `src/` layer is introduced as a clean architecture target for coursework requirements and incremental migration.
