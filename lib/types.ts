export interface Flight {
  id: string;
  date: string; // ISO yyyy-mm-dd
  flightNumber: string; // e.g. "BA286"
  airline: string;
  aircraft: string; // matches an AIRCRAFT name when possible
  registration: string; // tail number, optional
  from: string; // IATA/ICAO code
  to: string; // IATA/ICAO code
  durationMin: number; // block time in minutes
  distanceKm: number; // great-circle distance, auto-computed
  seat: string;
  cabin: "Economy" | "Premium" | "Business" | "First" | "";
  note: string;
  source: "manual" | "ifc"; // how the entry was created
  createdAt: number;
}

export interface IFCConnection {
  connected: boolean;
  username: string;
  autoSync: boolean; // the "log automatically" toggle
  lastSync: number | null;
  // Snapshot of profile stats pulled from the Infinite Flight grade table.
  grade: number | null;
  xp: number | null;
  onlineFlights: number | null;
}

// distanceKm is auto-computed from the route, so it's optional on input.
export type NewFlight = Omit<Flight, "id" | "distanceKm" | "createdAt" | "source"> & {
  distanceKm?: number;
};
