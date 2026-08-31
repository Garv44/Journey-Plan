import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { INK, ACCENT, MUTE, BG } from "../theme.js";
import { OUTLETS, DEPOT, haversine, pathKm, R2 } from "../data/outlets.js";
import { markerEl, liveEl } from "../components/shopMarker.js";

// Free vector basemap — OpenFreeMap "positron" style (OpenStreetMap data).
// No API key, no Google Maps: https://openfreemap.org
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// B3 — Map view. Outlets as animated shop markers on their real Dadar streets,
// the planned route (dashed) and the GPS track (solid) stitched from stamps,
// plus a collapsible next-stop sheet.
export default function MapView({ visits, onOpenOutlet }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);

  const v = (id) => visits[id] || { status: "pending" };

  // Derived data for markers + routes + chips.
  const stops = OUTLETS.map((o, i) => ({
    num: String(i + 1).padStart(2, "0"),
    name: o.name,
    lat: o.lat,
    lng: o.lng,
    status: v(o.id).status,
  }));
  const visited = OUTLETS.filter((o) => v(o.id).fix).map((o) => ({ ...v(o.id).fix, name: o.name }));
  const actualPath = [DEPOT, ...visited];
  const live = visited.length ? visited[visited.length - 1] : DEPOT;
  const actualKm = R2(pathKm(actualPath)).toFixed(2);
  const plannedKm = R2(pathKm([DEPOT, ...OUTLETS.map((o) => ({ lat: o.lat, lng: o.lng }))])).toFixed(2);

  const next = OUTLETS.find((o) => v(o.id).status === "pending") || OUTLETS[0];
  const nextNum = String(OUTLETS.indexOf(next) + 1).padStart(2, "0");
  const nextKm = R2(haversine(live, { lat: next.lat, lng: next.lng })).toFixed(2) + " km";

  // --- boot the map once; markers/routes are drawn in the effect below ---
  useEffect(() => {
    const el = hostRef.current;
    if (!el || mapRef.current) return;

    let map;
    try {
      map = new maplibregl.Map({
        container: el,
        style: STYLE_URL,
        center: [72.8435, 19.0215],
        zoom: 14.2,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch (e) {
      setFailed(true);
      return;
    }
    mapRef.current = map;
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "top-right");
    map.on("error", (e) => {
      const msg = e && e.error && e.error.message ? e.error.message : "";
      if (/style|fetch|load/i.test(msg)) setFailed(true);
    });
    // Ready as soon as the instance exists: HTML markers and camera moves work
    // without the basemap style/tiles, so outlets render even when tiles are
    // slow or the CDN is unreachable (route lines wait for the style — below).
    setMapReady(true);

    let ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => mapRef.current && mapRef.current.resize());
      ro.observe(el);
    }
    return () => {
      ro && ro.disconnect();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // --- draw markers + routes whenever the map is ready or data changes ---
  useEffect(() => {
    const m = mapRef.current;
    if (!mapReady || !m) return;

    const path = actualPath.map((p) => [p.lng, p.lat]);
    const planned = stops.map((s) => [s.lng, s.lat]);
    const nextStop = stops.find((s) => s.status === "pending");

    // 1) Markers + live dot — independent of the basemap style being loaded.
    markersRef.current.forEach((mk) => mk.remove());
    markersRef.current = stops.map((s, i) => {
      const outlet = OUTLETS[i];
      const el = markerEl(s, i, nextStop && nextStop.num === s.num);
      el.addEventListener("click", () => onOpenOutlet && onOpenOutlet(outlet.id));
      return new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([s.lng, s.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 16, closeButton: false }).setHTML(
            '<div style="font:600 12px/1.35 Archivo,sans-serif;color:#201e1d">' +
              s.name +
              '</div><div style="font:600 8.5px/1.4 Archivo,monospace;letter-spacing:.1em;text-transform:uppercase;color:' +
              (s.status === "skipped" ? "#ec3013" : "#8a8582") +
              ';margin-top:4px">' +
              (s.status === "done" ? "Visited" : s.status === "skipped" ? "Skipped" : "Pending") +
              " · stop " +
              s.num +
              "</div>"
          )
        )
        .addTo(m);
    });
    if (live) {
      markersRef.current.push(
        new maplibregl.Marker({ element: liveEl() }).setLngLat([live.lng, live.lat]).addTo(m)
      );
    }

    // 2) Fit to all points — a camera move, also style-independent.
    const all = planned.concat(path);
    if (all.length) {
      const b = all.reduce((acc, c) => acc.extend(c), new maplibregl.LngLatBounds(all[0], all[0]));
      const fit = () => {
        m.resize();
        m.fitBounds(b, { padding: { top: 96, bottom: 168, left: 40, right: 40 }, animate: false, maxZoom: 15 });
      };
      fit();
      setTimeout(fit, 140);
    }

    // 3) Route lines ARE style layers, so they need the style loaded. Draw now
    //    if ready, else once it becomes ready — never block markers on this.
    const feature = (coords) => ({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} });
    const setLine = (id, coords, paint) => {
      if (coords.length < 2) {
        if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", "none");
        return;
      }
      if (m.getSource(id)) {
        m.getSource(id).setData(feature(coords));
        m.setLayoutProperty(id, "visibility", "visible");
      } else {
        m.addSource(id, { type: "geojson", data: feature(coords) });
        m.addLayer({ id, type: "line", source: id, layout: { "line-cap": "butt", "line-join": "round" }, paint });
      }
    };
    const drawLines = () => {
      if (!mapRef.current) return;
      setLine("planned-route", planned, { "line-color": INK, "line-width": 1.6, "line-opacity": 0.45, "line-dasharray": [2, 2.4] });
      setLine("gps-track", path, { "line-color": INK, "line-width": 4 });
    };

    if (m.isStyleLoaded()) {
      drawLines();
      return;
    }
    const onData = () => {
      if (m.isStyleLoaded()) {
        m.off("styledata", onData);
        drawLines();
      }
    };
    m.on("styledata", onData);
    return () => m.off("styledata", onData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, visits]);

  return (
    <div style={{ position: "relative", height: "100%", minHeight: 520, background: "#dedbd8" }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />

      {/* chips */}
      <div
        style={{
          position: "absolute",
          top: 44,
          left: 16,
          display: "flex",
          gap: 6,
          pointerEvents: "none",
          zIndex: 600,
        }}
      >
        <Chip bg={BG} border={INK} color={INK}>Travelled {actualKm} km</Chip>
        <Chip bg={INK} border={INK} color={BG}>Planned {plannedKm} km</Chip>
      </div>
      <div
        style={{
          position: "absolute",
          top: 76,
          left: 16,
          background: BG,
          border: "1px solid #d6d3d1",
          padding: "5px 7px",
          font: "400 8.5px/1 'Archivo', monospace",
          letterSpacing: ".04em",
          color: "#6b6663",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          zIndex: 600,
        }}
      >
        Dashed = plan · solid = GPS track · shop = outlet
      </div>

      {failed && (
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: 16,
            zIndex: 600,
            background: BG,
            border: "1px solid " + INK,
            padding: "5px 7px",
            font: "400 8.5px/1 'Archivo', monospace",
            letterSpacing: ".04em",
            color: "#6b6663",
          }}
        >
          Basemap offline · route and shops only
        </div>
      )}

      {/* next-stop sheet */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: BG,
          borderTop: "2px solid " + INK,
          zIndex: 600,
        }}
      >
        <div
          onClick={() => setSheetOpen((s) => !s)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{
                font: "600 9px/1 'Archivo', monospace",
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: ACCENT,
              }}
            >
              Next stop · {nextNum}
            </span>
            <span style={{ font: "600 15px/1.2 'Archivo', sans-serif", color: INK }}>
              {next.name}
            </span>
          </div>
          <span style={{ font: "600 11px/1 'Archivo', monospace", color: "#4a4644" }}>
            {sheetOpen ? "▼" : "▲"}
          </span>
        </div>

        {sheetOpen && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                borderTop: "1px solid #d6d3d1",
              }}
            >
              <SheetStat label="Distance" value={nextKm} border />
              <SheetStat label="ETA" value={next.eta} border />
              <SheetStat label="Tier" value={"Tier " + next.tier} />
            </div>
            <div
              style={{
                padding: "12px 16px 16px",
                display: "flex",
                gap: 10,
                borderTop: "1px solid #d6d3d1",
              }}
            >
              <button
                onClick={() => onOpenOutlet && onOpenOutlet(next.id)}
                className="btn btn-primary"
                style={{ flex: 1, minHeight: 44, justifyContent: "flex-start", textAlign: "left" }}
              >
                Open visit
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, minHeight: 44, justifyContent: "flex-start", textAlign: "left" }}
              >
                Navigate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ children, bg, border, color }) {
  return (
    <div
      style={{
        background: bg,
        border: "1px solid " + border,
        padding: "6px 8px",
        font: "600 9px/1 'Archivo', monospace",
        letterSpacing: ".1em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

function SheetStat({ label, value, border }) {
  return (
    <div style={{ padding: "10px 14px", borderRight: border ? "1px solid #d6d3d1" : "none" }}>
      <div
        style={{
          font: "600 9px/1 'Archivo', monospace",
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: MUTE,
        }}
      >
        {label}
      </div>
      <div style={{ font: "600 15px/1.2 'Archivo', sans-serif", marginTop: 4, color: INK }}>
        {value}
      </div>
    </div>
  );
}
