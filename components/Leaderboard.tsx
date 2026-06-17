"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchLeaderboard, LeaderRow } from "@/lib/profile";
import { fmtDurationLong, fmtKm } from "@/lib/stats";
import { PlaneIcon, TrophyIcon } from "./icons";

const METRICS: { key: string; label: string; fmt: (v: number) => string }[] = [
  { key: "distance_km", label: "Distance", fmt: (v) => `${fmtKm(v)} km` },
  { key: "flights", label: "Flights", fmt: (v) => v.toLocaleString() },
  { key: "minutes", label: "Hours", fmt: (v) => fmtDurationLong(v) },
  { key: "countries", label: "Countries", fmt: (v) => v.toLocaleString() },
  { key: "airports", label: "Airports", fmt: (v) => v.toLocaleString() },
  { key: "aircraft_types", label: "Aircraft", fmt: (v) => v.toLocaleString() },
  { key: "landings", label: "Landings", fmt: (v) => v.toLocaleString() },
];

const MEDAL = ["#e9b864", "#c2ccdb", "#c08457"]; // gold / silver / bronze

export default function Leaderboard() {
  const [metric, setMetric] = useState("distance_km");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLeaderboard(metric).then((r) => {
      if (!cancelled) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [metric]);

  const active = METRICS.find((m) => m.key === metric)!;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 text-sm text-haze hover:text-vapor">
          <span className="text-trail-soft">
            <PlaneIcon size={18} />
          </span>
          Contrail
        </Link>
        <Link href="/track" className="rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor">
          Track
        </Link>
      </header>

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--color-amber)]/12 text-amber">
          <TrophyIcon size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-vapor">Leaderboard</h1>
          <p className="text-sm text-haze">Pilots who&rsquo;ve viewed their Contrail profile, ranked.</p>
        </div>
      </div>

      {/* Metric tabs */}
      <div className="mb-5 flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              metric === m.key ? "bg-[color:var(--color-panel-2)] text-vapor" : "text-dim hover:text-haze"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center text-sm text-dim">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-dim">
          No pilots on the board yet. Open your profile to appear here.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.username} className="card-2 flex items-center gap-3 p-3">
              <div
                className="w-7 text-center font-mono text-sm font-semibold"
                style={{ color: i < 3 ? MEDAL[i] : "var(--color-dim)" }}
              >
                {i + 1}
              </div>
              <Link
                href={`/u/${encodeURIComponent(r.displayName || r.username)}`}
                className="flex-1 truncate text-sm font-medium text-vapor hover:text-trail-soft"
              >
                @{r.displayName || r.username}
              </Link>
              {r.grade ? (
                <span className="hidden rounded-full border border-[color:var(--color-line)] px-2 py-0.5 text-[10px] text-dim sm:inline">
                  Grade {r.grade}
                </span>
              ) : null}
              <div className="w-28 text-right font-mono text-sm text-trail-soft">
                {active.fmt(r.value)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
