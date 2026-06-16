"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { fetchLive, LiveFlightData } from "@/lib/ifc";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

const POLL_MS = 25000;

export default function LivePanel({
  userId,
  connected,
}: {
  userId: string;
  connected: boolean;
}) {
  const [live, setLive] = useState<LiveFlightData | null>(null);
  const [checked, setChecked] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!connected || !userId) {
      setLive(null);
      return;
    }
    let active = true;
    const poll = async () => {
      const l = await fetchLive(userId);
      if (active) {
        setLive(l);
        setChecked(true);
      }
    };
    poll();
    timer.current = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [userId, connected]);

  if (!connected || !checked || !live) return null;

  const p = live.position;
  return (
    <div className="card overflow-hidden border-[color:var(--color-trail)]/40 p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-[color:var(--color-line)] p-4">
        <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--color-trail)]/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-trail-soft uppercase">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-trail)]" />
          Live now
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-vapor">
            {live.callsign || "In flight"}
            <span className="text-dim">·</span>
            <span className="font-normal text-haze">{live.aircraft || "Aircraft"}</span>
          </div>
          <div className="truncate text-[11px] text-dim">
            {live.origin || "—"} → {live.destination || "—"}
            {live.originCity && live.destinationCity
              ? ` · ${live.originCity} to ${live.destinationCity}`
              : ""}
            {" · "}
            {live.sessionName}
            {live.virtualOrganization ? ` · ${live.virtualOrganization}` : ""}
          </div>
        </div>
        <div className="flex gap-4 text-right">
          <Telem label="ALT" value={`${p.altitude.toLocaleString()} ft`} />
          <Telem label="GS" value={`${p.speed} kt`} />
          <Telem label="HDG" value={`${p.heading}°`} />
        </div>
      </div>
      <div className="h-[300px]">
        <LiveMap live={live} />
      </div>
    </div>
  );
}

function Telem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-sm text-trail-soft">{value}</div>
      <div className="text-[10px] tracking-wide text-dim">{label}</div>
    </div>
  );
}
