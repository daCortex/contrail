"use client";

import { useCallback, useEffect, useState } from "react";
import { Flight, IFCConnection, NewFlight } from "./types";
import { findAirport } from "./airports";
import { haversineKm } from "./geo";

const FLIGHTS_KEY = "contrail.flights.v1";
const IFC_KEY = "contrail.ifc.v1";

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
          // Recompute from the route when possible; keep the stored value
          // (e.g. an IFC import's server-computed distance) otherwise.
          merged.distanceKm = distanceFor(merged.from, merged.to) || merged.distanceKm;
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
