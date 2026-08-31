import { INK, ACCENT, BG } from "../theme.js";

// Header inside the phone: screen kicker/title on the left, tappable sync chip
// on the right showing the offline-first queue state.
export default function TopBar({ kicker, title, offline, onToggleSync }) {
  return (
    <div
      style={{
        padding: "58px 16px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "2px solid " + INK,
        background: BG,
        flex: "none",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            font: "600 9px/1 'Archivo', monospace",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#8a8582",
          }}
        >
          {kicker}
        </span>
        <span
          style={{
            font: "600 17px/1.1 'Archivo', sans-serif",
            letterSpacing: "-.01em",
            color: INK,
          }}
        >
          {title}
        </span>
      </div>
      <div
        onClick={onToggleSync}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          border: "1px solid #d6d3d1",
          cursor: "pointer",
          minHeight: 32,
        }}
      >
        <span
          style={{ width: 8, height: 8, background: offline ? ACCENT : INK }}
        />
        <span
          style={{
            font: "600 9px/1 'Archivo', monospace",
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#4a4644",
          }}
        >
          {offline ? "Offline · 3 queued" : "Synced"}
        </span>
      </div>
    </div>
  );
}
