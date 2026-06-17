import { NextResponse } from "next/server";
import { readChallengeToken, makeSessionToken, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pull the fields a user might paste a code into.
async function profileText(username: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://community.infiniteflight.com/u/${encodeURIComponent(username)}.json`,
      { cache: "no-store", headers: { "User-Agent": "Contrail/1.0" } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const u = json?.user ?? {};
    return [u.bio_raw, u.name, u.location, u.website_name, u.website, u.title]
      .filter(Boolean)
      .join(" \n ")
      .toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let token = "";
  try {
    token = ((await req.json())?.token ?? "").toString();
  } catch {
    /* ignore */
  }
  const challenge = readChallengeToken(token);
  if (!challenge) {
    return NextResponse.json({ error: "Your verification expired. Start again." }, { status: 400 });
  }

  const text = await profileText(challenge.username);
  if (text === null) {
    return NextResponse.json(
      { error: "Couldn't read your IFC profile. Make sure it's public and try again." },
      { status: 502 }
    );
  }
  if (!text.includes(challenge.code.toLowerCase())) {
    return NextResponse.json(
      { error: "Code not found in your IFC profile yet. Add it, save, then verify." },
      { status: 401 }
    );
  }

  const session = makeSessionToken({ username: challenge.username, userId: challenge.userId });
  const res = NextResponse.json({
    ok: true,
    username: challenge.username,
    userId: challenge.userId,
  });
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 24 * 60 * 60,
  });
  return res;
}
