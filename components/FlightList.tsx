"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flight } from "@/lib/types";
import { resolvePoint } from "@/lib/airports";
import { fmtDuration, fmtKm } from "@/lib/stats";
import { PlaneIcon, PencilIcon, TrashIcon, SearchIcon, BoltIcon, CheckIcon } from "./icons";

const PAGE = 50;

interface ChallengeRef {
  id: string;
  name: string;
  flightIds: string[];
}

export default function FlightList({
  flights,
  onEdit,
  onDelete,
  onSelect,
  challenges,
  onToggleChallenge,
}: {
  flights: Flight[];
  onEdit: (f: Flight) => void;
  onDelete: (id: string) => void;
  onSelect?: (f: Flight) => void;
  challenges?: ChallengeRef[];
  onToggleChallenge?: (flightId: string, challengeId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const canChallenge = !!challenges && !!onToggleChallenge;

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
                    {canChallenge &&
                      (() => {
                        const inAny = challenges!.some((c) => c.flightIds.includes(f.id));
                        return (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuFor(menuFor === f.id ? null : f.id);
                              }}
                              className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition ${
                                inAny || menuFor === f.id
                                  ? "border-[color:var(--color-trail)]/50 bg-[color:var(--color-trail)]/10 text-trail-soft"
                                  : "border-[color:var(--color-line)] text-haze hover:text-vapor"
                              }`}
                              title="Add to challenge"
                            >
                              <BoltIcon size={12} />
                              {inAny ? "In challenge" : "Challenge"}
                            </button>
                        {menuFor === f.id && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="card-2 absolute right-0 z-50 mt-1 max-h-56 w-52 overflow-auto p-1.5 shadow-2xl"
                          >
                            <div className="px-1.5 py-1 text-[10px] tracking-wide text-dim uppercase">Add to challenge</div>
                            {challenges!.length === 0 ? (
                              <div className="px-1.5 py-2 text-xs text-dim">
                                No challenges yet. Create one in the Challenges tab.
                              </div>
                            ) : (
                              challenges!.map((c) => {
                                const on = c.flightIds.includes(f.id);
                                return (
                                  <button
                                    key={c.id}
                                    onClick={() => onToggleChallenge!(f.id, c.id)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-haze hover:bg-[color:var(--color-line)]/50"
                                  >
                                    <span
                                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                                        on ? "border-[color:var(--color-trail)] bg-[color:var(--color-trail)] text-[#04121a]" : "border-[color:var(--color-dim)]"
                                      }`}
                                    >
                                      {on && <CheckIcon size={10} />}
                                    </span>
                                    <span className="truncate">{c.name}</span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                          </div>
                        );
                      })()}
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
