# Journey Plan — Intelligent Beat Plan / PJP Recommendation Engine

Phase 1 prototype (FMCG General Trade, **Dadar, Mumbai**). A rule-based engine
that tags and tiers outlets, assigns visit frequency, and (later) clusters beats
and optimizes routes — plus a field-rep mobile app.

## Repository layout

```
.
├── backend/     Python engine — OSM ingestion + outlet tiering/visit-frequency
│                rule engine, on PostgreSQL. See backend/README.md
├── frontend/    React (Vite) rep mobile app — Today's Plan + free map tab.
│                See frontend/README.md
├── docs/        Source requirements
│                ├── PJP-BeatPlan-PRD-BRD.pdf
│                └── outlet-tiering-visit-frequency-requirements.md
└── .claude/     Claude Code workspace (skills/ — add project skills here)
```

## Quick start

**Backend** (Python 3.11+, PostgreSQL):

```bash
cd backend
pip install -r requirements.txt
python -m scripts.init_db && python -m scripts.run_ingest && python -m scripts.run_tiering
```

**Frontend** (Node 18+):

```bash
cd frontend
npm install && npm run dev
```

See each subfolder's README for details.
