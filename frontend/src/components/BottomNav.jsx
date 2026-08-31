import { INK, BG } from "../theme.js";

const TABS = [
  {
    key: "today",
    label: "Plan",
    icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  },
  {
    key: "map",
    label: "Map",
    icon: (
      <>
        <path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    key: "history",
    label: "History",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
  {
    key: "profile",
    label: "Profile",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
      </>
    ),
  },
];

export default function BottomNav({ tab, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        borderTop: "2px solid " + INK,
        background: BG,
        flex: "none",
        paddingBottom: 22,
      }}
    >
      {TABS.map((t) => {
        const active = tab === t.key;
        const col = active ? BG : INK;
        return (
          <div
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              padding: "9px 0 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
              minHeight: 52,
              background: active ? INK : "transparent",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={col}
              strokeWidth="2"
            >
              {t.icon}
            </svg>
            <span
              style={{
                font: "600 8.5px/1 'Archivo', monospace",
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: col,
              }}
            >
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
