import { Flight } from "./types";
import { ResolvedPoint, resolvePoint } from "./airports";

export interface RankedItem {
  key: string;
  label: string;
  sub?: string;
  count: number;
  cc?: string;
}

export interface Stats {
  totalFlights: number;
  totalDistanceKm: number;
  totalMinutes: number;
  uniqueAirports: number;
  uniqueCountries: number;
  uniqueAircraft: number;
  uniqueAirlines: number;
  uniqueRoutes: number;
  longestFlight: Flight | null;
  shortestFlight: Flight | null;
  topAircraft: RankedItem[];
  topAirlines: RankedItem[];
  topDepartures: RankedItem[];
  topArrivals: RankedItem[];
  topAirports: RankedItem[]; // combined visits
  topRoutes: RankedItem[];
  topCountries: RankedItem[];
  topCabins: RankedItem[];
  byYear: { year: string; count: number; minutes: number; km: number }[];
  visitedAirports: ResolvedPoint[];
  earthCircuits: number; // total distance / earth circumference
  toMoon: number; // fraction of distance to the Moon
}

function rank(
  counts: Map<string, { count: number; label: string; sub?: string; cc?: string }>,
  limit = 8
): RankedItem[] {
  return [...counts.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

const EARTH_CIRCUMFERENCE_KM = 40075;
const DISTANCE_TO_MOON_KM = 384400;

export function computeStats(flights: Flight[]): Stats {
  const aircraft = new Map<string, { count: number; label: string }>();
  const airlines = new Map<string, { count: number; label: string }>();
  const departures = new Map<string, { count: number; label: string; sub?: string; cc?: string }>();
  const arrivals = new Map<string, { count: number; label: string; sub?: string; cc?: string }>();
  const airportVisits = new Map<string, { count: number; label: string; sub?: string; cc?: string }>();
  const routes = new Map<string, { count: number; label: string }>();
  const countries = new Map<string, { count: number; label: string; cc?: string }>();
  const cabins = new Map<string, { count: number; label: string }>();
  const yearMap = new Map<string, { count: number; minutes: number; km: number }>();
  const visitedSet = new Map<string, ResolvedPoint>();

  let totalDistanceKm = 0;
  let totalMinutes = 0;
  let longest: Flight | null = null;
  let shortest: Flight | null = null;

  const bump = (
    m: Map<string, { count: number; label: string; sub?: string; cc?: string }>,
    key: string,
    label: string,
    extra?: { sub?: string; cc?: string }
  ) => {
    const cur = m.get(key);
    if (cur) cur.count += 1;
    else m.set(key, { count: 1, label, ...extra });
  };

  for (const f of flights) {
    totalDistanceKm += f.distanceKm || 0;
    totalMinutes += f.durationMin || 0;
    if (!longest || f.distanceKm > longest.distanceKm) longest = f;
    if (!shortest || f.distanceKm < shortest.distanceKm) shortest = f;

    if (f.aircraft) bump(aircraft, f.aircraft, f.aircraft);
    if (f.airline) bump(airlines, f.airline, f.airline);
    if (f.cabin) bump(cabins, f.cabin, f.cabin);

    const ap = resolvePoint(f.from, f.fromGeo);
    const bp = resolvePoint(f.to, f.toGeo);

    const depLabel = ap ? `${ap.code} · ${ap.city}` : f.from;
    const arrLabel = bp ? `${bp.code} · ${bp.city}` : f.to;
    if (f.from) bump(departures, f.from.toUpperCase(), depLabel, { sub: ap?.country, cc: ap?.cc });
    if (f.to) bump(arrivals, f.to.toUpperCase(), arrLabel, { sub: bp?.country, cc: bp?.cc });
    if (f.from) bump(airportVisits, f.from.toUpperCase(), depLabel, { sub: ap?.country, cc: ap?.cc });
    if (f.to) bump(airportVisits, f.to.toUpperCase(), arrLabel, { sub: bp?.country, cc: bp?.cc });

    if (f.from && f.to) {
      const rk = `${f.from.toUpperCase()}-${f.to.toUpperCase()}`;
      bump(routes, rk, `${f.from.toUpperCase()} → ${f.to.toUpperCase()}`);
    }

    if (ap) {
      bump(countries, ap.cc, ap.country, { cc: ap.cc });
      visitedSet.set(ap.code, ap);
    }
    if (bp) {
      bump(countries, bp.cc, bp.country, { cc: bp.cc });
      visitedSet.set(bp.code, bp);
    }

    const year = (f.date || "").slice(0, 4) || "—";
    const y = yearMap.get(year) || { count: 0, minutes: 0, km: 0 };
    y.count += 1;
    y.minutes += f.durationMin || 0;
    y.km += f.distanceKm || 0;
    yearMap.set(year, y);
  }

  const byYear = [...yearMap.entries()]
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year.localeCompare(b.year));

  return {
    totalFlights: flights.length,
    totalDistanceKm,
    totalMinutes,
    uniqueAirports: airportVisits.size,
    uniqueCountries: countries.size,
    uniqueAircraft: aircraft.size,
    uniqueAirlines: airlines.size,
    uniqueRoutes: routes.size,
    longestFlight: longest,
    shortestFlight: shortest,
    topAircraft: rank(aircraft),
    topAirlines: rank(airlines),
    topDepartures: rank(departures),
    topArrivals: rank(arrivals),
    topAirports: rank(airportVisits),
    topRoutes: rank(routes),
    topCountries: rank(countries, 12),
    topCabins: rank(cabins, 4),
    byYear,
    visitedAirports: [...visitedSet.values()],
    earthCircuits: totalDistanceKm / EARTH_CIRCUMFERENCE_KM,
    toMoon: totalDistanceKm / DISTANCE_TO_MOON_KM,
  };
}

export function fmtDuration(min: number): string {
  if (!min) return "0m";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function fmtDurationLong(min: number): string {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = Math.round(min % 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(" ");
}

export function fmtKm(km: number): string {
  return Math.round(km).toLocaleString();
}
