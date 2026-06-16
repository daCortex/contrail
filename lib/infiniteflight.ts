// Infinite Flight Live API v2 client — server-side only.
// Auth: Authorization: Bearer <IF_API_KEY>  (free via the IF Connect program).
// Base: https://api.infiniteflight.com/public/v2
//
// The API wraps payloads as { errorCode, result }. errorCode 0 = OK.

const BASE = "https://api.infiniteflight.com/public/v2";

export const ifConfigured = !!process.env.IF_API_KEY;

async function ifFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const key = process.env.IF_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.result ?? json) as T;
  } catch {
    return null;
  }
}

export interface IfUser {
  userId: string;
  userName: string | null;
  discourseUsername: string | null;
  grade: number | null;
  flightTime: number | null; // minutes
  onlineFlights: number | null;
  landingCount: number | null;
  violations: number | null;
  atcOperations: number | null;
  atcRank: number | null;
  xp: number | null;
  virtualOrganization: string | null;
}

/** Resolve an IFC (Discourse) username → IF user record (incl. userId + stats). */
export async function lookupUserByIfc(ifcUsername: string): Promise<IfUser | null> {
  const result = await ifFetch<IfUser[]>("/users", {
    method: "POST",
    body: JSON.stringify({ discourseNames: [ifcUsername.replace(/^@/, "").trim()] }),
  });
  return result?.[0] ?? null;
}

export interface IfFlight {
  id: string;
  created: string; // ISO timestamp
  callsign: string | null;
  server: string | null;
  totalTime: number | null; // minutes
  landingCount: number | null;
  originAirport: string | null; // ICAO
  destinationAirport: string | null; // ICAO
  aircraftId: string | null;
  liveryId: string | null;
  dayTime?: number | null;
  nightTime?: number | null;
  fuelUsedKg?: number | null;
}

interface FlightsPage {
  data?: IfFlight[];
  totalPages?: number;
  totalCount?: number;
}

/** One page of a user's logbook (10 flights, most recent first). */
export async function getUserFlightsPage(userId: string, page = 1): Promise<FlightsPage> {
  return (await ifFetch<FlightsPage>(`/users/${userId}/flights?page=${page}`)) ?? {};
}

export interface LogbookResult {
  flights: IfFlight[];
  totalCount: number;
  totalPages: number;
  pagesPulled: number;
}

/** Pull up to `maxPages` of a user's logbook, fetching pages concurrently. */
export async function getUserFlights(userId: string, maxPages = 12): Promise<LogbookResult> {
  const first = await getUserFlightsPage(userId, 1);
  const totalPages = first.totalPages ?? 1;
  const totalCount = first.totalCount ?? first.data?.length ?? 0;
  const pages = Math.min(totalPages, maxPages);

  const flights = [...(first.data ?? [])];
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) => getUserFlightsPage(userId, i + 2))
    );
    for (const p of rest) flights.push(...(p.data ?? []));
  }
  return { flights, totalCount, totalPages, pagesPulled: pages };
}

// liveryId → aircraft/livery names. Catalogue rarely changes; cache per instance.
export interface IfLivery {
  id: string;
  aircraftID: string;
  aircraftName: string;
  liveryName: string;
}

let liveryCache: Map<string, IfLivery> | null = null;
let aircraftCache: Map<string, string> | null = null; // aircraftID → aircraftName

async function loadLiveries() {
  if (liveryCache && aircraftCache) return;
  const list = (await ifFetch<IfLivery[]>("/aircraft/liveries")) ?? [];
  const byLivery = new Map<string, IfLivery>();
  const byAircraft = new Map<string, string>();
  for (const l of list) {
    byLivery.set(l.id, l);
    if (!byAircraft.has(l.aircraftID)) byAircraft.set(l.aircraftID, l.aircraftName);
  }
  if (list.length) {
    liveryCache = byLivery;
    aircraftCache = byAircraft;
  }
}

export async function getLiveryMap(): Promise<Map<string, IfLivery>> {
  await loadLiveries();
  return liveryCache ?? new Map();
}

/**
 * Resolve a flight's aircraft + livery names. Tries the livery catalogue
 * first, then the aircraft-id map (covers liveries dropped from the
 * catalogue). Returns nulls for retired aircraft with no current entry.
 */
export async function resolveAircraft(
  liveryId: string | null,
  aircraftId: string | null
): Promise<{ aircraftName: string | null; liveryName: string | null }> {
  await loadLiveries();
  const liv = liveryId ? liveryCache?.get(liveryId) : undefined;
  if (liv) return { aircraftName: liv.aircraftName, liveryName: liv.liveryName };
  const byAc = aircraftCache;
  const name =
    (aircraftId && byAc?.get(aircraftId)) || (liveryId && byAc?.get(liveryId)) || null;
  return { aircraftName: name, liveryName: null };
}
