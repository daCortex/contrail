// FlightRadar24-style top-down aircraft marker for Leaflet. The silhouette
// points north at 0°; rotate by the flight's track/heading. Used by the live
// tracker and the global live map.

import type * as L from "leaflet";

// Material "flight" glyph — a clean top-view airliner pointing up.
const PLANE_PATH =
  "M22 16v-2l-8.5-5V3.5C13.5 2.67 12.83 2 12 2s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z";

export function planeSvg(opts: {
  heading: number;
  color?: string;
  size?: number;
  glow?: boolean;
}): string {
  const { heading, color = "#e9b864", size = 22, glow = false } = opts;
  const filter = glow
    ? "drop-shadow(0 0 4px rgba(56,214,224,0.9))"
    : "drop-shadow(0 0 1.5px rgba(0,0,0,0.7))";
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `style="transform:rotate(${heading}deg);filter:${filter};display:block">` +
    `<path fill="${color}" stroke="rgba(0,0,0,0.35)" stroke-width="0.5" d="${PLANE_PATH}"/></svg>`
  );
}

export function planeIcon(
  Lns: typeof L,
  opts: { heading: number; color?: string; size?: number; glow?: boolean }
): L.DivIcon {
  const size = opts.size ?? 22;
  return Lns.divIcon({
    className: "plane-marker",
    html: planeSvg(opts),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
