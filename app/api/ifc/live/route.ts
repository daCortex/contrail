import { NextResponse } from "next/server";
import {
  ifConfigured,
  findLiveFlight,
  getFlightRoute,
  getFlightTrack,
  resolveAircraft,
} from "@/lib/infiniteflight";
import { resolveAirport } from "@/lib/if-airports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!ifConfigured) {
    return NextResponse.json({ error: "Infinite Flight API is not configured." }, { status: 503 });
  }

  let userId = "";
  try {
    const body = await req.json();
    userId = (body?.userId ?? "").toString();
  } catch {
    /* ignore */
  }
  if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });

  const hit = await findLiveFlight(userId);
  if (!hit) return NextResponse.json({ live: null });

  const [ac, route, track] = await Promise.all([
    resolveAircraft(hit.liveryId, hit.aircraftId),
    getFlightRoute(hit.sessionId, hit.flightId),
    getFlightTrack(hit.sessionId, hit.flightId),
  ]);

  const originAp = route?.origin ? resolveAirport(route.origin) : null;
  const destAp = route?.destination ? resolveAirport(route.destination) : null;

  return NextResponse.json({
    live: {
      callsign: hit.callsign,
      username: hit.username,
      sessionName: hit.sessionName,
      aircraft: ac.aircraftName,
      livery: ac.liveryName,
      virtualOrganization: hit.virtualOrganization,
      position: {
        lat: hit.latitude,
        lon: hit.longitude,
        altitude: Math.round(hit.altitude),
        speed: Math.round(hit.speed),
        heading: Math.round(hit.heading),
        track: Math.round(hit.track),
      },
      origin: route?.origin ?? null,
      destination: route?.destination ?? null,
      originCity: originAp?.city ?? null,
      destinationCity: destAp?.city ?? null,
      plannedPath: route?.plannedPath ?? [],
      track,
    },
  });
}
