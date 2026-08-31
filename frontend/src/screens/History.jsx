import { useState } from "react";
import { INK, ACCENT, MUTE, LINE, BG } from "../theme.js";

// B4 — History. Week strip to pick a day, then that day's visit records with
// time, status and order value. (Sample data, as in the design.)

const DAYS = [
  ["Mon", 11], ["Tue", 12], ["Wed", 13], ["Thu", 14],
  ["Fri", 15], ["Sat", 16], ["Mon", 17],
];

const TODAY = {
  label: "Today · 17 Aug",
  total: "₹14,250 booked",
  rows: [
    { time: "9:18",  name: "Shree Ganesh Provision Stores", status: "Completed · order placed", value: "₹14,250", skip: false },
    { time: "9:58",  name: "Kohinoor Super Market",         status: "Completed · no order",     value: "—",       skip: false },
    { time: "10:31", name: "Anand Kirana & General",        status: "Skipped · outlet closed",  value: "—",       skip: true },
  ],
};

const PREV = {
  label: "Sat 16 Aug",
  total: "₹48,900 booked",
  rows: [
    { time: "9:12",  name: "Gurukrupa Stores",     status: "Completed · order placed",        value: "₹19,600", skip: false },
    { time: "9:52",  name: "Sharda Provision",      status: "Completed · order placed",        value: "₹8,900",  skip: false },
    { time: "10:40", name: "Jai Hind Super Mart",   status: "Completed · order placed",        value: "₹20,400", skip: false },
    { time: "11:26", name: "Shivam Kirana",         status: "Skipped · customer unavailable",  value: "—",       skip: true },
    { time: "12:05", name: "Ratna Departmental",    status: "Completed · no order",            value: "—",       skip: false },
  ],
};

export default function History() {
  const [day, setDay] = useState(17);
  const data = day === 17 ? TODAY : PREV;

  return (
    <div>
      {/* week strip */}
      <div style={{ display: "flex", borderBottom: "2px solid " + INK }}>
        {DAYS.map(([dow, num]) => {
          const active = num === day;
          return (
            <div
              key={num}
              onClick={() => setDay(num)}
              style={{
                flex: 1,
                padding: "10px 0 12px",
                textAlign: "center",
                cursor: "pointer",
                background: active ? INK : "transparent",
                borderRight: "1px solid " + LINE,
                minHeight: 44,
              }}
            >
              <div
                style={{
                  font: "600 9px/1 'Archivo', monospace",
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: active ? "rgba(243,242,242,.7)" : MUTE,
                }}
              >
                {dow}
              </div>
              <div
                style={{
                  font: "600 16px/1.1 'Archivo', sans-serif",
                  marginTop: 5,
                  color: active ? BG : INK,
                }}
              >
                {num}
              </div>
            </div>
          );
        })}
      </div>

      {/* day summary */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid " + LINE,
          background: "#e8e6e4",
        }}
      >
        <span style={mono("#4a4644")}>{data.label}</span>
        <span style={mono(ACCENT)}>{data.total}</span>
      </div>

      {/* records */}
      {data.rows.map((h, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 12,
            padding: "13px 16px",
            borderBottom: "1px solid " + LINE,
            alignItems: "center",
          }}
        >
          <span style={{ font: "600 11px/1 'Archivo', monospace", color: "#6b6663", width: 52, flex: "none" }}>
            {h.time}
          </span>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{
                font: "600 14px/1.2 'Archivo', sans-serif",
                color: INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {h.name}
            </span>
            <span
              style={{
                font: "600 9px/1 'Archivo', monospace",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: h.skip ? ACCENT : MUTE,
              }}
            >
              {h.status}
            </span>
          </div>
          <span style={{ font: "600 14px/1 'Archivo', sans-serif", color: INK }}>{h.value}</span>
        </div>
      ))}
    </div>
  );
}

const mono = (color) => ({
  font: "600 10px/1 'Archivo', monospace",
  letterSpacing: ".12em",
  textTransform: "uppercase",
  color,
});
