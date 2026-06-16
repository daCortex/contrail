"use client";

import dynamic from "next/dynamic";
import { Flight } from "@/lib/types";
import { resolvePoint } from "@/lib/airports";
import { fmtDurationLong, fmtKm } from "@/lib/stats";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

export default function FlightDetail({
  flight,
  onClose,
  onEdit,
}: {
  flight: Flight | null;
  onClose: () => void;
  onEdit: (f: Flight) => void;
}) {
  if (!flight) return null;
  const f = flight;
  const a = resolvePoint(f.from, f.fromGeo);
  const b = resolvePoint(f.to, f.toGeo);
  const hasRoute = !!(a && b);
  const speed = f.durationMin > 0 && f.distanceKm > 0 ? Math.round(f.distanceKm / (f.durationMin / 60)) : 0;
  const co2 = f.fuelKg ? (f.fuelKg * 3.16) / 1000 : 0;

  const meta: { label: string; value: string }[] = [
    { label: "Date", value: f.date ? new Date(f.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "long", day: "numeric" }) : "—" },
    { label: "Aircraft", value: f.aircraft || "—" },
    { label: f.source === "ifc" ? "Livery / airline" : "Airline", value: f.airline || "—" },
    { label: f.source === "ifc" ? "Callsign" : "Flight no.", value: f.flightNumber || "—" },
    { label: "Distance", value: f.distanceKm ? `${fmtKm(f.distanceKm)} km` : "—" },
    { label: "Duration", value: f.durationMin ? fmtDurationLong(f.durationMin) : "—" },
    { label: "Avg ground speed", value: speed ? `${speed.toLocaleString()} km/h · ${Math.round(speed / 1.852)} kt` : "—" },
    ...(f.server ? [{ label: "Server", value: f.server }] : []),
    ...(f.landings != null ? [{ label: "Landings", value: String(f.landings) }] : []),
    ...(f.fuelKg ? [{ label: "Fuel burned", value: `${fmtKm(f.fuelKg)} kg` }] : []),
    ...(co2 ? [{ label: "CO₂", value: `${co2.toFixed(2)} t` }] : []),
    ...(f.cabin ? [{ label: "Cabin", value: f.cabin }] : []),
    ...(f.seat ? [{ label: "Seat", value: f.seat }] : []),
    ...(f.registration ? [{ label: "Registration", value: f.registration }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="card my-8 w-full max-w-3xl overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-line)] p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xl font-bold text-vapor">
              <span className="font-mono">{f.from || "—"}</span>
              <span className="text-trail">✈</span>
              <span className="font-mono">{f.to || "—"}</span>
              {f.source === "ifc" && (
                <span className="chip rounded px-1.5 py-0.5 text-[9px]">IFC</span>
              )}
            </div>
            <div className="mt-0.5 truncate text-xs text-haze">
              {a?.city ?? f.from} {b ? `→ ${b.city}` : ""}
              {a?.country && b?.country ? ` · ${a.country} → ${b.country}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(f)}
              className="rounded-lg border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:bg-[color:var(--color-line)]"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-haze hover:bg-[color:var(--color-line)]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Map */}
        {hasRoute && (
          <div className="h-[260px] border-b border-[color:var(--color-line)]">
            <RouteMap flights={[f]} />
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
          {meta.map((m) => (
            <div key={m.label}>
              <div className="text-[10px] tracking-wide text-dim uppercase">{m.label}</div>
              <div className="mt-0.5 text-sm text-vapor">{m.value}</div>
            </div>
          ))}
        </div>

        {f.note && (
          <div className="border-t border-[color:var(--color-line)] px-5 py-4 text-sm text-haze">
            <span className="text-dim">Note · </span>
            {f.note}
          </div>
        )}
      </div>
    </div>
  );
}
