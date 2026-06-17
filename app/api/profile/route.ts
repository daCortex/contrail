import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import {
  dbConfigured,
  getProfile,
  upsertStats,
  saveBio,
  ProfileStats,
} from "@/lib/db";
import { Challenge } from "@/lib/profile";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!dbConfigured) return NextResponse.json({ profile: null, dbConfigured: false });
  const username = new URL(req.url).searchParams.get("username") || "";
  if (!username.trim()) return NextResponse.json({ error: "Missing username." }, { status: 400 });
  const profile = await getProfile(username);
  return NextResponse.json({ profile, dbConfigured: true });
}

export async function POST(req: Request) {
  if (!dbConfigured) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }

  const mode = (body.mode as string) || "stats";
  const username = (body.username as string)?.trim();
  const displayName = (body.displayName as string) || username || "";
  const userId = (body.userId as string) || "";
  if (!username) return NextResponse.json({ error: "Missing username." }, { status: 400 });

  if (mode === "stats") {
    const stats = (body.stats as ProfileStats) || null;
    if (!stats) return NextResponse.json({ error: "Missing stats." }, { status: 400 });
    await upsertStats({ username, displayName, userId, stats });
    return NextResponse.json({ ok: true });
  }

  if (mode === "bio") {
    const description = ((body.description as string) || "").slice(0, 800);
    const challenges = (Array.isArray(body.challenges) ? body.challenges : []) as Challenge[];
    const token = (body.token as string) || null;
    // Logged-in owner? (session username matches the target profile)
    const session = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
    const authorized = !!session && session.username.toLowerCase() === username.toLowerCase();
    const result = await saveBio({
      username,
      displayName,
      userId,
      description,
      challenges: challenges.slice(0, 20),
      token,
      newToken: randomUUID(),
      authorized,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: "This profile is claimed by another device. You can't edit it here." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true, token: result.token });
  }

  return NextResponse.json({ error: "Unknown mode." }, { status: 400 });
}
