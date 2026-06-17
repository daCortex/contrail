import { NextResponse } from "next/server";
import { ifConfigured, lookupUserByIfc } from "@/lib/infiniteflight";
import { makeChallengeToken, makeCode } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!ifConfigured) {
    return NextResponse.json({ error: "Infinite Flight API is not configured." }, { status: 503 });
  }
  let username = "";
  try {
    username = ((await req.json())?.username ?? "").toString().replace(/^@/, "").trim();
  } catch {
    /* ignore */
  }
  if (!username) return NextResponse.json({ error: "Enter your IFC username." }, { status: 400 });

  const user = await lookupUserByIfc(username);
  if (!user) {
    return NextResponse.json(
      { error: `No Infinite Flight account found for "${username}".` },
      { status: 404 }
    );
  }

  const code = makeCode();
  const display = user.discourseUsername || user.userName || username;
  const token = makeChallengeToken(display, user.userId, code);
  return NextResponse.json({
    token,
    code,
    username: display,
    profileUrl: `https://community.infiniteflight.com/u/${encodeURIComponent(display)}/preferences/profile`,
  });
}
