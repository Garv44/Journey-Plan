"""Manual override helpers with audit trail (FR-5).

Overriding a field:
  * sets the effective value and marks its `*_source` as Manual,
  * leaves the corresponding `*_auto` column intact (the rule-derived value),
  * writes an immutable OverrideLog row (old -> new).

When Size Tag or Sales band is overridden, the downstream Tier and Visit
Frequency are recomputed from the (possibly overridden) inputs unless Tier
itself has also been manually pinned.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import Outlet, OverrideLog, SalesBand, SizeTag, Tier, ValueSource
from .engine import assign_tier, map_visit_frequency


def _log(session: Session, outlet: Outlet, field: str, old, new, reason: str | None) -> None:
    session.add(
        OverrideLog(
            outlet_id=outlet.id,
            field=field,
            old_value=(old.value if hasattr(old, "value") else (str(old) if old is not None else None)),
            new_value=(new.value if hasattr(new, "value") else str(new)),
            reason=reason,
        )
    )


def _recompute_downstream(outlet: Outlet) -> None:
    """Refresh Tier (if not manually pinned) and Visit Frequency."""
    if outlet.tier_source != ValueSource.Manual:
        auto_tier = assign_tier(outlet.size_tag, outlet.sales_performance_band)
        outlet.tier_auto = auto_tier
        outlet.tier = auto_tier
        outlet.tier_source = ValueSource.Auto
    freq = map_visit_frequency(outlet.tier)
    outlet.visit_frequency = freq.label
    outlet.visit_frequency_per_week = freq.per_week


def override_size_tag(
    session: Session, outlet: Outlet, new_size: SizeTag, reason: str | None = None
) -> Outlet:
    _log(session, outlet, "size_tag", outlet.size_tag, new_size, reason)
    outlet.size_tag = new_size
    outlet.size_tag_source = ValueSource.Manual
    _recompute_downstream(outlet)
    return outlet


def override_sales_band(
    session: Session, outlet: Outlet, new_band: SalesBand, reason: str | None = None
) -> Outlet:
    _log(session, outlet, "sales_performance_band", outlet.sales_performance_band, new_band, reason)
    outlet.sales_performance_band = new_band
    outlet.sales_band_source = ValueSource.Manual
    _recompute_downstream(outlet)
    return outlet


def override_tier(
    session: Session, outlet: Outlet, new_tier: Tier, reason: str | None = None
) -> Outlet:
    _log(session, outlet, "tier", outlet.tier, new_tier, reason)
    outlet.tier = new_tier
    outlet.tier_source = ValueSource.Manual
    # Visit frequency always follows the effective Tier (FR-4).
    freq = map_visit_frequency(new_tier)
    outlet.visit_frequency = freq.label
    outlet.visit_frequency_per_week = freq.per_week
    return outlet
