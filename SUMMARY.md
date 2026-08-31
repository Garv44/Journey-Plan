# Journey Plan — Project Summary

Quick catch-up doc (resume here if context is lost). Intelligent Beat Plan / PJP
engine — Phase 1 prototype, **Dadar, Mumbai**. Source docs in `docs/`.

## Layout
```
backend/   Python engine (PostgreSQL) — OSM ingestion + outlet tiering
frontend/  React (Vite) rep mobile app — auth + Today's Plan + Map
docs/      PRD/BRD pdf + outlet-tiering requirements
.claude/   skills/ (empty, for later)
```

## Backend — DONE & working
Outlet tiering rule engine (size tag → synthetic sales → percentile band → tier
A/B/C → visit frequency), manual overrides + audit, OSM Overpass ingestion.
- DB: `postgresql://postgres:garv1234@localhost:5432/journey` (Postgres 18, **no PostGIS** — lat/lng as plain cols)
- **173 real Dadar outlets** ingested & tiered. 6/6 unit tests pass.
- Run: `cd backend && pip install -r requirements.txt && python -m scripts.init_db && python -m scripts.run_ingest && python -m scripts.run_tiering`
- Key files: `journey_plan/models.py`, `journey_plan/tiering/engine.py`, `config/rules.yaml` (all rules configurable)

## Frontend — DONE & verified in browser
Ported from Claude Design "Rep app in Modernist". Modernist look (Archivo, ink
#201e1d, red #ec3013, sharp corners). Screens built:
- **Auth** (`src/screens/Auth.jsx`): Welcome → Login (mobile+OTP) / Signup (name+mobile+email → OTP → industry) → app. **All fields prefilled** from `frontend/test-credentials.txt` (mobile `9820011223`, OTP `482913`).
- **Today's Plan** (`src/screens/TodayPlan.jsx`): 10 outlets, tier chips, status, GPS lines, distance footer.
- **Map** (`src/screens/MapView.jsx`): **free OpenFreeMap** vector basemap via MapLibre (NO Google Maps, no API key). Animated shop markers, planned(dashed)/GPS(solid) routes, next-stop sheet.
- **History** (`src/screens/History.jsx`): week strip (tap a day), that day's visit records (sample data for 17 & 16 Aug).
- **Profile** (`src/screens/Profile.jsx`): rep identity (name/industry carried from onboarding), beat details, sync queue, Wi-Fi toggle, Log out.
- **Outlet Visit** (`src/screens/OutletVisit.jsx`): opens over the app when a stop (or map "Open visit") is tapped. Check In stamps GPS+time and unlocks the order form (Yes/No, value, shelf photo, notes); Check Out writes a "done" record; Mark as skipped writes "skipped" with a reason. Status writes back to `visits` state so the Plan list + Map update live.
- Sample outlet data (not yet from backend): `src/data/outlets.js`
- Run: Node via nvm → `export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH" && cd frontend && npm install && npm run dev` → http://localhost:5173
  - Note: `npm approve-scripts esbuild` was needed once (allow-scripts guard).

## Next steps (not started)
1. Serve backend's 173 tiered outlets via an API; frontend fetches them instead of `outlets.js` sample.
2. End-of-day sheet (the "End the day" button on Today's Plan is still a no-op).
3. Backend: beat clustering + route optimization (OR-Tools + OSRM) per the PRD.

## Gotchas fixed
- `outlets.js` had a temporal-dead-zone crash (SEED_VISITS → fixFor → R6 before init); R6/R2 are now hoisted function declarations.
- `MapView.jsx` gated ALL drawing on MapLibre's `load` event, so if the tile CDN was slow/unreachable the whole map (even the HTML outlet markers) stayed blank. Now markers + fitBounds render as soon as the map instance exists; only the route *lines* (real style layers) wait for `isStyleLoaded()`. Map degrades to "markers only" instead of blank.
