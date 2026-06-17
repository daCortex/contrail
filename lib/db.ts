// Persistence layer (Neon Postgres). Dormant until DATABASE_URL is set.
//
// One row per pilot: editable bio (description, tagline, home base, favourite
// aircraft, accent theme, links), public challenge summaries, and a cached
// snapshot of derived stats for the leaderboards. Bio/challenge edits are
// guarded by an edit token (claim-on-first-edit) or a logged-in session.

import { neon } from "@neondatabase/serverless";
import { ProfileBio, ProfileLinks, PublicChallenge } from "./profile";

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
  bio: ProfileBio;
  challenges: PublicChallenge[];
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
      // Newer customization columns (added in place for existing tables).
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS home_airport text NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_aircraft text NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accent text NOT NULL DEFAULT 'cyan'`;
      await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS links jsonb NOT NULL DEFAULT '{}'::jsonb`;
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
    bio: {
      description: r.description ?? "",
      tagline: r.tagline ?? "",
      homeAirport: r.home_airport ?? "",
      favoriteAircraft: r.favorite_aircraft ?? "",
      accent: r.accent ?? "cyan",
      links: (r.links as ProfileLinks) ?? {},
    },
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

/** Upsert the derived stats for a profile (no bio touch). */
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

export type SaveResult = { ok: true; token: string } | { ok: false; reason: "forbidden" };

async function authorize(username: string, token: string | null, authorized: boolean) {
  const existing = await sql!`SELECT edit_token FROM profiles WHERE username = ${username}`;
  const current: string | null = existing[0]?.edit_token ?? null;
  if (!authorized && current && current !== token) return { ok: false as const };
  return { ok: true as const, token: current };
}

/** Save the editable bio. Claims the profile on first edit; later edits need
 * the token or a logged-in session. */
export async function saveBio(input: {
  username: string;
  displayName: string;
  userId: string;
  bio: ProfileBio;
  token: string | null;
  newToken: string;
  authorized?: boolean;
}): Promise<SaveResult> {
  if (!sql) return { ok: false, reason: "forbidden" };
  await ensureSchema();
  const key = input.username.trim().toLowerCase();
  const auth = await authorize(key, input.token, !!input.authorized);
  if (!auth.ok) return { ok: false, reason: "forbidden" };
  const token = auth.token || input.newToken;
  const b = input.bio;
  const linksJson = JSON.stringify(b.links || {});

  await sql`
    INSERT INTO profiles (username, display_name, user_id, description, tagline, home_airport, favorite_aircraft, accent, links, edit_token, updated_at)
    VALUES (${key}, ${input.displayName}, ${input.userId}, ${b.description}, ${b.tagline}, ${b.homeAirport}, ${b.favoriteAircraft}, ${b.accent}, ${linksJson}::jsonb, ${token}, now())
    ON CONFLICT (username) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      user_id = EXCLUDED.user_id,
      description = EXCLUDED.description,
      tagline = EXCLUDED.tagline,
      home_airport = EXCLUDED.home_airport,
      favorite_aircraft = EXCLUDED.favorite_aircraft,
      accent = EXCLUDED.accent,
      links = EXCLUDED.links,
      edit_token = ${token},
      updated_at = now()`;
  return { ok: true, token };
}

/** Save the public challenge summaries (same auth rules as the bio). */
export async function saveChallenges(input: {
  username: string;
  displayName: string;
  userId: string;
  challenges: PublicChallenge[];
  token: string | null;
  newToken: string;
  authorized?: boolean;
}): Promise<SaveResult> {
  if (!sql) return { ok: false, reason: "forbidden" };
  await ensureSchema();
  const key = input.username.trim().toLowerCase();
  const auth = await authorize(key, input.token, !!input.authorized);
  if (!auth.ok) return { ok: false, reason: "forbidden" };
  const token = auth.token || input.newToken;
  const json = JSON.stringify(input.challenges.slice(0, 30));
  await sql`
    INSERT INTO profiles (username, display_name, user_id, challenges, edit_token, updated_at)
    VALUES (${key}, ${input.displayName}, ${input.userId}, ${json}::jsonb, ${token}, now())
    ON CONFLICT (username) DO UPDATE SET
      challenges = EXCLUDED.challenges,
      edit_token = ${token},
      updated_at = now()`;
  return { ok: true, token };
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
