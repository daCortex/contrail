"use client";

import { AirportLite } from "./types";

// Client helpers that talk to /api/airports (backed by the full ~72k dataset),
// so the manual log form and the backfill aren't limited to a tiny bundled set.

export interface AirportHit {
  code: string; // preferred display code (IATA when known)
  icao: string;
  iata: string;
  city: string;
  country: string;
  cc: string;
  lat: number;
  lon: number;
}

export function toLite(a: AirportHit): AirportLite {
  return { lat: a.lat, lon: a.lon, cc: a.cc, city: a.city, country: a.country };
}

/** Search airports by ICAO, IATA, or city. */
export async function searchAirports(q: string): Promise<AirportHit[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    return (json.airports as AirportHit[]) || [];
  } catch {
    return [];
  }
}

/** Resolve a batch of codes (ICAO or IATA) to airports. */
export async function resolveAirports(codes: string[]): Promise<Record<string, AirportHit>> {
  const unique = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return {};
  try {
    const res = await fetch("/api/airports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes: unique }),
    });
    const json = await res.json();
    return (json.airports as Record<string, AirportHit>) || {};
  } catch {
    return {};
  }
}
