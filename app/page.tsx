"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useFlightbook } from "@/lib/store";
import { computeStats, fmtDurationLong, fmtKm } from "@/lib/stats";
import { Flight, NewFlight } from "@/lib/types";
import FlightForm from "@/components/FlightForm";
import FlightList from "@/components/FlightList";
import ConnectIFC from "@/components/ConnectIFC";
import StatsPanel from "@/components/StatsPanel";
import { syncIFC } from "@/lib/ifc";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-dim">Loading map…</div>
  ),
});

type Tab = "map" | "stats" | "logbook";
const SIX_HOURS = 6 * 60 * 60 * 1000;

export default function Home() {
  const {
    flights,
    ifc,
    setIfc,
    ready,
    addFlight,
    addMany,
    updateFlight,
    removeFlight,
    clearAll,
  } = useFlightbook();

  const [tab, setTab] = useState<Tab>("map");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Flight | null>(null);
  const [ifcOpen, setIfcOpen] = useState(false);
  const [toast, setToast] = useState<string>("");
  const autoRan = useRef(false);

  const stats = useMemo(() => computeStats(flights), [flights]);

  // Auto-log: when connected with auto-sync on, pull recent flights on load
  // (rate-limited to once per 6h so it doesn't spam the logbook).
  useEffect(() => {
    if (!ready || autoRan.current) return;
    if (ifc.connected && ifc.autoSync && ifc.userId) {
      const stale = !ifc.lastSync || Date.now() - ifc.lastSync > SIX_HOURS;
      if (stale) {
        autoRan.current = true;
        (async () => {
          try {
            const r = await syncIFC(ifc.userId, 15);
            addMany(r.flights);
            setIfc((prev) => ({ ...prev, lastSync: Date.now() }));
            if (r.count) flash(`Synced ${r.count} flights from your Infinite Flight logbook.`);
          } catch {
            /* silent on auto-sync */
          }
        })();
      }
    }
  }, [ready, ifc, addMany, setIfc]);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 4000);
  };

  const handleSave = (f: NewFlight, id?: string) => {
    if (id) updateFlight(id, f);
    else addFlight(f, "manual");
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (f: Flight) => {
    setEditing(f);
    setFormOpen(true);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(flights, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contrail-logbook.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      {/* Header */}
      <header className="sticky top-0 z-40 -mx-4 mb-6 border-b border-[color:var(--color-line-soft)] bg-[color:var(--color-night)]/85 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div>
              <div className="text-lg font-semibold tracking-tight text-vapor">Contrail</div>
              <div className="-mt-0.5 text-[11px] text-dim">your flightbook</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ifc.connected ? (
              <button
                onClick={() => setIfcOpen(true)}
                className="chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
              >
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-trail)]" />
                @{ifc.username}
                {ifc.autoSync && <span className="text-[10px] opacity-80">· auto</span>}
              </button>
            ) : (
              <button
                onClick={() => setIfcOpen(true)}
                className="rounded-full border border-[color:var(--color-trail)]/40 px-3 py-1.5 text-xs text-trail-soft hover:bg-[color:var(--color-trail)]/10"
              >
                Connect IFC
              </button>
            )}
            <button
              onClick={openNew}
              className="btn-trail flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
            >
              <span className="text-base leading-none">＋</span> Log flight
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-3 flex gap-1">
          {(
            [
              ["map", "Map"],
              ["stats", "Statistics"],
              ["logbook", "Logbook"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                tab === t
                  ? "bg-[color:var(--color-panel-2)] text-vapor"
                  : "text-dim hover:text-haze"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Summary strip — always visible */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label="Flights" value={stats.totalFlights.toLocaleString()} />
        <Mini label="Time aloft" value={fmtDurationLong(stats.totalMinutes)} />
        <Mini label="Distance" value={`${fmtKm(stats.totalDistanceKm)} km`} />
        <Mini label="Countries" value={String(stats.uniqueCountries)} />
      </div>

      {/* Tab content */}
      {tab === "map" && (
        <div className="space-y-6">
          <div className="card h-[60vh] min-h-[420px] overflow-hidden p-1.5">
            <RouteMap flights={flights} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <StatsPanel stats={stats} />
            <div>
              <FlightList flights={flights} onEdit={openEdit} onDelete={removeFlight} />
            </div>
          </div>
        </div>
      )}

      {tab === "stats" && <StatsPanel stats={stats} />}

      {tab === "logbook" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={exportJson}
              disabled={flights.length === 0}
              className="rounded-lg border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:bg-[color:var(--color-line)] disabled:opacity-40"
            >
              Export JSON
            </button>
            <button
              onClick={() => {
                if (confirm("Delete all flights? This cannot be undone.")) clearAll();
              }}
              disabled={flights.length === 0}
              className="rounded-lg border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-rose hover:bg-[color:var(--color-line)] disabled:opacity-40"
            >
              Clear all
            </button>
          </div>
          <div className="card p-4">
            <FlightList flights={flights} onEdit={openEdit} onDelete={removeFlight} />
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-[11px] text-dim">
        Contrail · flights stored locally on this device · {flights.length} logged
      </footer>

      {/* Modals */}
      <FlightForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        editing={editing}
      />
      <ConnectIFC
        open={ifcOpen}
        onClose={() => setIfcOpen(false)}
        ifc={ifc}
        setIfc={setIfc}
        onImport={(fl) => addMany(fl)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[color:var(--color-trail)]/40 bg-[color:var(--color-panel-2)] px-4 py-2 text-sm text-trail-soft shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-2 px-4 py-3">
      <div className="text-lg font-semibold text-vapor">{value}</div>
      <div className="text-[11px] tracking-wide text-dim uppercase">{label}</div>
    </div>
  );
}

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="15" stroke="var(--color-trail)" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M5 22c6-1 9-3 12-7s5-7 9-9"
        stroke="var(--color-trail)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 6l5 0 0 5"
        stroke="var(--color-amber)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="19" r="2" fill="var(--color-amber)" />
    </svg>
  );
}
