// Public profile data: an editable bio (description, tagline, home base,
// favourite aircraft, accent theme, social links) plus auto-pushed challenge
// summaries. Persisted to the DB (and mirrored to localStorage + share link).

export interface ProfileLinks {
  discord?: string;
  youtube?: string;
  twitch?: string;
  website?: string;
}

export interface ProfileBio {
  description: string;
  tagline: string;
  homeAirport: string;
  favoriteAircraft: string;
  accent: string; // theme id
  links: ProfileLinks;
}

export const EMPTY_BIO: ProfileBio = {
  description: "",
  tagline: "",
  homeAirport: "",
  favoriteAircraft: "",
  accent: "cyan",
  links: {},
};

/** A challenge summary shown publicly (computed from the owner's tracked challenge). */
export interface PublicChallenge {
  name: string;
  goalType: string;
  goalTarget: number;
  value: number;
  flights: number;
  countries: number;
  distanceKm: number;
  ifcUrl: string;
  note: string;
}

function normalizeBio(b: Partial<ProfileBio> | null | undefined): ProfileBio {
  return {
    description: b?.description ?? "",
    tagline: b?.tagline ?? "",
    homeAirport: b?.homeAirport ?? "",
    favoriteAircraft: b?.favoriteAircraft ?? "",
    accent: b?.accent ?? "cyan",
    links: b?.links ?? {},
  };
}

const key = (username: string) => `contrail.bio.${username.toLowerCase()}`;

export function loadBio(username: string): ProfileBio | null {
  if (typeof window === "undefined" || !username) return null;
  try {
    const raw = window.localStorage.getItem(key(username));
    return raw ? normalizeBio(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveBio(username: string, bio: ProfileBio) {
  try {
    window.localStorage.setItem(key(username), JSON.stringify(bio));
  } catch {
    /* ignore */
  }
}

const hasContent = (b: ProfileBio | null) =>
  !!b &&
  (b.description.trim() !== "" ||
    b.tagline.trim() !== "" ||
    b.homeAirport.trim() !== "" ||
    b.favoriteAircraft.trim() !== "" ||
    Object.values(b.links || {}).some((v) => (v || "").trim() !== ""));

export function bioHasContent(b: ProfileBio | null): boolean {
  return hasContent(b);
}

/** URL-safe base64 encode/decode (handles unicode). */
export function encodeBio(bio: ProfileBio): string {
  if (!hasContent(bio)) return "";
  try {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(bio))));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function decodeBio(str: string): ProfileBio | null {
  if (!str) return null;
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(decodeURIComponent(escape(atob(b64))));
    if (!parsed || typeof parsed.description !== "string") return null;
    return normalizeBio(parsed);
  } catch {
    return null;
  }
}

/** Only allow http(s) links. */
export function safeUrl(url: string): string | null {
  const u = (url || "").trim();
  if (!u) return null;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/* ---- Remote (Neon) profile API ---- */

export interface ProfileStatsInput {
  grade: number | null;
  flights: number;
  minutes: number;
  distanceKm: number;
  countries: number;
  airports: number;
  aircraftTypes: number;
  landings: number;
}

export interface RemoteProfile {
  bio: ProfileBio;
  challenges: PublicChallenge[];
  claimed: boolean;
}

const tokenKey = (username: string) => `contrail.token.${username.toLowerCase()}`;

export function loadToken(username: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(tokenKey(username));
  } catch {
    return null;
  }
}
export function saveToken(username: string, token: string) {
  try {
    window.localStorage.setItem(tokenKey(username), token);
  } catch {
    /* ignore */
  }
}

export async function fetchRemoteProfile(username: string): Promise<RemoteProfile | null> {
  try {
    const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
    const json = await res.json();
    if (!json?.profile) return null;
    return {
      bio: normalizeBio(json.profile.bio),
      challenges: (json.profile.challenges as PublicChallenge[]) || [],
      claimed: !!json.profile.claimed,
    };
  } catch {
    return null;
  }
}

export async function syncRemoteStats(input: {
  username: string;
  displayName: string;
  userId: string;
  stats: ProfileStatsInput;
}): Promise<void> {
  try {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "stats", ...input }),
    });
  } catch {
    /* ignore */
  }
}

/** Save the editable bio to the DB. Returns the (possibly new) edit token. */
export async function saveRemoteBio(input: {
  username: string;
  displayName: string;
  userId: string;
  bio: ProfileBio;
}): Promise<string> {
  const token = loadToken(input.username);
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "bio",
      username: input.username,
      displayName: input.displayName,
      userId: input.userId,
      bio: input.bio,
      token,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Could not save profile.");
  if (json.token) saveToken(input.username, json.token);
  return json.token;
}

/** Push public challenge summaries to the profile (owner must be logged in). */
export async function syncRemoteChallenges(input: {
  username: string;
  displayName: string;
  userId: string;
  challenges: PublicChallenge[];
}): Promise<void> {
  try {
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "challenges", ...input }),
    });
  } catch {
    /* ignore */
  }
}

export interface LeaderRow {
  username: string;
  displayName: string;
  grade: number | null;
  value: number;
}

export async function fetchLeaderboard(metric: string): Promise<LeaderRow[]> {
  try {
    const res = await fetch(`/api/leaderboard?metric=${encodeURIComponent(metric)}`);
    const json = await res.json();
    return (json?.rows as LeaderRow[]) || [];
  } catch {
    return [];
  }
}
