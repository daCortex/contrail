import { Flight } from "./types";
import { Stats } from "./stats";

export type AchTier = "bronze" | "silver" | "gold" | "platinum";

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  tier: AchTier;
  category: "Distance" | "Volume" | "Time" | "World" | "Fleet" | "Special";
  desc: string;
  target: number; // threshold on the measured value
  unit?: string;
  value: (s: Stats, f: Flight[]) => number;
  format?: (v: number) => string;
}

const km = (v: number) => `${Math.round(v).toLocaleString()} km`;
const hrs = (v: number) => `${Math.round(v / 60).toLocaleString()} h`;

// Helpers over the raw flight list.
const hasAircraft = (f: Flight[], re: RegExp) => f.some((x) => re.test(x.aircraft || ""));
const maxSingle = (f: Flight[]) => f.reduce((m, x) => Math.max(m, x.distanceKm || 0), 0);
const flightsInBusiestYear = (s: Stats) =>
  s.byYear.reduce((m, y) => Math.max(m, y.count), 0);
const polarVisits = (s: Stats) =>
  s.visitedAirports.filter((a) => Math.abs(a.lat) >= 60).length;
const expertFlights = (f: Flight[]) =>
  f.filter((x) => (x.server || "").toLowerCase().includes("expert")).length;

