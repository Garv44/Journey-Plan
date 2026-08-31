// Shared palette — the Modernist mono scale with a single red accent.
export const INK = "#201e1d";
export const ACCENT = "#ec3013";
export const MUTE = "#8a8582";
export const LINE = "#d6d3d1";
export const BG = "#f3f2f2";
export const PAGE = "#e8e6e4";

// Tier chip styling (statuses use system ink / accent, not green/red — per the
// design assumptions, so tier and status stay legible on the mono palette).
export function tierStyle(t) {
  if (t === "A") return { bg: ACCENT, fg: "#fff", label: "TIER A" };
  if (t === "B") return { bg: INK, fg: BG, label: "TIER B" };
  return { bg: "#e0ddda", fg: INK, label: "TIER C" };
}
