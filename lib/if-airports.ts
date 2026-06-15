// Server-side airport resolver backed by the full OurAirports dataset
// (~78k entries). Used to enrich Infinite Flight logbook flights — which
// reference arbitrary ICAO codes — with coordinates, city, and country.
//
// The 3.6MB airport table is read from disk at runtime (not statically
// imported) so TypeScript never has to infer a 78k-key literal type, and is
// bundled into the serverless function via `outputFileTracingIncludes` in
// next.config.ts. This module is only imported from server routes.

import fs from "fs";
import path from "path";
import countries from "./data/countries.json";
import { AirportLite } from "./types";

// [lat, lon, cc, city, iata]
type Row = [number, number, string, string, string];
const COUNTRIES = countries as Record<string, string>;

let TABLE: Record<string, Row> | null = null;
function table(): Record<string, Row> {
  if (!TABLE) {
    const file = path.join(process.cwd(), "lib", "data", "airports-full.json");
    TABLE = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, Row>;
  }
  return TABLE;
}

export interface ResolvedAirport extends AirportLite {
  code: string; // preferred display code — IATA when known, else the input
  iata: string;
}

/** Resolve an ICAO/IATA/local code to coordinates + country. */
export function resolveAirport(code: string): ResolvedAirport | null {
  const c = (code || "").trim().toUpperCase();
  if (!c) return null;
  const row = table()[c];
  if (!row) return null;
  const [lat, lon, cc, city, iata] = row;
  return {
    code: iata || c,
    iata,
    lat,
    lon,
    cc,
    city: city || c,
    country: COUNTRIES[cc] || cc,
  };
}
