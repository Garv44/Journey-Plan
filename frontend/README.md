# BeatPlan — Rep Mobile App (frontend)

React (Vite) prototype of the field-rep mobile app for the PJP / Beat Plan
engine. Ported from the "Rep app design in Modernist" Claude Design project.

## This slice

- **Onboarding** (`src/screens/Auth.jsx`) — Welcome → **Log in** (mobile + OTP)
  or **Sign up** (name + mobile + work email → OTP → industry) → the app.
  Every field is **prefilled from `test-credentials.txt`** so testing needs no
  typing — just tap through. Enter a wrong OTP and it flags the mismatch.
- **Today's Plan** (`src/screens/TodayPlan.jsx`) — the page where the rep sees
  the day's outlets: summary strip, progress bar, ordered stop cards with tier
  chip, status and GPS line, and a distance footer measured from GPS stamps.
- **Map View** (`src/screens/MapView.jsx`) — a **free** vector street basemap via
  [OpenFreeMap](https://openfreemap.org) (OpenStreetMap data) rendered with
  MapLibre GL. **No Google Maps, no API key.** Each outlet is an animated shop
  marker on its real Dadar street; dashed = planned route, solid = GPS track,
  red dot = live location, with a collapsible next-stop sheet.
- **History** (`src/screens/History.jsx`) — week strip to pick a day, then that
  day's visit records (time, status, order value). Sample data for 17 & 16 Aug.
- **Profile** (`src/screens/Profile.jsx`) — rep identity (name + industry carried
  from onboarding), beat details, sync queue, Wi-Fi toggle, and Log out.
- **Outlet Visit** (`src/screens/OutletVisit.jsx`) — tap any stop (or the map's
  "Open visit") to open it. **Check In** stamps GPS + time and unlocks the order
  form (Yes/No, value, shelf photo, notes); **Check Out** saves it "done";
  **Mark as skipped** records a reason. Status writes back so the Plan and Map
  update live.
- Bottom nav switches all four tabs.

The 10 sample outlets (real Dadar coordinates) live in `src/data/outlets.js`.
Later they come from the backend Outlet Master (tiering module).

## Run it

Requires Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173). The map needs
internet access to fetch OpenFreeMap tiles; if tiles fail it degrades to routes
and shop markers only.

### Test credentials

`test-credentials.txt` (in this folder) holds the prototype login/signup values
as `KEY=value` lines. `src/testCredentials.js` reads it (via Vite's `?raw`
import) and the forms prefill from it — edit the txt and the forms follow. These
are throwaway prototype values, not real secrets. Defaults:

| Field | Value |
|---|---|
| Mobile | `9820011223` |
| OTP | `482913` |

## Structure

```
test-credentials.txt    # prototype login/signup values (KEY=value)
src/
  main.jsx              # entry, loads maplibre + design CSS
  App.jsx               # phone frame + auth gate + tab state
  theme.js              # Modernist palette + tier styles
  testCredentials.js    # parses test-credentials.txt for form prefill
  index.css             # design-system tokens, btn/input, map + marker styles
  data/outlets.js       # sample Dadar outlets, depot, haversine helpers
  components/
    PhoneFrame.jsx      # iOS device frame
    TopBar.jsx          # kicker/title + sync chip
    BottomNav.jsx       # 4-tab nav
    shopMarker.js       # animated shop + live-dot DOM markers
  screens/
    Auth.jsx            # welcome / login / signup / OTP / industry
    TodayPlan.jsx       # outlet list (primary page)
    MapView.jsx         # MapLibre + OpenFreeMap map tab
    History.jsx         # week strip + visit records
    Profile.jsx         # rep, beat, sync + log out
    OutletVisit.jsx     # check in / order form / check out / skip
```
