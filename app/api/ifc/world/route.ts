import { NextResponse } from "next/server";
import { ifConfigured, getAllLiveFlights, getLiveryMap } from "@/lib/infiniteflight";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const r4 = (n: number) => Math.round(n * 10000) / 10000;

export async function GET() {
  if (!ifConfigured) {
    return NextResponse.json({ error: "Infinite Flight API is not configured." }, { status: 503 });
  }

  const [flights, liveries] = await Promise.all([getAllLiveFlights(), getLiveryMap()]);

  // Compact payload for the map markers.
  const out = flights
    .filter((f) => Number.isFinite(f.latitude) && Number.isFinite(f.longitude))
    .map((f) => ({
      fid: f.flightId,
      sid: f.sessionId,
      uid: f.userId,
      cs: f.callsign || "",
      u: f.username || "",
      la: r4(f.latitude),
      lo: r4(f.longitude),
      h: Math.round(f.track || f.heading || 0),
      al: Math.round(f.altitude || 0),
      gs: Math.round(f.speed || 0),
      ac: (f.liveryId && liveries.get(f.liveryId)?.aircraftName) || "",
      sv: f.sessionName,
    }));

  // Per-server counts for the filter.
  const servers: Record<string, number> = {};
  for (const f of out) servers[f.sv] = (servers[f.sv] || 0) + 1;

  return NextResponse.json({ flights: out, total: out.length, servers });
}
