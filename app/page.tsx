"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useFlightbook } from "@/lib/store";
import { computeStats, fmtDurationLong, fmtKm } from "@/lib/stats";
import { Flight, NewFlight } from "@/lib/types";
import FlightForm from "@/components/FlightForm";
import FlightList from "@/components/FlightList";
import ConnectIFC from "@/components/ConnectIFC";
import StatsPanel from "@/components/StatsPanel";
import Achievements from "@/components/Achievements";
import Challenges from "@/components/Challenges";
import YearInReview from "@/components/YearInReview";
import LivePanel from "@/components/LivePanel";
import FlightDetail from "@/components/FlightDetail";
import LoginModal from "@/components/LoginModal";
import { SparkIcon, PlusIcon } from "@/components/icons";
import { syncIFC, connectIFC } from "@/lib/ifc";
import { useSession, logoutSession } from "@/lib/auth-client";

const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-dim">Loading map…</div>
  ),
});
const CountriesMap = dynamic(() => import("@/components/CountriesMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-dim">Loading map…</div>
  ),
});
const GlobeMap = dynamic(() => import("@/components/GlobeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-dim">Loading globe…</div>
  ),
});

type Tab = "map" | "stats" | "awards" | "challenges" | "logbook";
type MapMode = "routes" | "globe" | "countries";
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
  const [mapMode, setMapMode] = useState<MapMode>("routes");
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Flight | null>(null);
  const [detail, setDetail] = useState<Flight | null>(null);
  const [ifcOpen, setIfcOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { session, setSession } = useSession();
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

  const handleLogin = async (s: { username: string; userId: string }) => {
    setSession(s);
    // Logging in also connects your flightbook to that account.
    try {
      const profile = await connectIFC(s.username);
      setIfc((prev) => ({
        ...prev,
        connected: true,
        username: profile.username,
        userId: profile.userId,
        profile,
      }));
      flash(`Logged in as @${profile.username}.`);
    } catch {
      flash(`Logged in as @${s.username}.`);
    }
  };

  const handleLogout = async () => {
    await logoutSession();
    setSession(null);
    setIfc((prev) => ({ ...prev, connected: false, autoSync: false, userId: "", profile: null }));
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
            <Link
              href="/track"
              className="hidden rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor sm:block"
            >
              Track
            </Link>
            <Link
              href="/leaderboard"
              className="hidden rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor sm:block"
            >
              Leaderboard
            </Link>
            {ifc.connected && ifc.username && (
              <Link
                href={`/u/${encodeURIComponent(ifc.username)}`}
                className="hidden rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor sm:block"
              >
                Profile
              </Link>
            )}
            {flights.length > 0 && (
              <button
                onClick={() => setWrappedOpen(true)}
                className="hidden items-center gap-1.5 rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:border-[color:var(--color-amber)]/40 hover:text-amber sm:flex"
              >
                <SparkIcon size={14} /> Wrapped
              </button>
            )}
            {ifc.connected ? (
              <button
                onClick={() => setIfcOpen(true)}
                className="chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs"
              >
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-trail)]" />
                @{ifc.username}
                {session && session.username.toLowerCase() === ifc.username.toLowerCase() && (
                  <span className="text-[10px] opacity-80">· verified</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="rounded-full border border-[color:var(--color-trail)]/40 px-3 py-1.5 text-xs text-trail-soft hover:bg-[color:var(--color-trail)]/10"
              >
                Log in with IFC
              </button>
            )}
            <button
              onClick={openNew}
              className="btn-trail flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
            >
              <PlusIcon size={16} strokeWidth={2.2} /> Log flight
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mt-3 flex gap-1">
          {(
            [
              ["map", "Map"],
              ["stats", "Statistics"],
              ["awards", "Awards"],
              ["challenges", "Challenges"],
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

      {/* Live flight (shows only when the pilot is airborne in IF) */}
      {ifc.connected && (
        <div className="mb-6">
          <LivePanel userId={ifc.userId} connected={ifc.connected} />
        </div>
      )}

      {/* Tab content */}
      {tab === "map" && (
        <div className="space-y-6">
          <div className="relative">
            {/* Routes / Countries toggle */}
            <div className="absolute left-3 top-3 z-[1000] flex rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-night)]/85 p-0.5 backdrop-blur">
              {(
                [
                  ["routes", "Routes"],
                  ["globe", "Globe"],
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
            {mapMode === "countries" && (
              <div className="absolute right-3 top-3 z-[1000] rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-night)]/85 px-3 py-1 text-xs text-trail-soft backdrop-blur">
                {stats.uniqueCountries} / 195 countries
              </div>
            )}
            <div className="card h-[60vh] min-h-[420px] overflow-hidden p-1.5">
              {mapMode === "routes" && <RouteMap flights={flights} />}
              {mapMode === "globe" && <GlobeMap flights={flights} visited={stats.visitedCC} />}
              {mapMode === "countries" && <CountriesMap visited={stats.visitedCC} />}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <StatsPanel stats={stats} />
            <div>
              <FlightList flights={flights} onEdit={openEdit} onDelete={removeFlight} onSelect={setDetail} />
            </div>
          </div>
        </div>
      )}

      {tab === "stats" && <StatsPanel stats={stats} />}

      {tab === "awards" && <Achievements stats={stats} flights={flights} />}

      {tab === "challenges" && <Challenges flights={flights} />}

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
            <FlightList flights={flights} onEdit={openEdit} onDelete={removeFlight} onSelect={setDetail} />
          </div>
        </div>
      )}

      <footer className="mt-12 text-center text-[11px] text-dim">
        Contrail · flights stored locally on this device · {flights.length} logged
        <span className="mx-1.5 opacity-40">·</span>
        <a href="https://discord.gg/f4rhKFa6MD" target="_blank" rel="noreferrer" className="text-trail-soft hover:text-vapor">
          Community &amp; support
        </a>
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
        onLogout={handleLogout}
      />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={handleLogin} />
      <YearInReview open={wrappedOpen} onClose={() => setWrappedOpen(false)} flights={flights} />
      <FlightDetail
        flight={detail}
        onClose={() => setDetail(null)}
        onEdit={(f) => {
          setDetail(null);
          openEdit(f);
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[2100] -translate-x-1/2 rounded-full border border-[color:var(--color-trail)]/40 bg-[color:var(--color-panel-2)] px-4 py-2 text-sm text-trail-soft shadow-2xl">
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
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden>
      <defs>
        <linearGradient id="contrail-mark" x1="8" y1="30" x2="30" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-trail)" />
          <stop offset="1" stopColor="var(--color-trail-soft)" />
        </linearGradient>
        <linearGradient id="contrail-tile" x1="3" y1="3" x2="35" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#151b2b" />
          <stop offset="1" stopColor="#0d1119" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="33" height="33" rx="10" fill="url(#contrail-tile)" stroke="var(--color-line)" />
      {/* vapor trail */}
      <path d="M8 28C15 26 21 22 26.5 12.5" stroke="url(#contrail-mark)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9.5 30.5C16 29 21.5 25.5 26 18" stroke="var(--color-trail)" strokeWidth="1.4" strokeLinecap="round" opacity="0.3" />
      {/* jet at the head of the trail */}
      <path d="M26.6 12.2 30 8.6l-1 5.2-4.4 1.1 2-2.7Z" fill="var(--color-trail-soft)" />
    </svg>
  );
}
