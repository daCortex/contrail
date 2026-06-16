"use client";

import { useMemo } from "react";
import { Flight } from "@/lib/types";
import { Stats } from "@/lib/stats";
import { evaluateAchievements, TIER_COLOR, EvaluatedAchievement } from "@/lib/achievements";

export default function Achievements({ stats, flights }: { stats: Stats; flights: Flight[] }) {
  const items = useMemo(() => evaluateAchievements(stats, flights), [stats, flights]);
  const earned = items.filter((i) => i.earned);
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-lg font-semibold text-vapor">Achievements</h2>
          <p className="text-sm text-haze">
            {earned.length} of {items.length} unlocked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-[color:var(--color-line-soft)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-trail)] to-[color:var(--color-amber)]"
              style={{ width: `${(earned.length / items.length) * 100}%` }}
            />
          </div>
          <span className="font-mono text-sm text-trail-soft">
            {Math.round((earned.length / items.length) * 100)}%
          </span>
        </div>
      </div>

      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-haze uppercase">{cat}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter((i) => i.category === cat)
              .map((a) => (
                <Badge key={a.id} a={a} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Badge({ a }: { a: EvaluatedAchievement }) {
  const color = TIER_COLOR[a.tier];
  const fmt = a.format ?? ((v: number) => Math.round(v).toLocaleString());
  return (
    <div
      className={`card-2 relative overflow-hidden p-4 transition ${
        a.earned ? "" : "opacity-70"
      }`}
      style={a.earned ? { borderColor: color } : undefined}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{
            background: a.earned ? `${color}22` : "var(--color-deep)",
            filter: a.earned ? "none" : "grayscale(1)",
          }}
        >
          {a.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-vapor">{a.name}</span>
            {a.earned && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase"
                style={{ background: `${color}22`, color }}
              >
                {a.tier}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] leading-snug text-dim">{a.desc}</div>
          {!a.earned && (
            <div className="mt-2">
              <div className="h-1 overflow-hidden rounded-full bg-[color:var(--color-line-soft)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${a.progress * 100}%`, background: color }}
                />
              </div>
              <div className="mt-1 text-[10px] text-dim">
                {fmt(a.current)} / {fmt(a.target)}
              </div>
            </div>
          )}
        </div>
      </div>
      {a.earned && (
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-20 blur-xl"
          style={{ background: color }}
        />
      )}
    </div>
  );
}
