// Great-circle geometry helpers for the route map and distance/stat math.

const R = 6371; // Earth radius, km
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export interface LatLon {
  lat: number;
  lon: number;
}

/** Haversine great-circle distance in km. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Sample points along the great-circle arc between two coordinates.
 * Returns segments split at the antimeridian so Leaflet polylines don't
 * smear a horizontal line across the whole map.
 */
export function greatCircleSegments(a: LatLon, b: LatLon, steps = 64): LatLon[][] {
  const lat1 = toRad(a.lat);
  const lon1 = toRad(a.lon);
  const lat2 = toRad(b.lat);
  const lon2 = toRad(b.lon);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );
  if (d === 0) return [[a, b]];

  const pts: LatLon[] = [];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lon = toDeg(Math.atan2(y, x));
    pts.push({ lat, lon });
  }

  // Split where longitude jumps across the antimeridian.
  const segments: LatLon[][] = [];
  let current: LatLon[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (Math.abs(pts[i].lon - pts[i - 1].lon) > 180) {
      segments.push(current);
      current = [];
    }
    current.push(pts[i]);
  }
  segments.push(current);
  return segments;
}

/**
 * Make a polyline's longitudes continuous (they may exceed ±180°) so a path
 * that crosses the antimeridian flows smoothly into the adjacent world copy
 * instead of jumping across the whole map. Leaflet (with worldCopyJump) renders
 * out-of-range longitudes correctly, so this is preferable to splitting for
 * lines that should look connected (e.g. a live flight's route to Australia).
 */
export function unwrapLongitudes(points: LatLon[]): LatLon[] {
  if (points.length === 0) return points;
  const out: LatLon[] = [{ lat: points[0].lat, lon: points[0].lon }];
  for (let i = 1; i < points.length; i++) {
    let lon = points[i].lon;
    const prev = out[i - 1].lon;
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push({ lat: points[i].lat, lon });
  }
  return out;
}

/**
 * Split a polyline of lat/lon points wherever consecutive longitudes jump more
 * than 180° (an antimeridian crossing), so Leaflet doesn't draw a stray line
 * straight across the whole map.
 */
export function splitAntimeridian(points: LatLon[]): LatLon[][] {
  if (points.length < 2) return [points];
  const segs: LatLon[][] = [];
  let cur: LatLon[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i].lon - points[i - 1].lon) > 180) {
      segs.push(cur);
      cur = [];
    }
    cur.push(points[i]);
  }
  segs.push(cur);
  return segs;
}
