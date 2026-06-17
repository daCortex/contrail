"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Flight } from "@/lib/types";
import { computeStats, fmtDurationLong, fmtKm } from "@/lib/stats";
import { TrackedChallenge, GOAL_LABELS, goalValue } from "@/lib/challenges";
import { safeUrl } from "@/lib/profile";
import StatsPanel from "./StatsPanel";
import Achievements from "./Achievements";
import FlightList from "./FlightList";
import FlightPicker from "./FlightPicker";
import { PlaneIcon, PencilIcon, TrashIcon, PlusIcon, ArrowRightIcon } from "./icons";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });
const CountriesMap = dynamic(() => import("./CountriesMap"), { ssr: false });

type Tab = "map" | "stats" | "awards" | "flights";
type MapMode = "routes" | "countries";

export default function ChallengeDetail({
  challenge,
  flights,
  onBack,
  onSetFlights,
  onEdit,
  onDelete,
}: {
  challenge: TrackedChallenge;
  flights: Flight[];
  onBack: () => void;
  onSetFlights: (ids: string[]) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<Tab>("map");
  const [mapMode, setMapMode] = useState<MapMode>(challenge.goalType === "countries" ? "countries" : "routes");
  const [pickerOpen, setPickerOpen] = useState(false);

  const scoped = useMemo(
    () => flights.filter((f) => challenge.flightIds.includes(f.id)),
    [flights, challenge.flightIds]
  );
  const stats = useMemo(() => computeStats(scoped), [scoped]);

  const hasGoal = challenge.goalType !== "none" && challenge.goalTarget > 0;
  const value = goalValue(challenge.goalType, stats);
  const pct = hasGoal ? Math.min((value / challenge.goalTarget) * 100, 100) : 0;
  const ifc = safeUrl(challenge.ifcUrl);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-haze hover:text-vapor">
        ← All challenges
      </button>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-vapor">{challenge.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-haze">
              <span>{scoped.length} flights</span>
              <span className="text-dim">·</span>
              <span>{stats.uniqueCountries} countries</span>
              <span className="text-dim">·</span>
              <span>{fmtKm(stats.totalDistanceKm)} km</span>
              <span className="text-dim">·</span>
              <span>{fmtDurationLong(stats.totalMinutes)}</span>
            </div>
            {challenge.note && <p className="mt-3 max-w-2xl text-sm text-haze">{challenge.note}</p>}
            {ifc && (
              <a href={ifc} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-trail-soft hover:underline">
                IFC thread <ArrowRightIcon size={12} />
              </a>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setPickerOpen(true)}
              className="btn-trail flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
            >
              <PlusIcon size={15} strokeWidth={2.2} /> Add flights
            </button>
            <button onClick={onEdit} className="rounded-full border border-[color:var(--color-line)] p-2 text-haze hover:text-vapor" title="Edit">
              <PencilIcon size={15} />
            </button>
            <button onClick={onDelete} className="rounded-full border border-[color:var(--color-line)] p-2 text-rose hover:bg-[color:var(--color-line)]" title="Delete">
              <TrashIcon size={15} />
            </button>
          </div>
        </div>

        {hasGoal && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="text-haze">{GOAL_LABELS[challenge.goalType]}</span>
              <span className="font-mono text-vapor">
                {value.toLocaleString()} / {challenge.goalTarget.toLocaleString()}
                {challenge.goalType === "countries" && pct >= 100 ? " 🌍" : ""}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[color:var(--color-line-soft)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-trail)] to-[color:var(--color-amber)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-1 text-right text-[11px] text-dim">{Math.round(pct)}% complete</div>
          </div>
        )}
      </div>

      {scoped.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mb-3 flex justify-center text-dim">
            <PlaneIcon size={26} />
          </div>
          <p className="text-sm text-haze">No flights in this challenge yet.</p>
          <button onClick={() => setPickerOpen(true)} className="mt-4 text-sm text-trail-soft hover:underline">
            Add flights from your logbook →
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <nav className="flex gap-1">
            {(
              [
                ["map", "Map"],
                ["stats", "Statistics"],
                ["awards", "Awards"],
                ["flights", "Flights"],
              ] as [Tab, string][]
            ).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  tab === t ? "bg-[color:var(--color-panel-2)] text-vapor" : "text-dim hover:text-haze"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === "map" && (
            <div className="relative">
              <div className="absolute left-3 top-3 z-[1000] flex rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-night)]/85 p-0.5 backdrop-blur">
                {(
                  [
                    ["routes", "Routes"],
                    ["countries", "Countries"],
                  ] as [MapMode, string][]
                ).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => setMapMode(m)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors ${
                      mapMode === m ? "bg-[color:var(--color-trail)] text-[#04121a]" : "text-haze"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="card h-[58vh] min-h-[420px] overflow-hidden p-1.5">
                {mapMode === "routes" ? (
                  <RouteMap flights={scoped} />
                ) : (
                  <CountriesMap visited={stats.visitedCC} />
                )}
              </div>
            </div>
          )}

          {tab === "stats" && <StatsPanel stats={stats} />}
          {tab === "awards" && <Achievements stats={stats} flights={scoped} />}
          {tab === "flights" && (
            <div className="card p-4">
              <FlightList
                flights={scoped}
                onEdit={() => {}}
                onDelete={(id) => onSetFlights(challenge.flightIds.filter((f) => f !== id))}
              />
            </div>
          )}
        </>
      )}

      <FlightPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        flights={flights}
        selected={challenge.flightIds}
        onSave={onSetFlights}
      />
    </div>
  );
}
