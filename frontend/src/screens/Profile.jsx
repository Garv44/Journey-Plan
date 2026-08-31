import { useState } from "react";
import { INK, ACCENT, MUTE, LINE, BG } from "../theme.js";

// B5 — Profile. Rep identity, beat details, sync queue + Wi-Fi setting, log out.
export default function Profile({ repName, industry, offline, onSyncNow, onLogout }) {
  const [wifi, setWifi] = useState(true);
  const initials = repName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const queuedLine = offline ? "3 visits waiting · last sync 11:04 AM" : "All visits synced · 11:04 AM";

  return (
    <div>
      {/* identity */}
      <div style={{ padding: "20px 16px", borderBottom: "2px solid " + INK, display: "flex", gap: 14, alignItems: "center" }}>
        <div
          style={{
            width: 56, height: 56, background: INK, color: BG,
            display: "flex", alignItems: "center", justifyContent: "center",
            font: "600 20px/1 'Archivo', sans-serif", flex: "none",
          }}
        >
          {initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ font: "600 19px/1.1 'Archivo', sans-serif", color: INK }}>{repName}</span>
          <span style={{ font: "600 10px/1 'Archivo', monospace", letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>
            Field Sales Rep · ID FSR-2214
          </span>
        </div>
      </div>

      {/* beat details */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Row label="Beat assigned" value="DAD-04 · Dadar West" />
        <Row label="Outlets in beat" value="38 / 40 capacity" />
        <Row label="Industry" value={industry} />
        <Row label="Manager" value="R. Kulkarni · call" />
      </div>

      {/* sync */}
      <div style={{ padding: 16, borderBottom: "1px solid " + LINE }}>
        <div style={{ font: "600 10px/1 'Archivo', monospace", letterSpacing: ".12em", textTransform: "uppercase", color: MUTE, marginBottom: 12 }}>
          Sync
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 44 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ font: "600 13px/1 'Archivo', sans-serif", color: INK }}>Queued visits</span>
            <span style={{ font: "400 11px/1 'Archivo', sans-serif", color: "#6b6663" }}>{queuedLine}</span>
          </div>
          <button onClick={onSyncNow} className="btn btn-secondary" style={{ minHeight: 40, justifyContent: "flex-start", textAlign: "left" }}>
            Sync now
          </button>
        </div>
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            minHeight: 44, borderTop: "1px solid " + LINE, marginTop: 8, paddingTop: 8,
          }}
        >
          <span style={{ font: "600 13px/1 'Archivo', sans-serif", color: INK }}>Auto-sync on Wi-Fi only</span>
          <div
            onClick={() => setWifi((w) => !w)}
            style={{
              width: 46, height: 26, background: wifi ? INK : BG,
              border: "1px solid " + INK, display: "flex", alignItems: "center",
              padding: 2, cursor: "pointer", justifyContent: wifi ? "flex-end" : "flex-start",
            }}
          >
            <span style={{ width: 20, height: 20, background: wifi ? ACCENT : INK, display: "block" }} />
          </div>
        </div>
      </div>

      {/* log out */}
      <div style={{ padding: "16px 16px 28px" }}>
        <button onClick={onLogout} className="btn btn-ghost" style={{ minHeight: 44, color: ACCENT, justifyContent: "flex-start", textAlign: "left", padding: 0 }}>
          Log out
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid " + LINE }}>
      <span style={{ font: "400 13px/1 'Archivo', sans-serif", color: "#6b6663" }}>{label}</span>
      <span style={{ font: "600 13px/1 'Archivo', sans-serif", color: INK }}>{value}</span>
    </div>
  );
}
