import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import {
  dbConfigured,
  getProfile,
  upsertStats,
  saveBio,
  saveChallenges,
  ProfileStats,
} from "@/lib/db";
import { ProfileBio, PublicChallenge } from "@/lib/profile";
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

  // Both bio + challenge edits authorize via the session or the claim token.
  const session = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  const authorized = !!session && session.username.toLowerCase() === username.toLowerCase();
  const token = (body.token as string) || null;

  if (mode === "bio") {
    const bioIn = (body.bio as Partial<ProfileBio>) || {};
    const bio: ProfileBio = {
      description: (bioIn.description || "").slice(0, 800),
      tagline: (bioIn.tagline || "").slice(0, 120),
      homeAirport: (bioIn.homeAirport || "").slice(0, 8),
      favoriteAircraft: (bioIn.favoriteAircraft || "").slice(0, 60),
      accent: (bioIn.accent || "cyan").slice(0, 16),
      links: bioIn.links || {},
    };
    const result = await saveBio({ username, displayName, userId, bio, token, newToken: randomUUID(), authorized });
    if (!result.ok) {
      return NextResponse.json(
        { error: "This profile is claimed by another device. Log in to edit it." },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true, token: result.token });
  }

  if (mode === "challenges") {
    const challenges = (Array.isArray(body.challenges) ? body.challenges : []) as PublicChallenge[];
    const result = await saveChallenges({ username, displayName, userId, challenges, token, newToken: randomUUID(), authorized });
    if (!result.ok) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    return NextResponse.json({ ok: true, token: result.token });
  }

  return NextResponse.json({ error: "Unknown mode." }, { status: 400 });
}
