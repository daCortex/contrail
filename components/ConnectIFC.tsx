"use client";

import { useState } from "react";
import { IFCConnection, NewFlight } from "@/lib/types";
import { connectIFC, syncIFC } from "@/lib/ifc";
import { fmtDurationLong } from "@/lib/stats";

const GRADES = ["", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

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
  const [err, setErr] = useState<string>("");

  if (!open) return null;

  const connect = async () => {
    if (!username.trim()) return;
    setBusy("connecting");
    setMsg("");
    setErr("");
    try {
      const profile = await connectIFC(username);
      setIfc((prev) => ({
        ...prev,
        connected: true,
        username: profile.username,
        userId: profile.userId,
        profile,
      }));
      setMsg(`Linked @${profile.username}.`);
      await sync(profile.userId, true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not link that account.");
    } finally {
      setBusy("idle");
    }
  };

  const sync = async (userId?: string, silent = false) => {
    const uid = userId || ifc.userId;
    if (!uid) return;
    setBusy("syncing");
    if (!silent) {
      setMsg("");
      setErr("");
    }
    try {
      const r = await syncIFC(uid, 15);
      onImport(r.flights);
      setIfc((prev) => ({ ...prev, lastSync: Date.now() }));
      setMsg(
        r.count
          ? `Imported ${r.count} flights — ${r.mapped} with a route to map (of ${r.totalCount.toLocaleString()} in your logbook).`
          : "No flights found in your logbook yet."
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setBusy("idle");
    }
  };

  const disconnect = () => {
    setIfc((prev) => ({ ...prev, connected: false, autoSync: false, userId: "", profile: null }));
    setMsg("");
    setErr("");
  };

  const toggleAuto = () => setIfc((prev) => ({ ...prev, autoSync: !prev.autoSync }));

  const p = ifc.profile;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
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
          Link your Infinite Flight Community (IFC) account to pull your real career stats and import
          flights straight from your in-app logbook.
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
                placeholder="your_ifc_username"
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
            <p className="text-[11px] text-dim">
              Use your community.infiniteflight.com username (the one on your IFC profile).
            </p>
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
                  {p?.grade ? (
                    <span className="chip rounded-full px-2 py-0.5 text-[10px]">
                      {GRADES[p.grade] || `Grade ${p.grade}`}
                    </span>
                  ) : null}
                </div>
                {p?.virtualOrganization && (
                  <div className="text-xs text-dim">{p.virtualOrganization}</div>
                )}
              </div>
              <button onClick={disconnect} className="text-xs text-rose hover:underline">
                Disconnect
              </button>
            </div>

            {/* Real career stats */}
            {p && (
              <div className="grid grid-cols-3 gap-2">
                <Stat label="Flight time" value={p.flightTimeMin != null ? fmtDurationLong(p.flightTimeMin) : "—"} />
                <Stat label="Landings" value={p.landingCount?.toLocaleString() ?? "—"} />
                <Stat label="Online flights" value={p.onlineFlights?.toLocaleString() ?? "—"} />
                <Stat label="XP" value={p.xp?.toLocaleString() ?? "—"} />
                <Stat label="ATC ops" value={p.atcOperations?.toLocaleString() ?? "—"} />
                <Stat label="Violations" value={p.violations?.toLocaleString() ?? "—"} />
              </div>
            )}

            {/* Auto-log toggle */}
            <div className="card-2 flex items-center justify-between p-4">
              <div className="pr-4">
                <div className="text-sm font-medium text-vapor">Log flights automatically</div>
                <div className="text-xs text-dim">
                  Re-import new logbook flights whenever you open Contrail.
                </div>
              </div>
              <button
                role="switch"
                aria-checked={ifc.autoSync}
                onClick={toggleAuto}
                className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors"
                style={{
                  backgroundColor: ifc.autoSync ? "var(--color-trail)" : "var(--color-line)",
                }}
              >
                <span
                  className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: ifc.autoSync ? "translateX(20px)" : "translateX(0)" }}
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
                {busy === "syncing" ? "Syncing…" : "Sync logbook"}
              </button>
            </div>
          </div>
        )}

        {msg && (
          <div className="mt-4 rounded-lg border border-[color:var(--color-trail)]/30 bg-[color:var(--color-trail)]/8 px-3 py-2 text-xs text-trail-soft">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-4 rounded-lg border border-[color:var(--color-rose)]/40 bg-[color:var(--color-rose)]/8 px-3 py-2 text-xs text-rose">
            {err}
          </div>
        )}

        <p className="mt-5 text-[11px] leading-relaxed text-dim">
          Stats and flights come from the official Infinite Flight Live API. Your logbook is stored
          locally on this device; Contrail never posts on your behalf.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-2 px-3 py-2">
      <div className="truncate text-sm font-semibold text-vapor">{value}</div>
      <div className="text-[10px] tracking-wide text-dim uppercase">{label}</div>
    </div>
  );
}
