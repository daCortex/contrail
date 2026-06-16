"use client";

import { useMemo, useState, type JSX } from "react";
import { Flight } from "@/lib/types";
import { computeStats, fmtDurationLong, fmtKm } from "@/lib/stats";
import {
  PlaneIcon, ClockIcon, GlobeIcon, FlagIcon, RouteIcon, RulerIcon,
  LandingIcon, CalendarIcon, LeafIcon, CloseIcon,
} from "./icons";

function flag(cc?: string): string {
  if (!cc || cc.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
}

const GRADIENTS = [
  "from-[#38d6e0] to-[#4f8cff]",
  "from-[#f5b942] to-[#f2618c]",
  "from-[#4fd6a8] to-[#38d6e0]",
  "from-[#4f8cff] to-[#7c1791]",
  "from-[#f2618c] to-[#f5b942]",
  "from-[#5fe3ec] to-[#4fd6a8]",
];

export default function YearInReview({
  open,
  onClose,
  flights,
}: {
  open: boolean;
  onClose: () => void;
  flights: Flight[];
}) {
  const years = useMemo(
    () => [...new Set(flights.map((f) => f.date.slice(0, 4)).filter(Boolean))].sort().reverse(),
    [flights]
  );
  const [year, setYear] = useState<string>("all");

  const scoped = useMemo(
    () => (year === "all" ? flights : flights.filter((f) => f.date.startsWith(year))),
    [flights, year]
  );
  const s = useMemo(() => computeStats(scoped), [scoped]);

  if (!open) return null;

  const busiestMonth = (() => {
    const m = new Map<string, number>();
    for (const f of scoped) {
      const key = f.date.slice(0, 7);
      if (key) m.set(key, (m.get(key) || 0) + 1);
    }
    let best = "—";
    let bestN = 0;
    for (const [k, n] of m) if (n > bestN) ((best = k), (bestN = n));
    if (best === "—") return null;
    const d = new Date(best + "-01T00:00:00");
    return { label: d.toLocaleString(undefined, { month: "long", year: "numeric" }), n: bestN };
  })();

  const cards: { icon: JSX.Element; big: string; label: string }[] = [
    { icon: <PlaneIcon size={20} />, big: s.totalFlights.toLocaleString(), label: "flights flown" },
    { icon: <ClockIcon size={20} />, big: fmtDurationLong(s.totalMinutes), label: "in the air" },
    { icon: <GlobeIcon size={20} />, big: `${fmtKm(s.totalDistanceKm)} km`, label: `that's ${s.earthCircuits.toFixed(1)}× around the world` },
    { icon: <FlagIcon size={20} />, big: String(s.uniqueCountries), label: `countries ${s.topCountries.slice(0, 6).map((c) => flag(c.cc)).join(" ")}` },
    { icon: <PlaneIcon size={20} />, big: s.topAircraft[0]?.label ?? "—", label: `your top aircraft · ${s.topAircraft[0]?.count ?? 0} flights` },
    { icon: <RouteIcon size={20} />, big: s.topRoutes[0]?.label ?? "—", label: `most-flown route · ${s.topRoutes[0]?.count ?? 0}×` },
    { icon: <RulerIcon size={20} />, big: s.longestFlight ? `${s.longestFlight.from} → ${s.longestFlight.to}` : "—", label: `longest flight · ${s.longestFlight ? fmtKm(s.longestFlight.distanceKm) + " km" : ""}` },
    { icon: <LandingIcon size={20} />, big: s.totalLandings.toLocaleString(), label: "landings" },
    ...(busiestMonth ? [{ icon: <CalendarIcon size={20} />, big: busiestMonth.label, label: `busiest month · ${busiestMonth.n} flights` }] : []),
    ...(s.co2Tonnes > 0 ? [{ icon: <LeafIcon size={20} />, big: `${Math.round(s.co2Tonnes)} t`, label: "CO₂ burned" }] : []),
  ];

  const shareText =
    `My Contrail ${year === "all" ? "career" : year}: ${s.totalFlights} flights · ` +
    `${fmtDurationLong(s.totalMinutes)} aloft · ${fmtKm(s.totalDistanceKm)} km · ` +
    `${s.uniqueCountries} countries · top aircraft ${s.topAircraft[0]?.label ?? "—"}.`;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-[color:var(--color-night)]/97 p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="card my-8 w-full max-w-3xl p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.2em] text-trail-soft uppercase">Contrail Wrapped</div>
            <h2 className="text-2xl font-bold text-vapor">Your flying, in review</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input px-3 py-1.5 text-sm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="all">All time</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-haze hover:bg-[color:var(--color-line)]"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((c, i) => (
            <div
              key={i}
              className={`animate-[fadein_.5s_ease] rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} p-[1px]`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-full flex-col justify-between rounded-2xl bg-[color:var(--color-panel)] p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-vapor)]/8 text-vapor">
                  {c.icon}
                </div>
                <div className="mt-3">
                  <div className="text-xl font-bold leading-tight text-vapor">{c.big}</div>
                  <div className="mt-1 text-xs text-haze">{c.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => navigator.clipboard?.writeText(shareText)}
            className="rounded-lg border border-[color:var(--color-trail)]/40 px-4 py-2 text-sm text-trail-soft hover:bg-[color:var(--color-trail)]/10"
          >
            Copy summary
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadein {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
