import { useState } from "react";
import { INK, ACCENT, MUTE, LINE, BG, tierStyle } from "../theme.js";
import { fixFor } from "../data/outlets.js";

// B2 — Outlet Visit. Opens over the app when a stop is tapped. Check In stamps
// GPS + time and unlocks the order form; Check Out writes a "done" record back;
// Mark as skipped writes a "skipped" record with a reason. Both close the sheet.
const REASONS = [
  "Outlet closed",
  "Customer unavailable",
  "Outlet relocated",
  "Access blocked / road closed",
  "Ran out of time",
];

const CI_TIME = "11:42 AM"; // stamped at check-in (prototype clock)

export default function OutletVisit({ outlet, visit, visitNum, totalStops, onClose, onCheckOut, onConfirmSkip }) {
  const t = tierStyle(outlet.tier);

  // Transient form state, seeded from any existing record for this outlet.
  const [ci, setCi] = useState(visit && visit.ci ? visit.ci : null);
  const [fix, setFix] = useState(visit && visit.fix ? visit.fix : null);
  const [order, setOrder] = useState(visit && visit.order ? visit.order : null); // "yes" | "no" | null
  const [value, setValue] = useState(visit && visit.value ? visit.value : "");
  const [notes, setNotes] = useState(visit && visit.notes ? visit.notes : "");
  const [photo, setPhoto] = useState(!!(visit && visit.photo));
  const [skipping, setSkipping] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  const checkedIn = !!ci;
  const ciCoords = fix ? fix.lat.toFixed(5) + ", " + fix.lng.toFixed(5) : "—";

  const checkIn = () => {
    setCi(CI_TIME);
    setFix(fixFor(outlet));
  };
  const checkOut = () => {
    if (!checkedIn) return;
    onCheckOut(outlet.id, {
      status: "done",
      ci: ci || CI_TIME,
      order: order || "no",
      value: order === "yes" ? value : "",
      notes,
      photo,
      fix: fix || fixFor(outlet),
    });
  };
  const confirmSkip = () => {
    onConfirmSkip(outlet.id, {
      status: "skipped",
      reason: reason.toLowerCase(),
      ci: CI_TIME,
      fix: fixFor(outlet),
    });
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: BG, display: "flex", flexDirection: "column", zIndex: 5 }}>
      {/* header */}
      <div style={{ padding: "58px 16px 14px", borderBottom: "2px solid " + INK, flex: "none" }}>
        <div onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", minHeight: 32 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5"><path d="M15 5l-7 7 7 7" /></svg>
          <span style={mono(ACCENT)}>Stop {String(visitNum).padStart(2, "0")} of {totalStops}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
          <h2 style={{ margin: 0, font: "600 21px/1.15 'Archivo', sans-serif", letterSpacing: "-.01em", color: INK, flex: 1 }}>
            {outlet.name}
          </h2>
          <span style={{ font: "600 10px/1 'Archivo', monospace", letterSpacing: ".1em", padding: "5px 6px", background: t.bg, color: t.fg, flex: "none" }}>
            {t.label}
          </span>
        </div>
        <p style={{ margin: "6px 0 0", font: "400 12.5px/1.4 'Archivo', sans-serif", color: "#6b6663" }}>{outlet.addr}</p>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: "auto" }} className="phone-scroll">
        {!checkedIn ? (
          <div style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid " + LINE, marginBottom: 18 }}>
              <Cell label="Planned" value={outlet.eta} border />
              <Cell label="Last order" value={outlet.last} />
            </div>
            <button onClick={checkIn} className="btn btn-primary" style={{ width: "100%", minHeight: 64, fontSize: 17, justifyContent: "flex-start", textAlign: "left" }}>
              Check in
            </button>
            <p style={{ margin: "10px 0 0", font: "400 11px/1.5 'Archivo', sans-serif", color: MUTE }}>
              Captures GPS coordinates and timestamp. Works offline — the visit queues locally.
            </p>

            <div style={{ height: 1, background: LINE, margin: "20px 0 14px" }} />
            <div onClick={() => setSkipping((s) => !s)} style={{ ...mono(ACCENT), cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>
              Mark as skipped
            </div>
            {skipping && (
              <div style={{ border: "1px solid " + INK, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={label}>Reason code</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="input" style={{ width: "100%", minHeight: 44 }}>
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
                <button onClick={confirmSkip} className="btn btn-primary" style={{ minHeight: 44, justifyContent: "flex-start", textAlign: "left" }}>
                  Confirm skip
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ background: INK, color: BG, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 9px/1 'Archivo', monospace", letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.65 }}>Checked in</span>
                <span style={{ font: "600 15px/1 'Archivo', sans-serif" }}>{ci} · GPS stamped</span>
              </div>
              <span style={{ font: "600 9px/1 'Archivo', monospace", letterSpacing: ".1em", textTransform: "uppercase", color: ACCENT }}>{ciCoords}</span>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <span style={label}>Order placed?</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid " + INK }}>
                  <div onClick={() => setOrder("yes")} style={toggle(order === "yes", true)}>Yes</div>
                  <div onClick={() => { setOrder("no"); setValue(""); }} style={toggle(order === "no", false)}>No</div>
                </div>
              </div>
              {order === "yes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <span style={label}>Order value (₹)</span>
                  <input value={value} onChange={(e) => setValue(e.target.value)} className="input" placeholder="0" style={{ width: "100%", minHeight: 48, font: "600 17px/1 'Archivo', sans-serif" }} />
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <span style={label}>Shelf photo</span>
                <div onClick={() => setPhoto((p) => !p)} style={{ border: "1px dashed " + INK, padding: 18, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", minHeight: 44, background: photo ? "#eceae7" : BG }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2"><path d="M3 8h4l2-3h6l2 3h4v12H3z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  <span style={{ font: "600 12px/1 'Archivo', sans-serif", color: INK }}>{photo ? "1 photo attached · retake" : "Capture shelf photo"}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                <span style={label}>Notes</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" placeholder="Competitor activity, stock issues, requests…" style={{ width: "100%", minHeight: 78, resize: "none", font: "400 13px/1.5 'Archivo', sans-serif" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* footer */}
      <div style={{ padding: "12px 16px 38px", borderTop: "2px solid " + INK, flex: "none", background: BG }}>
        <button onClick={checkOut} className="btn btn-primary" style={{ width: "100%", minHeight: 52, justifyContent: "flex-start", textAlign: "left", opacity: checkedIn ? 1 : 0.45, pointerEvents: checkedIn ? "auto" : "none" }}>
          Check out
        </button>
      </div>
    </div>
  );
}

function Cell({ label: l, value, border }) {
  return (
    <div style={{ padding: "11px 13px", borderRight: border ? "1px solid " + LINE : "none" }}>
      <div style={{ font: "600 9px/1 'Archivo', monospace", letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>{l}</div>
      <div style={{ font: "600 14px/1.2 'Archivo', sans-serif", marginTop: 4, color: INK }}>{value}</div>
    </div>
  );
}

const label = { font: "600 9px/1 'Archivo', monospace", letterSpacing: ".12em", textTransform: "uppercase", color: "#4a4644" };
const mono = (color) => ({ font: "600 11px/1 'Archivo', monospace", letterSpacing: ".1em", textTransform: "uppercase", color });
const toggle = (active, left) => ({
  padding: 13,
  textAlign: "left",
  cursor: "pointer",
  background: active ? INK : BG,
  color: active ? BG : INK,
  font: "600 13px/1 'Archivo', sans-serif",
  borderRight: left ? "1px solid " + INK : "none",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
});
