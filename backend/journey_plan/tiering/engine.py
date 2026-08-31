"""Rule-based Outlet Tiering & Visit Frequency engine.

Implements FR-1 .. FR-4 of the Outlet Tagging, Tiering & Visit Frequency doc:

  1. Size Tag         (from OSM type, configurable mapping)          -> FR-1
  2. Synthetic sales  (per-size range with variance)                -> FR-2.1/2.2
  3. Sales band       (percentile rank WITHIN the size group)       -> FR-2.3
  4. Tier             (Size x Sales-band matrix)                    -> FR-3
  5. Visit frequency  (Tier -> frequency lookup)                    -> FR-4

The engine only fills the AUTO fields and only sets the effective value when it
has not been manually overridden, so manual corrections (FR-5) are preserved
across re-runs.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_rules, get_settings
from ..models import Outlet, OutletStatus, SalesBand, SizeTag, Tier, ValueSource

logger = logging.getLogger(__name__)


# --- FR-1: Size tagging ------------------------------------------------------


def assign_size_tag(osm_shop_type: str | None, rules: dict | None = None) -> SizeTag:
    """Map an OSM `key=value` type string to a default Size Tag."""
    rules = rules or get_rules()
    mapping: dict[str, str] = rules["size_mapping"]
    default: str = rules["size_default"]
    label = mapping.get(osm_shop_type or "", default)
    return SizeTag(label)


# --- FR-2: Synthetic sales & percentile band ---------------------------------


def generate_synthetic_sales(
    size_tag: SizeTag, rng: np.random.Generator, rules: dict | None = None
) -> float:
    """Draw a simulated monthly sales value within the size band.

    Uses a triangular distribution centred on the band midpoint so values carry
    realistic variance and cluster toward the middle rather than being flat
    uniform noise (FR-2.2).
    """
    rules = rules or get_rules()
    band = rules["simulated_sales_ranges"][size_tag.value]
    lo, hi = float(band["min"]), float(band["max"])
    mode = (lo + hi) / 2.0
    return float(round(rng.triangular(lo, mode, hi), 2))


def _band_for_percentile(pct: float, rules: dict) -> SalesBand:
    bands = rules["sales_performance_bands"]
    # Ordered Low -> Medium -> High by their upper-bound percentile.
    for name in ("Low", "Medium", "High"):
        if pct <= float(bands[name]["max_percentile"]):
            return SalesBand(name)
    return SalesBand.High


def compute_sales_bands(
    sales_by_id: dict[int, float], size_by_id: dict[int, SizeTag], rules: dict | None = None
) -> dict[int, SalesBand]:
    """Assign each outlet a percentile-rank band WITHIN its own size group (FR-2.3).

    Percentile = fractional rank in [0, 1] among peers of the same Size Tag.
    """
    rules = rules or get_rules()
    bands: dict[int, SalesBand] = {}

    # Group outlet ids by size tag.
    groups: dict[SizeTag, list[int]] = {}
    for oid, size in size_by_id.items():
        groups.setdefault(size, []).append(oid)

    for size, ids in groups.items():
        n = len(ids)
        # Sort ids by sales ascending; 0-based rank -> percent-rank in [0, 1]
        # (the Excel PERCENTRANK convention), so equal thirds land exactly on
        # the band cut-points.
        ordered = sorted(ids, key=lambda i: sales_by_id[i])
        for rank, oid in enumerate(ordered):
            pct = 0.5 if n == 1 else rank / (n - 1)
            bands[oid] = _band_for_percentile(pct, rules)
    return bands


# --- FR-3: Tier assignment ---------------------------------------------------


def assign_tier(size_tag: SizeTag, band: SalesBand, rules: dict | None = None) -> Tier:
    rules = rules or get_rules()
    return Tier(rules["tier_matrix"][size_tag.value][band.value])


# --- FR-4: Visit frequency ---------------------------------------------------


@dataclass(frozen=True)
class VisitFrequency:
    label: str
    per_week: float


def map_visit_frequency(tier: Tier, rules: dict | None = None) -> VisitFrequency:
    rules = rules or get_rules()
    entry = rules["visit_frequency"][tier.value]
    return VisitFrequency(label=entry["label"], per_week=float(entry["per_week"]))


# --- Orchestration -----------------------------------------------------------


@dataclass
class TieringSummary:
    outlets_processed: int
    size_counts: dict[str, int]
    tier_counts: dict[str, int]
    frequency_counts: dict[str, int]


def apply_tiering(session: Session, *, regenerate_sales: bool = False) -> TieringSummary:
    """Run the full tiering pipeline over all active outlets.

    Manually overridden fields (source == Manual) are preserved: only the
    corresponding `_auto` column is refreshed, never the effective value.
    """
    rules = get_rules()
    settings = get_settings()
    rng = np.random.default_rng(settings.synthetic_sales_seed)

    outlets = list(
        session.scalars(select(Outlet).where(Outlet.status == OutletStatus.Active)).all()
    )
    if not outlets:
        logger.warning("No active outlets found — run ingestion first.")
        return TieringSummary(0, {}, {}, {})

    # 1) Size tag (FR-1) — deterministic before RNG draws for stable sales.
    outlets.sort(key=lambda o: o.id)
    for o in outlets:
        auto_size = assign_size_tag(o.osm_shop_type, rules)
        o.size_tag_auto = auto_size
        if o.size_tag_source != ValueSource.Manual or o.size_tag is None:
            o.size_tag = auto_size
            o.size_tag_source = ValueSource.Auto

    # 2) Synthetic monthly sales (FR-2.1/2.2) — keep existing unless regenerating.
    for o in outlets:
        if o.simulated_monthly_sales is None or regenerate_sales:
            o.simulated_monthly_sales = generate_synthetic_sales(o.size_tag, rng, rules)

    # 3) Percentile band within size group (FR-2.3).
    sales_by_id = {o.id: float(o.simulated_monthly_sales) for o in outlets}
    size_by_id = {o.id: o.size_tag for o in outlets}
    auto_bands = compute_sales_bands(sales_by_id, size_by_id, rules)
    for o in outlets:
        auto_band = auto_bands[o.id]
        o.sales_band_auto = auto_band
        if o.sales_band_source != ValueSource.Manual or o.sales_performance_band is None:
            o.sales_performance_band = auto_band
            o.sales_band_source = ValueSource.Auto

    # 4) Tier (FR-3) + 5) Visit frequency (FR-4).
    for o in outlets:
        auto_tier = assign_tier(o.size_tag, o.sales_performance_band, rules)
        o.tier_auto = auto_tier
        if o.tier_source != ValueSource.Manual or o.tier is None:
            o.tier = auto_tier
            o.tier_source = ValueSource.Auto

        freq = map_visit_frequency(o.tier, rules)
        o.visit_frequency = freq.label
        o.visit_frequency_per_week = freq.per_week

    return _summarize(outlets)


def _summarize(outlets: list[Outlet]) -> TieringSummary:
    def counts(attr):
        out: dict[str, int] = {}
        for o in outlets:
            v = getattr(o, attr)
            key = v.value if hasattr(v, "value") else str(v)
            out[key] = out.get(key, 0) + 1
        return dict(sorted(out.items()))

    return TieringSummary(
        outlets_processed=len(outlets),
        size_counts=counts("size_tag"),
        tier_counts=counts("tier"),
        frequency_counts=counts("visit_frequency"),
    )
