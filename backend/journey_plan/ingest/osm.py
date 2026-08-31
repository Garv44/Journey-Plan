"""OSM Overpass ingestion for the Outlet Master (FR-1.1).

Pulls retail outlets (nodes and ways tagged with `shop`, plus a few relevant
`amenity` values) within the configured bounding box and upserts them into the
`outlet_master` table. Re-running is idempotent on (osm_type, osm_id).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

import requests
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import BBox, get_settings
from ..models import Outlet, OutletStatus

logger = logging.getLogger(__name__)

# amenity values that behave like retail outlets for beat planning
RETAIL_AMENITIES = ("pharmacy", "marketplace")


def build_overpass_query(bbox: BBox) -> str:
    """Overpass QL: all shops + selected amenities within the bbox."""
    b = bbox.as_overpass()
    amenity_regex = "|".join(RETAIL_AMENITIES)
    return f"""
[out:json][timeout:60];
(
  node["shop"]({b});
  way["shop"]({b});
  node["amenity"~"^({amenity_regex})$"]({b});
  way["amenity"~"^({amenity_regex})$"]({b});
);
out center tags;
""".strip()


@dataclass
class OverpassElement:
    osm_type: str
    osm_id: int
    lat: float
    lon: float
    tags: dict

    @property
    def name(self) -> str | None:
        return self.tags.get("name")

    @property
    def osm_shop_type(self) -> str | None:
        """Canonical "key=value" used by the size-mapping table."""
        if "shop" in self.tags:
            return f"shop={self.tags['shop']}"
        if "amenity" in self.tags:
            return f"amenity={self.tags['amenity']}"
        return None

    @property
    def address(self) -> str | None:
        parts = [
            self.tags.get("addr:housenumber"),
            self.tags.get("addr:street"),
            self.tags.get("addr:suburb"),
            self.tags.get("addr:city"),
            self.tags.get("addr:postcode"),
        ]
        joined = ", ".join(p for p in parts if p)
        return joined or None


def fetch_elements(bbox: BBox | None = None, *, timeout: int = 90) -> list[OverpassElement]:
    settings = get_settings()
    bbox = bbox or settings.bbox
    query = build_overpass_query(bbox)
    logger.info("Querying Overpass for %s ...", settings.area_name)
    # Overpass returns 406 without an identifying User-Agent.
    headers = {"User-Agent": "PJP-BeatPlan-Prototype/0.1 (outlet ingestion)"}
    resp = requests.post(
        settings.overpass_url, data={"data": query}, headers=headers, timeout=timeout
    )
    resp.raise_for_status()
    data = resp.json()

    elements: list[OverpassElement] = []
    for el in data.get("elements", []):
        # Nodes carry lat/lon directly; ways carry a computed "center".
        if el.get("type") == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:
            center = el.get("center") or {}
            lat, lon = center.get("lat"), center.get("lon")
        if lat is None or lon is None:
            continue
        elements.append(
            OverpassElement(
                osm_type=el["type"],
                osm_id=el["id"],
                lat=float(lat),
                lon=float(lon),
                tags=el.get("tags", {}) or {},
            )
        )
    logger.info("Overpass returned %d usable outlet elements", len(elements))
    return elements


def upsert_outlets(session: Session, elements: list[OverpassElement]) -> tuple[int, int]:
    """Insert new outlets / update descriptive fields of existing ones.

    Tiering fields are left untouched here — they are populated by the tiering
    engine so that manual overrides survive a re-ingest. Returns (inserted, updated).
    """
    inserted = updated = 0
    for el in elements:
        existing = session.scalar(
            select(Outlet).where(Outlet.osm_type == el.osm_type, Outlet.osm_id == el.osm_id)
        )
        if existing is None:
            session.add(
                Outlet(
                    osm_type=el.osm_type,
                    osm_id=el.osm_id,
                    source="OSM",
                    name=el.name,
                    osm_shop_type=el.osm_shop_type,
                    address=el.address,
                    latitude=el.lat,
                    longitude=el.lon,
                    status=OutletStatus.Active,
                )
            )
            inserted += 1
        else:
            # Refresh descriptive fields only.
            existing.name = el.name
            existing.osm_shop_type = el.osm_shop_type
            existing.address = el.address
            existing.latitude = el.lat
            existing.longitude = el.lon
            updated += 1
    return inserted, updated
