"use client";

import { Stats, RankedItem, fmtDurationLong, fmtKm } from "@/lib/stats";
import { resolvePoint } from "@/lib/airports";

/** ISO alpha-2 → flag emoji. */
function flag(cc?: string): string {
  if (!cc || cc.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + cc.toUpperCase().charCodeAt(0) - 65,
    A + cc.toUpperCase().charCodeAt(1) - 65
  );
}

export default function StatsPanel({ stats }: { stats: Stats }) {
  const s = stats;
  const hero = [
    { label: "Flights", value: s.totalFlights.toLocaleString(), accent: "text-trail-soft" },
    { label: "Time aloft", value: fmtDurationLong(s.totalMinutes), accent: "text-amber" },
    { label: "Distance", value: `${fmtKm(s.totalDistanceKm)} km`, accent: "text-sky" },
    { label: "Countries", value: String(s.uniqueCountries), accent: "text-mint" },
    { label: "Airports", value: String(s.uniqueAirports), accent: "text-vapor" },
    { label: "Aircraft types", value: String(s.uniqueAircraft), accent: "text-rose" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {hero.map((h) => (
          <div key={h.label} className="card p-4">
            <div className={`text-2xl font-semibold ${h.accent}`}>{h.value}</div>
            <div className="mt-1 text-[11px] tracking-wide text-haze uppercase">{h.label}</div>
          </div>
        ))}
      </div>

      {/* Fun distance facts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FactCard
          emoji="🌍"
          title="Around the world"
          value={`${s.earthCircuits.toFixed(2)}×`}
          sub="times the equator"
        />
        <FactCard
          emoji="🌙"
          title="Toward the Moon"
          value={`${(s.toMoon * 100).toFixed(1)}%`}
          sub="of the 384,400 km trip"
        />
        <FactCard
          emoji="🛬"
          title="Unique routes"
          value={String(s.uniqueRoutes)}
          sub={`${s.uniqueAirlines} airlines flown`}
        />
      </div>

      {/* Ranked lists */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RankCard title="Most flown aircraft" items={s.topAircraft} unit="flights" />
        <RankCard title="Most popular routes" items={s.topRoutes} unit="times" />
        <RankCard title="Top countries" items={s.topCountries} unit="visits" showFlag />
        <RankCard title="Most departed from" items={s.topDepartures} unit="departures" showFlag />
        <RankCard title="Most landed at" items={s.topArrivals} unit="arrivals" showFlag />
        <RankCard title="Airlines flown" items={s.topAirlines} unit="flights" />
      </div>

      {/* Longest / shortest + cabins */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ExtremeCard title="Longest flight" flight={s.longestFlight} />
        <ExtremeCard title="Shortest flight" flight={s.shortestFlight} />
        <RankCard title="Cabin mix" items={s.topCabins} unit="flights" compact />
      </div>

      {/* Flights by year */}
      {s.byYear.length > 0 && <YearChart stats={s} />}
    </div>
  );
}

function FactCard({
  emoji,
  title,
  value,
  sub,
}: {
  emoji: string;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="text-3xl">{emoji}</div>
      <div>
        <div className="text-xl font-semibold text-vapor">{value}</div>
        <div className="text-xs text-haze">{title}</div>
        <div className="text-[11px] text-dim">{sub}</div>
      </div>
    </div>
  );
}

function RankCard({
  title,
  items,
  unit,
  showFlag,
  compact,
}: {
  title: string;
  items: RankedItem[];
  unit: string;
  showFlag?: boolean;
  compact?: boolean;
}) {
  const max = items[0]?.count || 1;
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-haze uppercase">{title}</h3>
      {items.length === 0 ? (
        <div className="py-4 text-center text-xs text-dim">No data yet</div>
      ) : (
        <ul className={compact ? "space-y-2" : "space-y-2.5"}>
          {items.map((it, i) => (
            <li key={it.key}>
              <div className="mb-1 flex items-center gap-2 text-sm">
                <span className="w-4 text-right text-[11px] text-dim">{i + 1}</span>
                {showFlag && <span>{flag(it.cc)}</span>}
                <span className="flex-1 truncate text-vapor">{it.label}</span>
                <span className="font-mono text-xs text-trail-soft">{it.count}</span>
                <span className="hidden text-[10px] text-dim sm:inline">{unit}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-line-soft)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-trail)] to-[color:var(--color-sky)]"
                  style={{ width: `${(it.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExtremeCard({ title, flight }: { title: string; flight: Stats["longestFlight"] }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-haze uppercase">{title}</h3>
      {!flight ? (
        <div className="py-4 text-center text-xs text-dim">No data yet</div>
      ) : (
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-vapor">
            <span className="font-mono">{flight.from}</span>
            <span className="text-trail">→</span>
            <span className="font-mono">{flight.to}</span>
          </div>
          <div className="mt-1 text-xs text-haze">
            {resolvePoint(flight.from, flight.fromGeo)?.city} →{" "}
            {resolvePoint(flight.to, flight.toGeo)?.city}
          </div>
          <div className="mt-3 flex gap-4 text-sm">
            <div>
              <div className="font-mono text-trail-soft">{fmtKm(flight.distanceKm)} km</div>
              <div className="text-[10px] text-dim">distance</div>
            </div>
            <div>
              <div className="font-mono text-amber">{fmtDurationLong(flight.durationMin)}</div>
              <div className="text-[10px] text-dim">duration</div>
            </div>
          </div>
          {flight.aircraft && (
            <div className="mt-2 text-xs text-dim">{flight.aircraft}</div>
          )}
        </div>
      )}
    </div>
  );
}

function YearChart({ stats }: { stats: Stats }) {
  const max = Math.max(...stats.byYear.map((y) => y.count), 1);
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-xs font-semibold tracking-wide text-haze uppercase">
        Flights by year
      </h3>
      <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{ minHeight: 140 }}>
        {stats.byYear.map((y) => (
          <div key={y.year} className="flex min-w-[44px] flex-1 flex-col items-center gap-2">
            <div className="text-[11px] font-mono text-trail-soft">{y.count}</div>
            <div className="flex h-24 w-full items-end">
              <div
                className="w-full rounded-t bg-gradient-to-t from-[color:var(--color-sky)] to-[color:var(--color-trail)]"
                style={{ height: `${(y.count / max) * 100}%`, minHeight: 4 }}
                title={`${y.year}: ${y.count} flights, ${fmtKm(y.km)} km`}
              />
            </div>
            <div className="text-[11px] text-dim">{y.year}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
