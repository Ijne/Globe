# src architecture

This directory contains the modular architecture version of the project for coursework requirements.

## Structure
- `blocks/` - BEM-based UI modules
- `pages/` - page orchestrators
- `services/` - APIs and storage access
- `utils/` - helper utilities
- `styles/` - shared style primitives
- `assets/` - media placeholders

## Migration strategy
1. Keep `frontend/static/js` as stable production code.
2. Move one page at a time to `src/pages/*`.
3. Connect bundler later (Vite/Webpack) if required by next assignment stage.
