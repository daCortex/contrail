// Resolved coordinates + country for a flight endpoint. Stored on the flight
// so the map/stats can place airports the curated client DB doesn't know
// (e.g. anything pulled from a real Infinite Flight logbook).
export interface AirportLite {
  lat: number;
  lon: number;
  cc: string; // ISO 3166-1 alpha-2
  city: string;
  country: string;
}

export interface Flight {
  id: string;
  date: string; // ISO yyyy-mm-dd
  flightNumber: string; // e.g. "BA286"
  airline: string;
  aircraft: string; // matches an AIRCRAFT name when possible
  registration: string; // tail number, optional
  from: string; // IATA/ICAO code
  to: string; // IATA/ICAO code
  fromGeo?: AirportLite; // attached when resolved (IFC imports, enriched manual)
  toGeo?: AirportLite;
  durationMin: number; // block time in minutes
  distanceKm: number; // great-circle distance, auto-computed
  seat: string;
  cabin: "Economy" | "Premium" | "Business" | "First" | "";
  note: string;
  source: "manual" | "ifc"; // how the entry was created
  extId?: string; // stable Infinite Flight flight id, for de-duping re-syncs
  createdAt: number;
}

// Real profile snapshot from the Infinite Flight Live API /users endpoint.
export interface IFCProfile {
  userId: string;
  username: string; // discourse / IFC username
  grade: number | null;
  flightTimeMin: number | null; // total career flight time, minutes
  onlineFlights: number | null;
  landingCount: number | null;
  violations: number | null;
  atcOperations: number | null;
  atcRank: number | null;
  xp: number | null;
  virtualOrganization: string | null;
}

export interface IFCConnection {
  connected: boolean;
  username: string;
  userId: string;
  autoSync: boolean; // the "log automatically" toggle
  lastSync: number | null;
  profile: IFCProfile | null;
}

// distanceKm is auto-computed from the route, so it's optional on input.
export type NewFlight = Omit<Flight, "id" | "distanceKm" | "createdAt" | "source"> & {
  distanceKm?: number;
};
