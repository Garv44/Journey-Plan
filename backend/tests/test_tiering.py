"""Unit tests for the tiering rule engine (no DB required)."""
from __future__ import annotations

import numpy as np

from journey_plan.config import get_rules
from journey_plan.models import SalesBand, SizeTag, Tier
from journey_plan.tiering.engine import (
    assign_size_tag,
    assign_tier,
    compute_sales_bands,
    generate_synthetic_sales,
    map_visit_frequency,
)


def test_size_mapping_defaults():
    assert assign_size_tag("shop=convenience") == SizeTag.Small
    assert assign_size_tag("shop=grocery") == SizeTag.Medium
    assert assign_size_tag("shop=supermarket") == SizeTag.Large
    # Unknown / missing -> safe default (Small)
    assert assign_size_tag("shop=car_repair") == SizeTag.Small
    assert assign_size_tag(None) == SizeTag.Small


def test_synthetic_sales_within_band():
    rng = np.random.default_rng(0)
    rules = get_rules()
    for _ in range(200):
        v = generate_synthetic_sales(SizeTag.Medium, rng, rules)
        assert 50000 <= v <= 150000


def test_sales_band_is_within_size_group():
    # 9 Small outlets -> thirds map to Low/Medium/High by rank.
    sales = {i: float(i * 1000) for i in range(1, 10)}          # 1000..9000 ascending
    sizes = {i: SizeTag.Small for i in range(1, 10)}
    bands = compute_sales_bands(sales, sizes)
    # Lowest three -> Low, middle three -> Medium, top three -> High.
    assert bands[1] == SalesBand.Low and bands[3] == SalesBand.Low
    assert bands[4] == SalesBand.Medium and bands[6] == SalesBand.Medium
    assert bands[7] == SalesBand.High and bands[9] == SalesBand.High


def test_small_high_beats_medium_low_via_matrix():
    # Business rule 4: a small high-performer (B) outranks a medium low (C).
    assert assign_tier(SizeTag.Small, SalesBand.High) == Tier.B
    assert assign_tier(SizeTag.Medium, SalesBand.Low) == Tier.C
    # Large low is B, not automatically A.
    assert assign_tier(SizeTag.Large, SalesBand.Low) == Tier.B


def test_full_tier_matrix():
    expected = {
        (SizeTag.Large, SalesBand.Low): Tier.B,
        (SizeTag.Large, SalesBand.Medium): Tier.A,
        (SizeTag.Large, SalesBand.High): Tier.A,
        (SizeTag.Medium, SalesBand.Low): Tier.C,
        (SizeTag.Medium, SalesBand.Medium): Tier.B,
        (SizeTag.Medium, SalesBand.High): Tier.A,
        (SizeTag.Small, SalesBand.Low): Tier.C,
        (SizeTag.Small, SalesBand.Medium): Tier.C,
        (SizeTag.Small, SalesBand.High): Tier.B,
    }
    for (size, band), tier in expected.items():
        assert assign_tier(size, band) == tier


def test_visit_frequency_mapping():
    assert map_visit_frequency(Tier.A).per_week == 2.0
    assert map_visit_frequency(Tier.B).per_week == 1.0
    assert map_visit_frequency(Tier.C).per_week == 0.5
