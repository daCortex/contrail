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
