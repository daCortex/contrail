// Shared server helper: turn a raw live-flight hit into the enriched payload
// (aircraft name, filed route, flown track, resolved endpoint cities) used by
// both /api/ifc/live and /api/ifc/track.

import {
  LiveFlightHit,
  getFlightRoute,
  getFlightTrack,
  resolveAircraft,
} from "./infiniteflight";
import { resolveAirport } from "./if-airports";

export async function buildLivePayload(hit: LiveFlightHit) {
  const [ac, route, track] = await Promise.all([
    resolveAircraft(hit.liveryId, hit.aircraftId),
    getFlightRoute(hit.sessionId, hit.flightId),
    getFlightTrack(hit.sessionId, hit.flightId),
  ]);

  const originAp = route?.origin ? resolveAirport(route.origin) : null;
  const destAp = route?.destination ? resolveAirport(route.destination) : null;

  return {
    userId: hit.userId,
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
  };
}
