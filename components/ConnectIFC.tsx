"use client";

import { useState } from "react";
import { IFCConnection, NewFlight } from "@/lib/types";
import { fetchProfile, pullRecentFlights } from "@/lib/ifc";

export default function ConnectIFC({
  open,
  onClose,
  ifc,
  setIfc,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  ifc: IFCConnection;
  setIfc: (updater: (prev: IFCConnection) => IFCConnection) => void;
  onImport: (flights: NewFlight[]) => void;
}) {
  const [username, setUsername] = useState(ifc.username);
  const [busy, setBusy] = useState<"idle" | "connecting" | "syncing">("idle");
  const [msg, setMsg] = useState<string>("");

  if (!open) return null;

  const connect = async () => {
    if (!username.trim()) return;
    setBusy("connecting");
    setMsg("");
    try {
      const profile = await fetchProfile(username);
      setIfc((prev) => ({
        ...prev,
        connected: true,
        username: profile.username,
        grade: profile.grade,
        xp: profile.xp,
        onlineFlights: profile.onlineFlights,
      }));
      setMsg(`Linked @${profile.username} · Grade ${profile.grade}`);
      // First link pulls an initial batch.
      await sync(true);
    } catch {
      setMsg("Could not link that account. Check the username and try again.");
    } finally {
      setBusy("idle");
    }
  };

  const sync = async (silent = false) => {
    setBusy("syncing");
    if (!silent) setMsg("");
    try {
      const flights = await pullRecentFlights(6);
      onImport(flights);
      setIfc((prev) => ({ ...prev, lastSync: Date.now() }));
      setMsg(`Imported ${flights.length} recent flights from your logbook.`);
    } catch {
      setMsg("Sync failed. Try again in a moment.");
    } finally {
      setBusy("idle");
    }
  };

  const disconnect = () => {
    setIfc((prev) => ({
      ...prev,
      connected: false,
      autoSync: false,
      grade: null,
      xp: null,
      onlineFlights: null,
    }));
    setMsg("");
  };

  const toggleAuto = () => {
    setIfc((prev) => ({ ...prev, autoSync: !prev.autoSync }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="card my-8 w-full max-w-lg p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vapor">Connect Infinite Flight</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-haze hover:bg-[color:var(--color-line)]"
          >
            ✕
          </button>
        </div>
        <p className="mb-5 text-sm text-haze">
          Link your Infinite Flight Community (IFC) account to pull flights straight from your
          in-app logbook — no manual entry needed.
        </p>

        {!ifc.connected ? (
          <div className="space-y-3">
            <label className="block text-xs text-haze">IFC username</label>
            <div className="flex gap-2">
              <span className="flex items-center rounded-l-lg border border-r-0 border-[color:var(--color-line)] bg-[color:var(--color-deep)] px-3 text-sm text-dim">
                @
              </span>
              <input
                className="input flex-1 rounded-l-none px-3 py-2 text-sm"
                value={username}
                placeholder="your_callsign"
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
              />
              <button
                onClick={connect}
                disabled={busy !== "idle" || !username.trim()}
                className="btn-trail rounded-lg px-4 py-2 text-sm disabled:opacity-40"
              >
                {busy === "connecting" ? "Linking…" : "Connect"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card-2 flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--color-trail)]/15 text-lg">
                ✈
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-vapor">
                  @{ifc.username}
                  <span className="chip rounded-full px-2 py-0.5 text-[10px]">
                    Grade {ifc.grade}
                  </span>
                </div>
                <div className="text-xs text-dim">
                  {ifc.xp?.toLocaleString()} XP · {ifc.onlineFlights} online flights
                </div>
              </div>
              <button
                onClick={disconnect}
                className="text-xs text-rose hover:underline"
              >
                Disconnect
              </button>
            </div>

            {/* Auto-log toggle */}
            <div className="card-2 flex items-center justify-between p-4">
              <div className="pr-4">
                <div className="text-sm font-medium text-vapor">Log flights automatically</div>
                <div className="text-xs text-dim">
                  New flights in your IFC logbook are imported on each sync.
                </div>
              </div>
              <button
                role="switch"
                aria-checked={ifc.autoSync}
                onClick={toggleAuto}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  ifc.autoSync ? "bg-[color:var(--color-trail)]" : "bg-[color:var(--color-line)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    ifc.autoSync ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-dim">
                {ifc.lastSync
                  ? `Last synced ${new Date(ifc.lastSync).toLocaleString()}`
                  : "Not synced yet"}
              </div>
              <button
                onClick={() => sync()}
                disabled={busy !== "idle"}
                className="rounded-lg border border-[color:var(--color-trail)]/40 px-4 py-2 text-sm text-trail-soft hover:bg-[color:var(--color-trail)]/10 disabled:opacity-40"
              >
                {busy === "syncing" ? "Syncing…" : "Sync now"}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div className="mt-4 rounded-lg border border-[color:var(--color-trail)]/30 bg-[color:var(--color-trail)]/8 px-3 py-2 text-xs text-trail-soft">
            {msg}
          </div>
        )}

        <p className="mt-5 text-[11px] leading-relaxed text-dim">
          Contrail stores your logbook locally on this device. The Infinite Flight link reads your
          public profile and recent flights; it never posts on your behalf.
        </p>
      </div>
    </div>
  );
}
