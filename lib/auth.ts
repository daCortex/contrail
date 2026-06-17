// Lightweight signed-token auth for "Log in with IFC".
//
// IFC is a Discourse forum with no OAuth for third parties, so ownership is
// proven the community-standard way: the user drops a one-time code into their
// public IFC profile, we read the profile JSON and confirm it. On success we
// issue a signed session token (stored in an httpOnly cookie). All tokens are
// HMAC-signed with AUTH_SECRET — no DB needed for sessions.

import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || process.env.IF_API_KEY || "contrail-dev-secret";
export const SESSION_COOKIE = "contrail_session";

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}
function hmac(data: string): string {
  return b64url(crypto.createHmac("sha256", SECRET).update(data).digest());
}

/** Sign an arbitrary payload object → "<payload>.<sig>". */
export function sign(payload: Record<string, unknown>): string {
  const body = b64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

/** Verify + decode a signed token; null if tampered or expired. */
export function verify<T = Record<string, unknown>>(token: string | undefined | null): T | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = hmac(body);
  // constant-time compare
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body)) as T & { exp?: number };
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface Session {
  username: string;
  userId: string;
}

const DAY = 24 * 60 * 60 * 1000;

export function makeChallengeToken(username: string, userId: string, code: string): string {
  return sign({ t: "challenge", username, userId, code, exp: Date.now() + 30 * 60 * 1000 });
}
export function readChallengeToken(
  token: string
): { username: string; userId: string; code: string } | null {
  const p = verify<{ t: string; username: string; userId: string; code: string }>(token);
  return p && p.t === "challenge"
    ? { username: p.username, userId: p.userId, code: p.code }
    : null;
}

export function makeSessionToken(s: Session): string {
  return sign({ t: "session", username: s.username, userId: s.userId, exp: Date.now() + 60 * DAY });
}
export function readSessionToken(token: string | undefined): Session | null {
  const p = verify<{ t: string; username: string; userId: string }>(token);
  return p && p.t === "session" ? { username: p.username, userId: p.userId } : null;
}

/** A short, human-friendly verification code. */
export function makeCode(): string {
  return "contrail-" + crypto.randomBytes(4).toString("hex");
}
