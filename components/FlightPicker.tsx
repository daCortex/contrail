"use client";

import { useMemo, useState } from "react";
import { Flight } from "@/lib/types";
import { resolvePoint } from "@/lib/airports";
import { fmtDuration } from "@/lib/stats";
import { CloseIcon, SearchIcon, PlaneIcon } from "./icons";

export default function FlightPicker({
  open,
  onClose,
  flights,
  selected,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  flights: Flight[];
  selected: string[];
  onSave: (ids: string[]) => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));
  const [q, setQ] = useState("");

  // Reset the working set whenever the modal opens.
  useMemo(() => {
    if (open) setPicked(new Set(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return flights;
    return flights.filter((f) =>
      [f.from, f.to, f.airline, f.aircraft, f.flightNumber].join(" ").toLowerCase().includes(s)
    );
  }, [flights, q]);

  if (!open) return null;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="card my-8 flex max-h-[85vh] w-full max-w-2xl flex-col p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-vapor">Add flights to challenge</h2>
            <p className="text-xs text-haze">{picked.size} selected</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-haze hover:bg-[color:var(--color-line)]">
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="relative mb-3">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
            <SearchIcon size={15} />
          </span>
          <input
            className="input w-full py-2 pl-9 pr-3 text-sm"
            placeholder="Search your logbook…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-dim">No flights match.</div>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((f) => {
                const a = resolvePoint(f.from, f.fromGeo);
                const b = resolvePoint(f.to, f.toGeo);
                const on = picked.has(f.id);
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => toggle(f.id)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                        on
                          ? "border-[color:var(--color-trail)]/50 bg-[color:var(--color-trail)]/8"
                          : "border-[color:var(--color-line)] hover:border-[color:var(--color-line)] hover:bg-[color:var(--color-line)]/40"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          on ? "border-[color:var(--color-trail)] bg-[color:var(--color-trail)] text-[#04121a]" : "border-[color:var(--color-dim)]"
                        }`}
                      >
                        {on && <CheckMark />}
                      </span>
                      <span className="w-10 shrink-0 text-[10px] text-dim">{f.date.slice(5)}</span>
                      <span className="font-mono text-sm font-semibold text-vapor">{f.from || "—"}</span>
                      <PlaneIcon size={12} className="text-trail/60" />
                      <span className="font-mono text-sm font-semibold text-vapor">{f.to || "—"}</span>
                      <span className="flex-1 truncate text-xs text-dim">
                        {b?.country || a?.country || ""} · {f.aircraft || "—"}
                      </span>
                      <span className="shrink-0 text-[11px] text-haze">{fmtDuration(f.durationMin)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-[color:var(--color-line)] pt-4">
          <button onClick={onClose} className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-haze hover:bg-[color:var(--color-line)]">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave([...picked]);
              onClose();
            }}
            className="btn-trail rounded-lg px-5 py-2 text-sm"
          >
            Save {picked.size} flight{picked.size === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}
