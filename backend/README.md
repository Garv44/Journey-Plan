# Intelligent Beat Plan / PJP Recommendation Engine

Phase 1 prototype (FMCG General Trade, **Dadar, Mumbai**). This is the backend
of the engine described in `../docs/PJP-BeatPlan-PRD-BRD.pdf`, starting with the
**Outlet Tagging, Tiering & Visit Frequency** module described in
`../docs/outlet-tiering-visit-frequency-requirements.md`.

That module is the prerequisite for everything downstream: every outlet must
carry a `visit_frequency` before beat clustering and route optimization can run.

## What's implemented so far

| Stage | Module | Requirement |
|---|---|---|
| Outlet Master schema | `journey_plan/models.py` | Data Requirements |
| OSM Overpass ingestion (Dadar) | `journey_plan/ingest/osm.py` | FR-1.1 |
| Rule-based Size tagging | `journey_plan/tiering/engine.py` | FR-1 |
| Synthetic sales + percentile band | `journey_plan/tiering/engine.py` | FR-2 |
| Tier assignment matrix | `journey_plan/tiering/engine.py` | FR-3 |
| Visit-frequency mapping | `journey_plan/tiering/engine.py` | FR-4 |
| Manual overrides + audit log | `journey_plan/tiering/overrides.py` | FR-5 |

All rule tables (size mapping, sales ranges, tier matrix, frequency map) live in
`config/rules.yaml` and are editable without touching code.

**Not yet built** (later PRD modules): beat clustering, route optimization
(OR-Tools + OSRM), analytics, and map visualization.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Database connection and the Dadar bounding box are configured in `.env`
(`DATABASE_URL` points at the local `journey` Postgres database).

> **Note:** PostGIS is not required for this module — outlet coordinates are
> stored as plain lat/long columns. PostGIS becomes useful for the later
> geo-clustering module and can be enabled then.

## Run the pipeline

```bash
# 1. Create the schema on the journey DB
python -m scripts.init_db

# 2. Pull Dadar outlets from OpenStreetMap
python -m scripts.run_ingest

# 3. Assign size tags, synthetic sales, tiers and visit frequency
python -m scripts.run_tiering

# 4. Inspect the results
python -m scripts.report --limit 15
```

Re-running is safe: ingestion is idempotent on OSM identity, and tiering
preserves any manually overridden fields (only the `*_auto` shadow columns are
refreshed).

## Manual overrides (FR-5)

```python
from journey_plan.db import session_scope
from journey_plan.models import Outlet, SizeTag
from journey_plan.tiering import override_size_tag

with session_scope() as session:
    outlet = session.get(Outlet, 1)
    override_size_tag(session, outlet, SizeTag.Large, reason="Verified large store on site")
```

The original rule-derived value is kept in `size_tag_auto`, the effective value
moves to `size_tag` with `size_tag_source = Manual`, and a row is written to
`outlet_override_log`.

## Project layout

```
journey_plan/
  config.py            # env settings + rules.yaml loader
  db.py                # SQLAlchemy engine / session
  models.py            # Outlet Master + override audit models
  ingest/osm.py        # Overpass API ingestion
  tiering/engine.py    # FR-1..FR-4 rule engine
  tiering/overrides.py # FR-5 manual overrides + audit
config/rules.yaml      # all configurable rule tables
scripts/               # init_db / run_ingest / run_tiering / report CLIs
tests/                 # unit tests for the rule engine
```
