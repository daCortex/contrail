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
  autoSync: false,
  lastSync: null,
  grade: null,
  xp: null,
  onlineFlights: null,
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

  const addMany = useCallback((items: NewFlight[], source: "manual" | "ifc" = "ifc") => {
    setFlights((prev) => {
      // De-dupe against existing entries on date+route+flightNumber.
      const seen = new Set(prev.map((f) => `${f.date}|${f.from}|${f.to}|${f.flightNumber}`));
      const fresh: Flight[] = [];
      for (const nf of items) {
        const k = `${nf.date}|${nf.from}|${nf.to}|${nf.flightNumber}`;
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
      return [...fresh, ...prev].sort((a, b) => b.date.localeCompare(a.date));
    });
  }, []);

  const updateFlight = useCallback((id: string, patch: Partial<Flight>) => {
    setFlights((prev) =>
      prev
        .map((f) => {
          if (f.id !== id) return f;
          const merged = { ...f, ...patch };
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
