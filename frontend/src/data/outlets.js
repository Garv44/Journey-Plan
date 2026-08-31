// Sample beat data for the Dadar prototype — placeholder outlet names on real
// Dadar streets, with real coordinates. Ported from the Claude Design page state.
// In a later phase this comes from the backend Outlet Master (tiering module).

export const OUTLETS = [
  { id: 1,  name: "Shree Ganesh Provision Stores", tier: "A", addr: "Ranade Rd, Dadar West",        eta: "9:20 AM",  last: "₹18,400", lat: 19.02320, lng: 72.84080 },
  { id: 2,  name: "Kohinoor Super Market",          tier: "A", addr: "Gokhale Rd North, Dadar West", eta: "9:55 AM",  last: "₹32,100", lat: 19.02640, lng: 72.84250 },
  { id: 3,  name: "Anand Kirana & General",         tier: "B", addr: "Shivaji Park Rd No. 5",        eta: "10:30 AM", last: "₹7,250",  lat: 19.02880, lng: 72.83660 },
  { id: 4,  name: "New Maharashtra Stores",         tier: "B", addr: "Kabutarkhana, Dadar West",     eta: "11:05 AM", last: "₹9,900",  lat: 19.02460, lng: 72.83790 },
  { id: 5,  name: "Sai Krupa Departmental",         tier: "C", addr: "Senapati Bapat Marg",          eta: "11:40 AM", last: "₹3,150",  lat: 19.01960, lng: 72.83930 },
  { id: 6,  name: "Dadar Fresh Mart",               tier: "A", addr: "Tilak Bridge Rd",              eta: "12:15 PM", last: "₹27,600", lat: 19.01840, lng: 72.84450 },
  { id: 7,  name: "Balaji Traders",                 tier: "C", addr: "Naigaon Cross Rd",             eta: "2:00 PM",  last: "₹2,480",  lat: 19.01620, lng: 72.84870 },
  { id: 8,  name: "Laxmi Stores",                   tier: "B", addr: "Hindu Colony Lane 3",          eta: "2:35 PM",  last: "₹11,050", lat: 19.02090, lng: 72.85040 },
  { id: 9,  name: "Vaibhav Super Shoppe",           tier: "A", addr: "Dr Ambedkar Rd",               eta: "3:10 PM",  last: "₹21,700", lat: 19.02510, lng: 72.84930 },
  { id: 10, name: "Om Sai Provisions",              tier: "C", addr: "Matunga Rd Station Rd",        eta: "3:45 PM",  last: "₹4,320",  lat: 19.02840, lng: 72.84660 },
];

export const DEPOT = { name: "Depot · Dadar TT", lat: 19.01480, lng: 72.84200 };

// Seeded visit statuses so the plan and map open populated, exactly like the
// design: first two visited, third skipped, the rest pending.
export const SEED_VISITS = {
  1: { status: "done",    ci: "9:18 AM",  order: "yes", value: "14,250", fix: fixFor(OUTLETS[0]) },
  2: { status: "done",    ci: "9:58 AM",  order: "no",  value: "",       fix: fixFor(OUTLETS[1]) },
  3: { status: "skipped", ci: "10:31 AM", reason: "outlet closed",       fix: fixFor(OUTLETS[2]) },
};

// --- geo helpers ---
// Function declarations (hoisted) so SEED_VISITS above can call fixFor -> R6
// during module evaluation without hitting a temporal-dead-zone error.
function R6(n) { return Math.round(n * 1e6) / 1e6; }
function R2(n) { return Math.round(n * 100) / 100; }

// A GPS fix at check-in: outlet coords plus a deterministic few-metres offset,
// as a real device would record.
export function fixFor(o) {
  return {
    lat: R6(o.lat + (((o.id * 37) % 13) - 6) / 60000),
    lng: R6(o.lng + (((o.id * 53) % 11) - 5) / 60000),
  };
}

export function haversine(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

export function pathKm(pts) {
  let t = 0;
  for (let i = 1; i < pts.length; i++) t += haversine(pts[i - 1], pts[i]);
  return t;
}

export { R2, R6 };
