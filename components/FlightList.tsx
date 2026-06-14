"use client";

import { useMemo, useState } from "react";
import { Flight } from "@/lib/types";
import { findAirport } from "@/lib/airports";
import { fmtDuration, fmtKm } from "@/lib/stats";

export default function FlightList({
  flights,
  onEdit,
  onDelete,
}: {
  flights: Flight[];
  onEdit: (f: Flight) => void;
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return flights;
    return flights.filter((f) =>
      [f.from, f.to, f.airline, f.aircraft, f.flightNumber, f.note]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [flights, q]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-haze uppercase">
          Logbook · {flights.length}
        </h3>
        <input
          className="input w-40 px-3 py-1.5 text-xs"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card-2 px-4 py-8 text-center text-sm text-dim">
          {flights.length === 0
            ? "No flights yet. Log one manually or connect Infinite Flight."
            : "No flights match your search."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((f) => {
            const a = findAirport(f.from);
            const b = findAirport(f.to);
            return (
              <li key={f.id} className="card-2 group flex items-center gap-3 p-3">
                <div className="hidden w-20 shrink-0 text-center sm:block">
                  <div className="text-[11px] text-dim">
                    {new Date(f.date + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-[10px] text-dim">{f.date.slice(0, 4)}</div>
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="text-center">
                    <div className="font-mono text-sm font-semibold text-vapor">{f.from}</div>
                    <div className="truncate text-[10px] text-dim">{a?.city ?? ""}</div>
                  </div>
                  <div className="flex flex-1 items-center gap-1 text-trail">
                    <span className="h-px flex-1 bg-[color:var(--color-line)]" />
                    <span className="text-xs">✈</span>
                    <span className="h-px flex-1 bg-[color:var(--color-line)]" />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-sm font-semibold text-vapor">{f.to}</div>
                    <div className="truncate text-[10px] text-dim">{b?.city ?? ""}</div>
                  </div>
                </div>

                <div className="hidden w-40 shrink-0 text-right md:block">
                  <div className="truncate text-xs text-vapor">{f.aircraft || "—"}</div>
                  <div className="truncate text-[11px] text-dim">
                    {f.airline || ""} {f.flightNumber ? `· ${f.flightNumber}` : ""}
                  </div>
                </div>

                <div className="w-20 shrink-0 text-right">
                  <div className="text-xs text-trail-soft">{fmtDuration(f.durationMin)}</div>
                  <div className="text-[10px] text-dim">{fmtKm(f.distanceKm)} km</div>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {f.source === "ifc" && (
                    <span className="chip mr-1 rounded px-1.5 py-0.5 text-[9px]">IFC</span>
                  )}
                  <button
                    onClick={() => onEdit(f)}
                    className="rounded px-2 py-1 text-xs text-haze hover:bg-[color:var(--color-line)]"
                    title="Edit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onDelete(f.id)}
                    className="rounded px-2 py-1 text-xs text-rose hover:bg-[color:var(--color-line)]"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
