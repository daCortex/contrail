// Client-side helpers for the Infinite Flight Community (IFC) integration.
// These call our own server routes, which in turn hit the IF Live API with
// the server-held API key. No data is synthesised — everything here is the
// pilot's real profile and logbook.

import { IFCProfile, NewFlight } from "./types";

export interface LatLon {
  lat: number;
  lon: number;
}

export interface LiveFlightData {
  callsign: string | null;
  username: string | null;
  sessionName: string;
  aircraft: string | null;
  livery: string | null;
  virtualOrganization: string | null;
  position: { lat: number; lon: number; altitude: number; speed: number; heading: number; track: number };
  origin: string | null;
  destination: string | null;
  originCity: string | null;
  destinationCity: string | null;
  plannedPath: LatLon[];
  track: LatLon[];
}

export interface TrackSubject {
  type: "username" | "callsign";
  query: string;
  username: string | null;
  userId: string;
  callsign?: string | null;
}

export interface TrackResult {
  subject: TrackSubject;
  live: LiveFlightData | null;
}

export interface WorldFlight {
  fid: string;
  sid: string;
  uid: string;
  cs: string; // callsign
  u: string; // username
  la: number;
  lo: number;
  h: number; // track/heading
  al: number; // altitude ft
  gs: number; // ground speed kt
  ac: string; // aircraft
  sv: string; // server
}

export interface WorldData {
  flights: WorldFlight[];
  total: number;
  servers: Record<string, number>;
}

/** Every active flight across all live sessions (for the global map). */
export async function fetchWorld(): Promise<WorldData> {
  const res = await fetch("/api/ifc/world");
  if (!res.ok) throw new Error("Could not load live flights.");
  const json = await res.json().catch(() => ({}));
  return {
    flights: (json.flights as WorldFlight[]) ?? [],
    total: json.total ?? 0,
    servers: json.servers ?? {},
  };
}

/** Resolve a username or callsign and return its subject + live flight (if airborne). */
export async function fetchTrack(query: string): Promise<TrackResult> {
  const res = await fetch("/api/ifc/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Could not find that user or callsign.");
  return json as TrackResult;
}

/** Check whether the pilot is flying right now; returns null if not airborne. */
export async function fetchLive(userId: string): Promise<LiveFlightData | null> {
  const res = await fetch("/api/ifc/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => ({}));
  return (json.live as LiveFlightData) ?? null;
}

/** Link an IFC username → real profile snapshot (grade, hours, landings…). */
export async function connectIFC(username: string): Promise<IFCProfile> {
  const res = await fetch("/api/ifc/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Could not connect to Infinite Flight.");
  return json.profile as IFCProfile;
}

export interface SyncResult {
  flights: NewFlight[];
  count: number;
  mapped: number; // how many have a mappable origin + destination
  totalCount: number; // total flights in the IF logbook
  pagesPulled: number;
}

/** Pull the pilot's real logbook flights (most recent first). */
export async function syncIFC(userId: string, maxPages = 12): Promise<SyncResult> {
  const res = await fetch("/api/ifc/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, maxPages }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Sync failed.");
  return {
    flights: (json.flights as NewFlight[]) ?? [],
    count: json.count ?? 0,
    mapped: json.mapped ?? 0,
    totalCount: json.totalCount ?? 0,
    pagesPulled: json.pagesPulled ?? 0,
  };
}
