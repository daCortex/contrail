"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flight, IFCConnection, NewFlight } from "./types";
import { findAirport } from "./airports";
import { haversineKm, estimateDurationMin } from "./geo";
import { resolveAirports } from "./airport-client";

const FLIGHTS_KEY = "contrail.flights.v1";
const IFC_KEY = "contrail.ifc.v1";

// AirportHit (from /api/airports) → the AirportLite we store on a flight.
function lite(a?: { lat: number; lon: number; cc: string; city: string; country: string }) {
  return a ? { lat: a.lat, lon: a.lon, cc: a.cc, city: a.city, country: a.country } : undefined;
}

const DEFAULT_IFC: IFCConnection = {
  connected: false,
  username: "",
  userId: "",
  autoSync: false,
  lastSync: null,
  profile: null,
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Compute great-circle distance for a flight from its endpoints. */
export function distanceFor(from: string, to: string): number {
  const a = findAirport(from);
  const b = findAirport(to);
  if (!a || !b) return 0;
  return haversineKm(a, b);
}

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export function useFlightbook() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [ifc, setIfc] = useState<IFCConnection>(DEFAULT_IFC);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFlights(load<Flight[]>(FLIGHTS_KEY, []));
    setIfc(load<IFCConnection>(IFC_KEY, DEFAULT_IFC));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(FLIGHTS_KEY, flights);
  }, [flights, ready]);

  useEffect(() => {
    if (ready) save(IFC_KEY, ifc);
  }, [ifc, ready]);

  // One-time backfill: any flight with a route but 0 km (older imports / manual
  // logs from when only a few airports were known) gets its airports resolved
  // against the full dataset, then a real distance and an estimated time.
  const backfilledRef = useRef(false);
  useEffect(() => {
    if (!ready || backfilledRef.current) return;
    const needing = flights.filter(
      (f) => !f.distanceKm && f.from && f.to && f.from !== f.to && (!f.fromGeo || !f.toGeo)
    );
    if (needing.length === 0) {
      backfilledRef.current = true;
      return;
    }
    backfilledRef.current = true;
    (async () => {
      const codes = [...new Set(needing.flatMap((f) => [f.from, f.to]))];
      const map = await resolveAirports(codes);
      setFlights((prev) =>
        prev.map((f) => {
          if (f.distanceKm || !f.from || !f.to || f.from === f.to) return f;
          const a = f.fromGeo || lite(map[f.from.toUpperCase()]);
          const b = f.toGeo || lite(map[f.to.toUpperCase()]);
          if (!a || !b) return f;
          const distanceKm = Math.round(haversineKm(a, b));
          return {
            ...f,
            fromGeo: a,
            toGeo: b,
            distanceKm,
            durationMin: f.durationMin || estimateDurationMin(distanceKm),
          };
        })
      );
    })();
  }, [ready, flights]);

  const addFlight = useCallback((nf: NewFlight, source: "manual" | "ifc" = "manual") => {
    const flight: Flight = {
      ...nf,
      id: uid(),
      distanceKm: nf.distanceKm || distanceFor(nf.from, nf.to),
      source,
      createdAt: Date.now(),
    };
    setFlights((prev) => [flight, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    return flight;
  }, []);

  // De-dupe key: prefer the stable IF flight id, else date+route+flightNumber.
  const dedupeKey = (f: { extId?: string; date: string; from: string; to: string; flightNumber: string }) =>
    f.extId ? `ext:${f.extId}` : `${f.date}|${f.from}|${f.to}|${f.flightNumber}`;

  /** Add flights, skipping any already in the logbook. Returns how many were new. */
  const addMany = useCallback(
    (items: NewFlight[], source: "manual" | "ifc" = "ifc"): number => {
      const seen = new Set(flights.map(dedupeKey));
      const fresh: Flight[] = [];
      for (const nf of items) {
        const k = dedupeKey(nf);
        if (seen.has(k)) continue;
        seen.add(k);
        fresh.push({
          ...nf,
          id: uid(),
          distanceKm: nf.distanceKm || distanceFor(nf.from, nf.to),
          source,
          createdAt: Date.now(),
        });
      }
      if (fresh.length) {
        setFlights((prev) => {
          // Re-check against the latest state in case it changed since render.
          const seenPrev = new Set(prev.map(dedupeKey));
          const toAdd = fresh.filter((f) => !seenPrev.has(dedupeKey(f)));
          return [...toAdd, ...prev].sort((a, b) => b.date.localeCompare(a.date));
        });
      }
      return fresh.length;
    },
    [flights]
  );

  const updateFlight = useCallback((id: string, patch: Partial<Flight>) => {
    setFlights((prev) =>
      prev
        .map((f) => {
          if (f.id !== id) return f;
          const merged = { ...f, ...patch };
          // Prefer resolved coordinates (full dataset) for distance; fall back
          // to the curated lookup, then the stored value.
          if (merged.fromGeo && merged.toGeo) {
            merged.distanceKm = Math.round(haversineKm(merged.fromGeo, merged.toGeo));
          } else {
            merged.distanceKm = distanceFor(merged.from, merged.to) || merged.distanceKm;
          }
          return merged;
        })
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const removeFlight = useCallback((id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => setFlights([]), []);

  return {
    flights,
    ifc,
    setIfc,
    ready,
    addFlight,
    addMany,
    updateFlight,
    removeFlight,
    clearAll,
  };
}
