"use client";

import { useCallback, useEffect, useState } from "react";

export interface Session {
  username: string;
  userId: string;
}

export interface StartResult {
  token: string;
  code: string;
  username: string;
  profileUrl: string;
}

export async function startLogin(username: string): Promise<StartResult> {
  const res = await fetch("/api/auth/ifc/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Could not start login.");
  return json as StartResult;
}

export async function verifyLogin(token: string): Promise<Session> {
  const res = await fetch("/api/auth/ifc/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || "Verification failed.");
  return { username: json.username, userId: json.userId };
}

export async function fetchSession(): Promise<Session | null> {
  try {
    const res = await fetch("/api/auth/session");
    const json = await res.json();
    return (json?.session as Session) ?? null;
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    /* ignore */
  }
}

/** Read the current session (null while loading / signed out). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const s = await fetchSession();
    setSession(s);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, ready, refresh, setSession };
}
