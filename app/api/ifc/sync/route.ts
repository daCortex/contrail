import { NextResponse } from "next/server";
import { ifConfigured, getUserFlights, resolveAircraft } from "@/lib/infiniteflight";
import { resolveAirport } from "@/lib/if-airports";
import { haversineKm, estimateDurationMin } from "@/lib/geo";
import { NewFlight } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!ifConfigured) {
    return NextResponse.json(
      { error: "Infinite Flight API is not configured on the server." },
      { status: 503 }
    );
  }

  let userId = "";
  let maxPages = 12;
  try {
    const body = await req.json();
    userId = (body?.userId ?? "").toString();
    if (typeof body?.maxPages === "number") maxPages = Math.min(Math.max(body.maxPages, 1), 50);
  } catch {
    /* ignore */
  }
  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const result = await getUserFlights(userId, maxPages);

  // Include every real flight: aircraft, time, and date are always present,
  // so totals/aircraft stats are complete. Origin/destination are only filed
  // on some flights — those additionally get coordinates and appear on the map.
  const flights: NewFlight[] = [];
  let mapped = 0;
  for (const f of result.flights) {
    const from = (f.originAirport || "").toUpperCase();
    const to = (f.destinationAirport || "").toUpperCase();
    const a = from ? resolveAirport(from) : null;
    const b = to ? resolveAirport(to) : null;
    const distanceKm =
      a && b ? haversineKm({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }) : 0;
    if (a && b) mapped++;

    const ac = await resolveAircraft(f.liveryId, f.aircraftId);

    flights.push({
      extId: f.id,
      date: (f.created || "").slice(0, 10),
      flightNumber: f.callsign?.trim() || "",
      airline: ac.liveryName || "",
      aircraft: ac.aircraftName || "",
      registration: "",
      from: a?.code || from,
      to: b?.code || to,
      fromGeo: a ? { lat: a.lat, lon: a.lon, cc: a.cc, city: a.city, country: a.country } : undefined,
      toGeo: b ? { lat: b.lat, lon: b.lon, cc: b.cc, city: b.city, country: b.country } : undefined,
      durationMin: Math.round(f.totalTime ?? 0) || estimateDurationMin(distanceKm),
      distanceKm,
      seat: "",
      cabin: "",
      note: f.server ? `${f.server} · Infinite Flight` : "Infinite Flight",
      fuelKg: f.fuelUsedKg != null ? Math.round(f.fuelUsedKg) : undefined,
      server: f.server || undefined,
      landings: f.landingCount ?? undefined,
    });
  }

  return NextResponse.json({
    flights,
    count: flights.length,
    mapped,
    totalCount: result.totalCount,
    pagesPulled: result.pagesPulled,
  });
}
