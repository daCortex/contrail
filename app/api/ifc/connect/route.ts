import { NextResponse } from "next/server";
import { ifConfigured, lookupUserByIfc } from "@/lib/infiniteflight";
import { IFCProfile } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!ifConfigured) {
    return NextResponse.json(
      { error: "Infinite Flight API is not configured on the server." },
      { status: 503 }
    );
  }

  let username = "";
  try {
    const body = await req.json();
    username = (body?.username ?? "").toString();
  } catch {
    /* ignore */
  }
  if (!username.trim()) {
    return NextResponse.json({ error: "Enter your IFC username." }, { status: 400 });
  }

  const user = await lookupUserByIfc(username);
  if (!user) {
    return NextResponse.json(
      { error: `No Infinite Flight account found for “${username}”.` },
      { status: 404 }
    );
  }

  const profile: IFCProfile = {
    userId: user.userId,
    username: user.discourseUsername || user.userName || username.replace(/^@/, ""),
    grade: user.grade,
    flightTimeMin: user.flightTime,
    onlineFlights: user.onlineFlights,
    landingCount: user.landingCount,
    violations: user.violations,
    atcOperations: user.atcOperations,
    atcRank: user.atcRank,
    xp: user.xp,
    virtualOrganization: user.virtualOrganization,
  };

  return NextResponse.json({ profile });
}