export const ACHIEVEMENTS: Achievement[] = [
  // Distance
  { id: "dist-10k", name: "Wheels Up", emoji: "🛫", tier: "bronze", category: "Distance", desc: "Fly 10,000 km total", target: 10000, value: (s) => s.totalDistanceKm, format: km },
  { id: "dist-100k", name: "Continental", emoji: "🗺️", tier: "silver", category: "Distance", desc: "Fly 100,000 km total", target: 100000, value: (s) => s.totalDistanceKm, format: km },
  { id: "dist-equator", name: "Around the World", emoji: "🌍", tier: "silver", category: "Distance", desc: "Fly one Earth circumference (40,075 km)", target: 40075, value: (s) => s.totalDistanceKm, format: km },
  { id: "dist-1m", name: "Million Miler", emoji: "💫", tier: "gold", category: "Distance", desc: "Fly 1,000,000 km total", target: 1000000, value: (s) => s.totalDistanceKm, format: km },
  { id: "dist-moon", name: "To the Moon", emoji: "🌙", tier: "platinum", category: "Distance", desc: "Fly the distance to the Moon (384,400 km)", target: 384400, value: (s) => s.totalDistanceKm, format: km },
  { id: "long-haul", name: "Long Hauler", emoji: "🛩️", tier: "gold", category: "Distance", desc: "A single flight of 10,000+ km", target: 10000, value: (_, f) => maxSingle(f), format: km },

  // Volume
  { id: "vol-10", name: "Getting Started", emoji: "📒", tier: "bronze", category: "Volume", desc: "Log 10 flights", target: 10, value: (s) => s.totalFlights },
  { id: "vol-100", name: "Regular", emoji: "✈️", tier: "silver", category: "Volume", desc: "Log 100 flights", target: 100, value: (s) => s.totalFlights },
  { id: "vol-1000", name: "Veteran", emoji: "🎖️", tier: "platinum", category: "Volume", desc: "Log 1,000 flights", target: 1000, value: (s) => s.totalFlights },
  { id: "ldg-100", name: "Greaser", emoji: "🛬", tier: "silver", category: "Volume", desc: "Make 100 landings", target: 100, value: (s) => s.totalLandings },
  { id: "ldg-1000", name: "Butter Master", emoji: "🧈", tier: "gold", category: "Volume", desc: "Make 1,000 landings", target: 1000, value: (s) => s.totalLandings },
  { id: "year-50", name: "Frequent Flyer", emoji: "📆", tier: "gold", category: "Volume", desc: "50 flights in a single year", target: 50, value: (s) => flightsInBusiestYear(s) },

  // Time
  { id: "time-24", name: "Day Aloft", emoji: "🕐", tier: "bronze", category: "Time", desc: "24 hours of flight time", target: 1440, value: (s) => s.totalMinutes, format: hrs },
  { id: "time-100", name: "Century of Hours", emoji: "⏱️", tier: "silver", category: "Time", desc: "100 hours aloft", target: 6000, value: (s) => s.totalMinutes, format: hrs },
  { id: "time-1000", name: "Thousand-Hour Club", emoji: "⌛", tier: "platinum", category: "Time", desc: "1,000 hours aloft", target: 60000, value: (s) => s.totalMinutes, format: hrs },

  // World
  { id: "world-5", name: "Border Crosser", emoji: "🛂", tier: "bronze", category: "World", desc: "Visit 5 countries", target: 5, value: (s) => s.uniqueCountries },
  { id: "world-25", name: "Globetrotter", emoji: "🧭", tier: "silver", category: "World", desc: "Visit 25 countries", target: 25, value: (s) => s.uniqueCountries },
  { id: "world-50", name: "World Citizen", emoji: "🌐", tier: "gold", category: "World", desc: "Visit 50 countries", target: 50, value: (s) => s.uniqueCountries },
  { id: "world-100", name: "Centurion", emoji: "🏆", tier: "platinum", category: "World", desc: "Visit 100 countries", target: 100, value: (s) => s.uniqueCountries },
  { id: "ap-25", name: "Airport Collector", emoji: "📍", tier: "bronze", category: "World", desc: "Land at 25 airports", target: 25, value: (s) => s.uniqueAirports },
  { id: "ap-100", name: "Airport Hoarder", emoji: "🗂️", tier: "gold", category: "World", desc: "Land at 100 airports", target: 100, value: (s) => s.uniqueAirports },
  { id: "polar", name: "Polar Pilot", emoji: "❄️", tier: "gold", category: "World", desc: "Visit an airport above 60° latitude", target: 1, value: (s) => polarVisits(s) },

  // Fleet
  { id: "fleet-5", name: "Type Rated", emoji: "🛠️", tier: "bronze", category: "Fleet", desc: "Fly 5 aircraft types", target: 5, value: (s) => s.uniqueAircraft },
  { id: "fleet-15", name: "Fleet Manager", emoji: "🏢", tier: "silver", category: "Fleet", desc: "Fly 15 aircraft types", target: 15, value: (s) => s.uniqueAircraft },
  { id: "fleet-30", name: "Hangar Full", emoji: "🚁", tier: "gold", category: "Fleet", desc: "Fly 30 aircraft types", target: 30, value: (s) => s.uniqueAircraft },
  { id: "heavy", name: "Heavy Metal", emoji: "🛫", tier: "silver", category: "Fleet", desc: "Fly an A380 or 747", target: 1, value: (_, f) => (hasAircraft(f, /380|747/) ? 1 : 0) },
  { id: "fighter", name: "Fighter Jock", emoji: "🪖", tier: "gold", category: "Fleet", desc: "Fly a military fast jet", target: 1, value: (_, f) => (hasAircraft(f, /F-?\/?A|18|22|14|Hornet|Spitfire|C-130/i) ? 1 : 0) },

  // Special
  { id: "routes-50", name: "Route Network", emoji: "🕸️", tier: "silver", category: "Special", desc: "Fly 50 unique routes", target: 50, value: (s) => s.uniqueRoutes },
  { id: "expert", name: "Expert Server", emoji: "🎯", tier: "gold", category: "Special", desc: "Log a flight on the Expert Server", target: 1, value: (_, f) => (expertFlights(f) > 0 ? 1 : 0) },
  { id: "co2", name: "Heavy Burner", emoji: "🛢️", tier: "silver", category: "Special", desc: "Burn 100 tonnes of CO₂", target: 100, value: (s) => s.co2Tonnes, format: (v) => `${Math.round(v)} t` },
];

export interface EvaluatedAchievement extends Achievement {
  current: number;
  earned: boolean;
  progress: number; // 0..1
}

export function evaluateAchievements(s: Stats, flights: Flight[]): EvaluatedAchievement[] {
  return ACHIEVEMENTS.map((a) => {
    const current = a.value(s, flights);
    const progress = Math.max(0, Math.min(current / a.target, 1));
    return { ...a, current, earned: current >= a.target, progress };
  });
}

export const TIER_COLOR: Record<AchTier, string> = {
  bronze: "#c08457",
  silver: "#9fb0c8",
  gold: "#f5b942",
  platinum: "#5fe3ec",
};
