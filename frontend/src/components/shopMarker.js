// DOM builders for the map markers — the animated little-shop marker per outlet
// and the live-location dot. Ported from the design's map-pane.jsx.

const SHOP_SVG = (bodyFill, awning, ink, shutter) => `
<svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
  <rect x="5" y="14" width="24" height="16" fill="${bodyFill}" stroke="${ink}" stroke-width="2"/>
  <rect x="11" y="20" width="7" height="10" fill="${shutter}" stroke="${ink}" stroke-width="2"/>
  <rect x="21" y="19" width="5" height="5" fill="${shutter}" stroke="${ink}" stroke-width="1.5"/>
  <g class="awn">
    <rect x="3" y="8" width="28" height="6" fill="${awning}" stroke="${ink}" stroke-width="2"/>
    <path d="M9 8v6M15 8v6M21 8v6M27 8v6" stroke="${ink}" stroke-width="1.25" opacity=".55"/>
  </g>
  <path d="M17 3v5" stroke="${ink}" stroke-width="2"/>
</svg>`;

export function markerEl(stop, i, isNext) {
  const done = stop.status === "done";
  const skip = stop.status === "skipped";
  const ink = "#201e1d";
  const bodyFill = done ? "#cfcbc7" : "#f3f2f2";
  const awning = skip ? "#ec3013" : done ? ink : "#f3f2f2";
  const shutter = done ? "#a9a5a2" : skip ? "#f6d8d2" : "#e8e6e4";

  const wrap = document.createElement("div");
  wrap.style.cssText =
    "width:44px;height:44px;display:flex;align-items:flex-end;justify-content:center;cursor:pointer";

  const shop = document.createElement("div");
  shop.style.cssText =
    "position:relative;width:34px;height:34px;transform-origin:50% 100%;" +
    "animation:shop-in .42s cubic-bezier(.2,1.3,.4,1) " +
    i * 55 +
    "ms both" +
    (stop.status === "pending"
      ? ",shop-bob 3.6s ease-in-out " + (600 + i * 140) + "ms infinite"
      : "");
  shop.innerHTML = SHOP_SVG(bodyFill, awning, ink, shutter);

  const badge = document.createElement("div");
  badge.textContent = stop.num;
  badge.style.cssText =
    "position:absolute;top:-9px;left:-7px;min-width:17px;height:15px;padding:0 2px;" +
    "display:flex;align-items:center;justify-content:center;background:" +
    (skip ? "#ec3013" : ink) +
    ";color:#f3f2f2;font:700 9px/1 Archivo,monospace;letter-spacing:.02em;border:1px solid " +
    ink;
  shop.appendChild(badge);

  if (isNext) {
    const ring = document.createElement("div");
    ring.style.cssText =
      "position:absolute;inset:-9px;border:2px solid #ec3013;animation:ring-pulse 1.9s ease-out infinite";
    shop.appendChild(ring);
  }
  if (done) {
    const tick = document.createElement("div");
    tick.style.cssText =
      "position:absolute;bottom:-2px;right:-6px;width:14px;height:14px;background:" +
      ink +
      ";border:1px solid " +
      ink +
      ";display:flex;align-items:center;justify-content:center";
    tick.innerHTML =
      '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f3f2f2" stroke-width="4"><path d="M4 13l5 5L20 7"/></svg>';
    shop.appendChild(tick);
  }

  wrap.appendChild(shop);
  return wrap;
}

export function liveEl() {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:relative;width:26px;height:26px;display:flex;align-items:center;justify-content:center";
  const ring = document.createElement("div");
  ring.style.cssText =
    "position:absolute;inset:0;background:#ec3013;opacity:.22;animation:live-pulse 1.8s ease-out infinite";
  const dot = document.createElement("div");
  dot.style.cssText =
    "width:11px;height:11px;background:#ec3013;border:2px solid #f3f2f2;position:relative";
  wrap.appendChild(ring);
  wrap.appendChild(dot);
  return wrap;
}
