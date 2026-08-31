"""Database models for the PJP / Beat Plan engine.

Phase 1 focuses on the Outlet Master and the tiering fields defined in the
"Outlet Tagging, Tiering & Visit Frequency" requirement doc (Data Requirements
section) plus an override audit trail (FR-5).
"""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# --- Enumerations (mirror the requirement doc) -------------------------------


class SizeTag(str, enum.Enum):
    Small = "Small"
    Medium = "Medium"
    Large = "Large"


class SalesBand(str, enum.Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"


class Tier(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"


class ValueSource(str, enum.Enum):
    """Traceability flag for auto-assigned vs. manually overridden values."""

    Auto = "Auto"
    Manual = "Manual"


class OutletStatus(str, enum.Enum):
    Active = "Active"
    Inactive = "Inactive"


# --- Outlet Master -----------------------------------------------------------


class Outlet(Base):
    __tablename__ = "outlet_master"

    id: Mapped[int] = mapped_column(primary_key=True)

    # --- Identity / provenance ---
    # OSM element identity (null for manually added outlets).
    osm_type: Mapped[str | None] = mapped_column(String(8))  # node / way / relation
    osm_id: Mapped[int | None] = mapped_column(BigInteger)
    source: Mapped[str] = mapped_column(String(16), default="OSM", nullable=False)  # OSM / Manual

    # --- Descriptive ---
    name: Mapped[str | None] = mapped_column(String(255))
    osm_shop_type: Mapped[str | None] = mapped_column(String(64))   # e.g. shop=convenience
    address: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[OutletStatus] = mapped_column(
        SAEnum(OutletStatus, name="outlet_status"), default=OutletStatus.Active, nullable=False
    )

    # --- FR-1: Size tagging ---
    size_tag: Mapped[SizeTag | None] = mapped_column(SAEnum(SizeTag, name="size_tag"))
    size_tag_source: Mapped[ValueSource | None] = mapped_column(
        SAEnum(ValueSource, name="size_tag_source")
    )
    # Retained original rule-derived value (FR-5.2 — never overwrite silently).
    size_tag_auto: Mapped[SizeTag | None] = mapped_column(SAEnum(SizeTag, name="size_tag_auto"))

    # --- FR-2: Synthetic sales performance ---
    # Phase 1 only; replaced by real sales once available.
    simulated_monthly_sales: Mapped[float | None] = mapped_column(Float)
    sales_performance_band: Mapped[SalesBand | None] = mapped_column(
        SAEnum(SalesBand, name="sales_performance_band")
    )
    sales_band_source: Mapped[ValueSource | None] = mapped_column(
        SAEnum(ValueSource, name="sales_band_source")
    )
    sales_band_auto: Mapped[SalesBand | None] = mapped_column(
        SAEnum(SalesBand, name="sales_band_auto")
    )

    # --- FR-3: Tier ---
    tier: Mapped[Tier | None] = mapped_column(SAEnum(Tier, name="tier"))
    tier_source: Mapped[ValueSource | None] = mapped_column(SAEnum(ValueSource, name="tier_source"))
    tier_auto: Mapped[Tier | None] = mapped_column(SAEnum(Tier, name="tier_auto"))

    # --- FR-4: Visit frequency (required input to Beat Plan module) ---
    visit_frequency: Mapped[str | None] = mapped_column(String(32))  # e.g. "2x per week"
    visit_frequency_per_week: Mapped[float | None] = mapped_column(Float)

    # --- Timestamps ---
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    overrides: Mapped[list["OverrideLog"]] = relationship(
        back_populates="outlet", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("osm_type", "osm_id", name="uq_outlet_osm_identity"),
        CheckConstraint("latitude BETWEEN -90 AND 90", name="ck_outlet_lat_range"),
        CheckConstraint("longitude BETWEEN -180 AND 180", name="ck_outlet_lon_range"),
        Index("ix_outlet_tier", "tier"),
        Index("ix_outlet_size_tag", "size_tag"),
    )

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<Outlet id={self.id} name={self.name!r} tier={self.tier} freq={self.visit_frequency!r}>"


# --- FR-5: Manual override & audit ------------------------------------------


class OverrideLog(Base):
    """Immutable record of a manual override, retaining old and new values."""

    __tablename__ = "outlet_override_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    outlet_id: Mapped[int] = mapped_column(
        ForeignKey("outlet_master.id", ondelete="CASCADE"), nullable=False
    )
    field: Mapped[str] = mapped_column(String(64), nullable=False)  # size_tag / sales_band / tier
    old_value: Mapped[str | None] = mapped_column(String(64))
    new_value: Mapped[str | None] = mapped_column(String(64))
    reason: Mapped[str | None] = mapped_column(Text)  # optional (Open Question in the doc)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    outlet: Mapped[Outlet] = relationship(back_populates="overrides")

    __table_args__ = (Index("ix_override_outlet", "outlet_id"),)
