// Profile bio — the author-supplied part of a profile (description + ongoing
// challenges). Without a backend it lives in localStorage for the owner and
// travels inside the share link (base64) so others can see it.

export interface Challenge {
  id: string;
  title: string;
  ifcUrl: string; // link to the IFC forum thread
  description: string;
}

export interface ProfileBio {
  description: string;
  challenges: Challenge[];
}

export const EMPTY_BIO: ProfileBio = { description: "", challenges: [] };

const key = (username: string) => `contrail.bio.${username.toLowerCase()}`;

export function loadBio(username: string): ProfileBio | null {
  if (typeof window === "undefined" || !username) return null;
  try {
    const raw = window.localStorage.getItem(key(username));
    return raw ? (JSON.parse(raw) as ProfileBio) : null;
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
  !!b && (b.description.trim() !== "" || b.challenges.length > 0);

/** URL-safe base64 encode/decode (handles unicode). */
export function encodeBio(bio: ProfileBio): string {
  if (!hasContent(bio)) return "";
  try {
    const json = JSON.stringify(bio);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function decodeBio(str: string): ProfileBio | null {
  if (!str) return null;
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json) as ProfileBio;
    if (!parsed || typeof parsed.description !== "string" || !Array.isArray(parsed.challenges))
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export function bioHasContent(b: ProfileBio | null): boolean {
  return hasContent(b);
}

/** Only allow http(s) links, and prefer IFC ones. */
export function safeUrl(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
    return null;
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
  description: string;
  challenges: Challenge[];
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

/** Fetch a profile's stored bio + claim status from the DB (null if none/no DB). */
export async function fetchRemoteProfile(username: string): Promise<RemoteProfile | null> {
  try {
    const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
    const json = await res.json();
    if (!json?.profile) return null;
    return {
      description: json.profile.description || "",
      challenges: json.profile.challenges || [],
      claimed: !!json.profile.claimed,
    };
  } catch {
    return null;
  }
}

/** Push derived stats (for leaderboards). Fire-and-forget; ignores failures. */
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

/** Save the bio to the DB. Returns the (possibly new) edit token, or throws. */
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
      description: input.bio.description,
      challenges: input.bio.challenges,
      token,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Could not save profile.");
  if (json.token) saveToken(input.username, json.token);
  return json.token;
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
