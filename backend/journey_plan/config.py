"""Runtime configuration and rule loading.

Environment settings come from `.env` / the process environment.
The tiering rule tables come from `config/rules.yaml` so they can be tuned
without touching code (as required by FR-1..FR-4).
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import yaml
from dotenv import load_dotenv

# Project root = parent of the journey_plan package.
ROOT_DIR = Path(__file__).resolve().parent.parent
RULES_PATH = ROOT_DIR / "config" / "rules.yaml"

# Load .env once at import time; real env vars still take precedence.
load_dotenv(ROOT_DIR / ".env", override=False)


@dataclass(frozen=True)
class BBox:
    """Bounding box in (south, west, north, east) order (lat/lon degrees)."""

    south: float
    west: float
    north: float
    east: float

    def as_overpass(self) -> str:
        # Overpass expects: (south,west,north,east)
        return f"{self.south},{self.west},{self.north},{self.east}"


@dataclass(frozen=True)
class Settings:
    database_url: str
    overpass_url: str
    area_name: str
    bbox: BBox
    synthetic_sales_seed: int


def _get(name: str, default: str | None = None) -> str:
    val = os.getenv(name, default)
    if val is None:
        raise RuntimeError(f"Required environment variable {name!r} is not set")
    return val


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        database_url=_get("DATABASE_URL"),
        overpass_url=_get("OVERPASS_URL", "https://overpass-api.de/api/interpreter"),
        area_name=_get("AREA_NAME", "Dadar, Mumbai"),
        bbox=BBox(
            south=float(_get("BBOX_SOUTH", "19.008")),
            west=float(_get("BBOX_WEST", "72.834")),
            north=float(_get("BBOX_NORTH", "19.030")),
            east=float(_get("BBOX_EAST", "72.855")),
        ),
        synthetic_sales_seed=int(_get("SYNTHETIC_SALES_SEED", "42")),
    )


@lru_cache(maxsize=1)
def get_rules() -> dict:
    """Load and cache the tiering rule tables from config/rules.yaml."""
    with open(RULES_PATH, "r", encoding="utf-8") as fh:
        rules = yaml.safe_load(fh)
    _validate_rules(rules)
    return rules


def _validate_rules(rules: dict) -> None:
    required = [
        "size_mapping",
        "size_default",
        "simulated_sales_ranges",
        "sales_performance_bands",
        "tier_matrix",
        "visit_frequency",
    ]
    missing = [k for k in required if k not in rules]
    if missing:
        raise ValueError(f"rules.yaml missing required sections: {missing}")
