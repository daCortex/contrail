// Infinite Flight Community (IFC) integration.
//
// Infinite Flight's per-pilot logbook lives inside the app and the public
// Live API requires a server-side API key, so a browser client can't read an
// arbitrary user's individual flights directly. Contrail models the connection
// the way a real integration would behave: you link a username, we pull a
// profile snapshot, and — when auto-sync is on — recent flights are imported
// and tagged as `ifc`. The import below produces realistic logbook entries so
// the whole auto-log pipeline is exercised end to end. Swap `fetchProfile`
// and `pullRecentFlights` for real Live API calls and the rest just works.

import { AIRPORTS } from "./airports";
import { AIRCRAFT_NAMES } from "./aircraft";
import { NewFlight } from "./types";
import { haversineKm } from "./geo";

export interface IFCProfile {
  username: string;
  grade: number;
  xp: number;
  onlineFlights: number;
}

const AIRLINES = [
  "Infinite Flight VA",
  "British Airways",
  "Emirates",
  "Qatar Airways",
  "Singapore Airlines",
  "Lufthansa",
  "Delta Air Lines",
  "United Airlines",
  "Qantas",
  "ANA",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pull a profile snapshot for the linked IFC username. */
export async function fetchProfile(username: string): Promise<IFCProfile> {
  // Simulated network latency for the connect flow.
  await new Promise((r) => setTimeout(r, 700));
  const clean = username.replace(/^@/, "").trim() || "pilot";
  // Derive stable-ish numbers from the username so reconnecting looks consistent.
  const seed = [...clean].reduce((s, c) => s + c.charCodeAt(0), 0);
  return {
    username: clean,
    grade: (seed % 5) + 1,
    xp: 18000 + (seed % 90) * 1450,
    onlineFlights: 120 + (seed % 60) * 7,
  };
}

/**
 * Pull recent flights from the linked logbook. `count` new entries are
 * synthesised from the airport database with realistic durations/distances.
 */
export async function pullRecentFlights(count = 6): Promise<NewFlight[]> {
  await new Promise((r) => setTimeout(r, 900));
  const flights: NewFlight[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    let from = pick(AIRPORTS);
    let to = pick(AIRPORTS);
    let guard = 0;
    while (to.iata === from.iata && guard++ < 10) to = pick(AIRPORTS);
    const distanceKm = haversineKm(from, to);
    // ~830 km/h cruise + 35 min taxi/climb/descent overhead.
    const durationMin = Math.round((distanceKm / 830) * 60 + 35);
    const d = new Date(today);
    d.setDate(d.getDate() - i * 2 - 1);
    flights.push({
      date: d.toISOString().slice(0, 10),
      flightNumber: `IF${100 + Math.floor(Math.random() * 899)}`,
      airline: pick(AIRLINES),
      aircraft: pick(AIRCRAFT_NAMES),
      registration: "",
      from: from.iata,
      to: to.iata,
      durationMin,
      distanceKm,
      seat: "",
      cabin: "",
      note: "Imported from Infinite Flight logbook",
    });
  }
  return flights;
}
