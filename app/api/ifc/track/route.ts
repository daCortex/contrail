import { NextResponse } from "next/server";
import {
  ifConfigured,
  lookupUserByIfc,
  findLiveFlight,
  findLiveByCallsign,
} from "@/lib/infiniteflight";
import { buildLivePayload } from "@/lib/live-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!ifConfigured) {
    return NextResponse.json({ error: "Infinite Flight API is not configured." }, { status: 503 });
  }

  let query = "";
  try {
    const body = await req.json();
    query = (body?.query ?? "").toString().trim();
  } catch {
    /* ignore */
  }
  if (!query) return NextResponse.json({ error: "Enter a username or callsign." }, { status: 400 });

  // 1) Callsign match (a live flight using this exact callsign) — most useful for tracking.
  const byCallsign = await findLiveByCallsign(query);
  if (byCallsign) {
    return NextResponse.json({
      subject: {
        type: "callsign",
        query,
        callsign: byCallsign.callsign,
        username: byCallsign.username,
        userId: byCallsign.userId,
      },
      live: await buildLivePayload(byCallsign),
    });
  }

  // 2) Username → resolve to a user, then check if they're airborne.
  const user = await lookupUserByIfc(query);
  if (user) {
    const hit = await findLiveFlight(user.userId);
    return NextResponse.json({
      subject: {
        type: "username",
        query,
        username: user.discourseUsername || user.userName || query,
        userId: user.userId,
      },
      live: hit ? await buildLivePayload(hit) : null,
    });
  }

  return NextResponse.json(
    { error: `No Infinite Flight user or live callsign found for "${query}".` },
    { status: 404 }
  );
}
