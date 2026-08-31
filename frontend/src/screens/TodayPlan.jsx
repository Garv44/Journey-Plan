import { INK, ACCENT, MUTE, BG } from "../theme.js";
import { tierStyle } from "../theme.js";
import { OUTLETS, DEPOT, pathKm, R2 } from "../data/outlets.js";

// B1 — Today's Plan. Summary strip, progress, ordered stop cards (tier + status
// + GPS line), and the day's distance footer measured from GPS stamps.
export default function TodayPlan({ visits, onOpenOutlet, onEndDay }) {
  const v = (id) => visits[id] || { status: "pending" };
  const done = OUTLETS.filter((o) => v(o.id).status === "done").length;
  const skipped = OUTLETS.filter((o) => v(o.id).status === "skipped").length;
  const progressPct =
    Math.round(((done + skipped) / OUTLETS.length) * 100) + "%";

  // Distance travelled = haversine over the GPS stamps, not the planned route.
  const visited = OUTLETS.filter((o) => v(o.id).fix).map((o) => ({
    ...v(o.id).fix,
    name: o.name,
  }));
  const actualKm = pathKm([DEPOT, ...visited]);
  const plannedKm = pathKm([DEPOT, ...OUTLETS.map((o) => ({ lat: o.lat, lng: o.lng }))]);
  const deltaKm =
    (actualKm > plannedKm ? "+" : "−") +
    R2(Math.abs(actualKm - plannedKm)).toFixed(2) +
    " km vs plan";

  return (
    <div>
      {/* summary strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderBottom: "2px solid " + INK,
          background: INK,
          color: BG,
        }}
      >
        <Stat label="Stops" value={OUTLETS.length} border />
        <Stat label="Done" value={done} border />
        <Stat label="Est. end" value="5:40 PM" />
      </div>

      {/* progress bar */}
      <div style={{ height: 4, background: "#e0ddda" }}>
        <div style={{ height: 4, background: ACCENT, width: progressPct }} />
      </div>

      {/* stop cards */}
      {OUTLETS.map((o, i) => (
        <StopRow key={o.id} outlet={o} index={i} visit={v(o.id)} onOpen={() => onOpenOutlet(o.id)} />
      ))}

      {/* distance footer */}
      <div style={{ borderTop: "2px solid " + INK }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <Metric label="Distance travelled" value={R2(actualKm).toFixed(2) + " km"} border />
          <Metric label="Planned route" value={R2(plannedKm).toFixed(2) + " km"} />
        </div>
        <div
          style={{
            padding: "11px 16px",
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid #d6d3d1",
          }}
        >
          <span style={mono(ACCENT)}>{deltaKm}</span>
          <span style={mono(MUTE)}>{visited.length} of {OUTLETS.length} stops stamped</span>
        </div>
        <div style={{ padding: "14px 16px 18px" }}>
          <button
            onClick={onEndDay}
            className="btn btn-primary"
            style={{ width: "100%", minHeight: 48, justifyContent: "flex-start", textAlign: "left" }}
          >
            End the day
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "0 16px 18px",
          font: "400 11px/1.5 'Archivo', sans-serif",
          color: MUTE,
        }}
      >
        Plan published 6:00 AM · every check-in stamps GPS coordinates, and the
        day's distance is measured from those stamps, not the planned route
      </div>
    </div>
  );
}

function StopRow({ outlet, index, visit, onOpen }) {
  const t = tierStyle(outlet.tier);
  const st = visit.status;
  const bg = st === "pending" ? BG : st === "done" ? "#eceae7" : "#fbeae7";
  const dot = st === "done" ? INK : st === "skipped" ? ACCENT : "transparent";
  const dotBorder = st === "skipped" ? ACCENT : INK;
  const numColor = st === "pending" ? INK : MUTE;
  const statusColor = st === "done" ? MUTE : st === "skipped" ? ACCENT : INK;

  const statusLine =
    st === "done"
      ? "Completed " + (visit.ci || "") + (visit.order === "yes" ? " · ₹" + visit.value : " · no order")
      : st === "skipped"
      ? "Skipped · " + (visit.reason || "")
      : "Pending · ETA " + outlet.eta;

  const fixLine = visit.fix
    ? "GPS " + visit.fix.lat.toFixed(5) + ", " + visit.fix.lng.toFixed(5)
    : "Outlet " + outlet.lat.toFixed(5) + ", " + outlet.lng.toFixed(5) + " · not yet stamped";

  return (
    <div
      onClick={onOpen}
      style={{
        display: "flex",
        gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid #d6d3d1",
        cursor: "pointer",
        background: bg,
        minHeight: 44,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          width: 26,
          flex: "none",
        }}
      >
        <span style={{ font: "600 13px/1 'Archivo', monospace", color: numColor }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          style={{ width: 9, height: 9, background: dot, border: "1px solid " + dotBorder }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              font: "600 15px/1.2 'Archivo', sans-serif",
              color: INK,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {outlet.name}
          </span>
          <span
            style={{
              font: "600 9px/1 'Archivo', monospace",
              letterSpacing: ".1em",
              padding: "3px 5px",
              flex: "none",
              background: t.bg,
              color: t.fg,
            }}
          >
            {t.label}
          </span>
        </div>
        <span style={{ font: "400 12px/1.35 'Archivo', sans-serif", color: "#6b6663" }}>
          {outlet.addr}
        </span>
        <span
          style={{
            font: "600 9px/1 'Archivo', monospace",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: statusColor,
          }}
        >
          {statusLine}
        </span>
        <span
          style={{
            font: "400 9.5px/1 'Archivo', monospace",
            letterSpacing: ".03em",
            color: visit.fix ? "#6b6663" : "#a9a5a2",
          }}
        >
          {fixLine}
        </span>
      </div>

      <div
        style={{
          width: 40,
          height: 40,
          flex: "none",
          border: "1px solid " + INK,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2">
          <path d="M3 11l19-9-9 19-2-8-8-2z" />
        </svg>
      </div>
    </div>
  );
}

function Stat({ label, value, border }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRight: border ? "1px solid rgba(243,242,242,.25)" : "none",
      }}
    >
      <div
        style={{
          font: "600 9px/1 'Archivo', monospace",
          letterSpacing: ".12em",
          textTransform: "uppercase",
          opacity: 0.65,
        }}
      >
        {label}
      </div>
      <div style={{ font: "600 22px/1.1 'Archivo', sans-serif", marginTop: 5 }}>{value}</div>
    </div>
  );
}

function Metric({ label, value, border }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRight: border ? "1px solid #d6d3d1" : "none",
        borderBottom: "1px solid #d6d3d1",
      }}
    >
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
      <div style={{ font: "600 20px/1.1 'Archivo', sans-serif", marginTop: 5, color: INK }}>
        {value}
      </div>
    </div>
  );
}

const mono = (color) => ({
  font: "600 9px/1 'Archivo', monospace",
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color,
});
