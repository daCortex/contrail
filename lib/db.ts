// Persistence layer (Neon Postgres). Dormant until DATABASE_URL is set —
// the profile/leaderboard routes fall back to "not configured" without it.
//
// Stores one row per pilot: their editable bio (description + challenges) plus
// a cached snapshot of derived stats that power the leaderboards. Ownership of
// the bio is guarded by an edit token (claim-on-first-edit).

import { neon } from "@neondatabase/serverless";
import { Challenge } from "./profile";

export const dbConfigured = !!process.env.DATABASE_URL;

const sql = dbConfigured ? neon(process.env.DATABASE_URL!) : null;

export interface ProfileStats {
  grade: number | null;
  flights: number;
  minutes: number;
  distanceKm: number;
  countries: number;
  airports: number;
  aircraftTypes: number;
  landings: number;
}

export interface ProfileRow {
  username: string;
  displayName: string;
  userId: string;
  description: string;
  challenges: Challenge[];
  stats: ProfileStats;
  claimed: boolean;
  updatedAt: string;
}

let initPromise: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS profiles (
          username       text PRIMARY KEY,
          display_name   text NOT NULL,
          user_id        text NOT NULL,
          description    text NOT NULL DEFAULT '',
          challenges     jsonb NOT NULL DEFAULT '[]'::jsonb,
          grade          int,
          flights        int NOT NULL DEFAULT 0,
          minutes        int NOT NULL DEFAULT 0,
          distance_km    double precision NOT NULL DEFAULT 0,
          countries      int NOT NULL DEFAULT 0,
          airports       int NOT NULL DEFAULT 0,
          aircraft_types int NOT NULL DEFAULT 0,
          landings       int NOT NULL DEFAULT 0,
          edit_token     text,
          created_at     timestamptz NOT NULL DEFAULT now(),
          updated_at     timestamptz NOT NULL DEFAULT now()
        )`;
    })();
  }
  return initPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRow(r: any): ProfileRow {
  return {
    username: r.username,
    displayName: r.display_name,
    userId: r.user_id,
    description: r.description ?? "",
    challenges: Array.isArray(r.challenges) ? r.challenges : [],
    stats: {
      grade: r.grade,
      flights: r.flights ?? 0,
      minutes: r.minutes ?? 0,
      distanceKm: r.distance_km ?? 0,
      countries: r.countries ?? 0,
      airports: r.airports ?? 0,
      aircraftTypes: r.aircraft_types ?? 0,
      landings: r.landings ?? 0,
    },
    claimed: !!r.edit_token,
    updatedAt: r.updated_at,
  };
}

export async function getProfile(username: string): Promise<ProfileRow | null> {
  if (!sql) return null;
  await ensureSchema();
  const key = username.trim().toLowerCase();
  const rows = await sql`SELECT * FROM profiles WHERE username = ${key}`;
  return rows[0] ? toRow(rows[0]) : null;
}

/** Upsert the derived stats for a profile (no bio touch). Anyone viewing a
 * profile refreshes its leaderboard snapshot this way. */
export async function upsertStats(input: {
  username: string;
  displayName: string;
  userId: string;
  stats: ProfileStats;
}): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  const key = input.username.trim().toLowerCase();
  const s = input.stats;
  await sql`
    INSERT INTO profiles (username, display_name, user_id, grade, flights, minutes, distance_km, countries, airports, aircraft_types, landings, updated_at)
    VALUES (${key}, ${input.displayName}, ${input.userId}, ${s.grade}, ${s.flights}, ${s.minutes}, ${s.distanceKm}, ${s.countries}, ${s.airports}, ${s.aircraftTypes}, ${s.landings}, now())
    ON CONFLICT (username) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      user_id = EXCLUDED.user_id,
      grade = EXCLUDED.grade,
      flights = EXCLUDED.flights,
      minutes = EXCLUDED.minutes,
      distance_km = EXCLUDED.distance_km,
      countries = EXCLUDED.countries,
      airports = EXCLUDED.airports,
      aircraft_types = EXCLUDED.aircraft_types,
      landings = EXCLUDED.landings,
      updated_at = now()`;
}

export type SaveBioResult =
  | { ok: true; token: string; claimed: true }
  | { ok: false; reason: "forbidden" };

/** Save the bio. Claims the profile on first edit (returns a fresh token);
 * subsequent edits must present the matching token. */
export async function saveBio(input: {
  username: string;
  displayName: string;
  userId: string;
  description: string;
  challenges: Challenge[];
  token: string | null;
  newToken: string;
}): Promise<SaveBioResult> {
  if (!sql) return { ok: false, reason: "forbidden" };
  await ensureSchema();
  const key = input.username.trim().toLowerCase();
  const existing = await sql`SELECT edit_token FROM profiles WHERE username = ${key}`;
  const current: string | null = existing[0]?.edit_token ?? null;

  if (current && current !== input.token) {
    return { ok: false, reason: "forbidden" };
  }
  const token = current || input.newToken;
  const challengesJson = JSON.stringify(input.challenges);

  await sql`
    INSERT INTO profiles (username, display_name, user_id, description, challenges, edit_token, updated_at)
    VALUES (${key}, ${input.displayName}, ${input.userId}, ${input.description}, ${challengesJson}::jsonb, ${token}, now())
    ON CONFLICT (username) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      user_id = EXCLUDED.user_id,
      description = EXCLUDED.description,
      challenges = EXCLUDED.challenges,
      edit_token = ${token},
      updated_at = now()`;

  return { ok: true, token, claimed: true };
}

export type LeaderMetric =
  | "flights"
  | "minutes"
  | "distance_km"
  | "countries"
  | "airports"
  | "aircraft_types"
  | "landings";

const METRIC_COL: Record<LeaderMetric, string> = {
  flights: "flights",
  minutes: "minutes",
  distance_km: "distance_km",
  countries: "countries",
  airports: "airports",
  aircraft_types: "aircraft_types",
  landings: "landings",
};

export interface LeaderRow {
  username: string;
  displayName: string;
  grade: number | null;
  value: number;
}

export async function leaderboard(metric: LeaderMetric, limit = 50): Promise<LeaderRow[]> {
  if (!sql) return [];
  await ensureSchema();
  const col = METRIC_COL[metric] || "distance_km";
  // Column name is from a fixed whitelist above, safe to interpolate.
  const rows = await sql.query(
    `SELECT username, display_name, grade, ${col} AS value
     FROM profiles WHERE ${col} > 0
     ORDER BY ${col} DESC NULLS LAST LIMIT $1`,
    [limit]
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rows as any[]).map((r) => ({
    username: r.username,
    displayName: r.display_name,
    grade: r.grade,
    value: Number(r.value) || 0,
  }));
}
