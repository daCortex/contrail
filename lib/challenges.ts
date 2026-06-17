"use client";

import { useCallback, useEffect, useState } from "react";

// A tracked challenge: a named goal with a hand-picked set of logbook flights.
// Everything (map, stats, awards) can then be scoped to just those flights —
// e.g. a "World Conquest" that counts the nations those flights visited.

export type GoalType = "countries" | "airports" | "flights" | "distance" | "none";

export interface TrackedChallenge {
  id: string;
  name: string;
  goalType: GoalType;
  goalTarget: number;
  ifcUrl: string; // optional link to the IFC thread
  note: string;
  flightIds: string[];
  createdAt: number;
}

export const GOAL_LABELS: Record<GoalType, string> = {
  countries: "Countries",
  airports: "Airports",
  flights: "Flights",
  distance: "Distance (km)",
  none: "No goal",
};

const KEY = "contrail.challenges.v1";

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load(): TrackedChallenge[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrackedChallenge[]) : [];
  } catch {
    return [];
  }
}

export function useChallenges() {
  const [challenges, setChallenges] = useState<TrackedChallenge[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChallenges(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(challenges));
      } catch {
        /* ignore */
      }
    }
  }, [challenges, ready]);

  const create = useCallback((input: Omit<TrackedChallenge, "id" | "createdAt" | "flightIds"> & { flightIds?: string[] }) => {
    const ch: TrackedChallenge = {
      id: uid(),
      createdAt: Date.now(),
      flightIds: input.flightIds ?? [],
      name: input.name,
      goalType: input.goalType,
      goalTarget: input.goalTarget,
      ifcUrl: input.ifcUrl,
      note: input.note,
    };
    setChallenges((prev) => [ch, ...prev]);
    return ch;
  }, []);

  const update = useCallback((id: string, patch: Partial<TrackedChallenge>) => {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const remove = useCallback((id: string) => {
    setChallenges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const setFlights = useCallback((id: string, flightIds: string[]) => {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, flightIds } : c)));
  }, []);

  // Drop a flight id from every challenge (e.g. when a flight is deleted).
  const purgeFlight = useCallback((flightId: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.flightIds.includes(flightId)
          ? { ...c, flightIds: c.flightIds.filter((f) => f !== flightId) }
          : c
      )
    );
  }, []);

  return { challenges, ready, create, update, remove, setFlights, purgeFlight };
}

/** Current progress value for a challenge's goal, from its scoped stats. */
export function goalValue(
  goalType: GoalType,
  stats: { uniqueCountries: number; uniqueAirports: number; totalFlights: number; totalDistanceKm: number }
): number {
  switch (goalType) {
    case "countries":
      return stats.uniqueCountries;
    case "airports":
      return stats.uniqueAirports;
    case "flights":
      return stats.totalFlights;
    case "distance":
      return Math.round(stats.totalDistanceKm);
    default:
      return 0;
  }
}
