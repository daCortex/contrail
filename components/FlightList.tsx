"use client";

import { useMemo, useState } from "react";
import { Flight } from "@/lib/types";
import { resolvePoint } from "@/lib/airports";
import { fmtDuration, fmtKm } from "@/lib/stats";
import { PlaneIcon, PencilIcon, TrashIcon, SearchIcon } from "./icons";

const PAGE = 50;

export default function FlightList({
  flights,
  onEdit,
  onDelete,
  onSelect,
}: {
  flights: Flight[];
  onEdit: (f: Flight) => void;
  onDelete: (id: string) => void;
  onSelect?: (f: Flight) => void;
}) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);

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

  const visible = filtered.slice(0, limit);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-haze uppercase">
          Logbook · {flights.length}
        </h3>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim">
            <SearchIcon size={14} />
          </span>
          <input
            className="input w-44 py-1.5 pl-8 pr-3 text-xs"
            placeholder="Search…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-2 px-4 py-8 text-center text-sm text-dim">
          {flights.length === 0
            ? "No flights yet. Log one manually or connect Infinite Flight."
            : "No flights match your search."}
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {visible.map((f) => {
              const a = resolvePoint(f.from, f.fromGeo);
              const b = resolvePoint(f.to, f.toGeo);
              return (
                <li
                  key={f.id}
                  onClick={() => onSelect?.(f)}
                  className={`card-2 group flex items-center gap-3 p-3 ${
                    onSelect ? "cursor-pointer hover:border-[color:var(--color-trail)]/40" : ""
                  }`}
                >
                  <div className="hidden w-16 shrink-0 text-center sm:block">
                    <div className="text-[11px] text-haze">
                      {new Date(f.date + "T00:00:00").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-[10px] text-dim">{f.date.slice(0, 4)}</div>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="w-12 shrink-0 text-center">
                      <div className="font-mono text-sm font-semibold text-vapor">{f.from || "—"}</div>
                      <div className="truncate text-[10px] text-dim">{a?.city ?? ""}</div>
                    </div>
                    <div className="flex flex-1 items-center gap-1 text-trail/70">
                      <span className="h-px flex-1 bg-[color:var(--color-line)]" />
                      <PlaneIcon size={13} strokeWidth={1.8} />
                      <span className="h-px flex-1 bg-[color:var(--color-line)]" />
                    </div>
                    <div className="w-12 shrink-0 text-center">
                      <div className="font-mono text-sm font-semibold text-vapor">{f.to || "—"}</div>
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

                  <div className="flex shrink-0 items-center gap-1">
                    {f.source === "ifc" && (
                      <span className="chip mr-1 rounded px-1.5 py-0.5 text-[9px]">IFC</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(f);
                      }}
                      className="rounded-md p-1.5 text-haze opacity-0 transition hover:bg-[color:var(--color-line)] group-hover:opacity-100"
                      title="Edit"
                    >
                      <PencilIcon size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(f.id);
                      }}
                      className="rounded-md p-1.5 text-rose opacity-0 transition hover:bg-[color:var(--color-line)] group-hover:opacity-100"
                      title="Delete"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {filtered.length > visible.length && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="text-xs text-dim">
                Showing {visible.length} of {filtered.length}
              </span>
              <button
                onClick={() => setLimit((l) => l + PAGE)}
                className="rounded-full border border-[color:var(--color-line)] px-4 py-1.5 text-xs text-haze hover:border-[color:var(--color-trail)]/40 hover:text-trail-soft"
              >
                Show more
              </button>
              <button
                onClick={() => setLimit(filtered.length)}
                className="text-xs text-dim hover:text-haze"
              >
                Show all
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
