"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { fetchWorld, WorldFlight } from "@/lib/ifc";
import { planeIcon } from "@/lib/plane-marker";

const POLL_MS = 30000;
const CAP = 1200; // max markers rendered at once (viewport-culled)

export default function GlobalLiveMap() {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const flightsRef = useRef<WorldFlight[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  const [total, setTotal] = useState(0);
  const [shown, setShown] = useState(0);
  const [servers, setServers] = useState<Record<string, number>>({});
  const [server, setServer] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const serverRef = useRef("all");
  serverRef.current = server;

  // Render visible flights (viewport-culled, capped), diffing existing markers.
  const render = () => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const bounds = map.getBounds().pad(0.25);
    const sel = serverRef.current;

    const visible: WorldFlight[] = [];
    for (const f of flightsRef.current) {
      if (sel !== "all" && f.sv !== sel) continue;
      if (!bounds.contains([f.la, f.lo])) continue;
      visible.push(f);
      if (visible.length >= CAP) break;
    }

    const seen = new Set<string>();
    for (const f of visible) {
      seen.add(f.fid);
      const icon = planeIcon(L, { heading: f.h, color: "#e9b864", size: 18 });
      const existing = markersRef.current.get(f.fid);
      if (existing) {
        existing.setLatLng([f.la, f.lo]);
        existing.setIcon(icon);
        existing.setPopupContent(popupHtml(f));
      } else {
        const m = L.marker([f.la, f.lo], { icon, riseOnHover: true });
        m.bindPopup(popupHtml(f));
        m.addTo(map);
        markersRef.current.set(f.fid, m);
      }
    }
    // Remove markers no longer visible.
    for (const [fid, m] of markersRef.current) {
      if (!seen.has(fid)) {
        map.removeLayer(m);
        markersRef.current.delete(fid);
      }
    }
    setShown(visible.length);
  };

  const load = async () => {
    try {
      const data = await fetchWorld();
      flightsRef.current = data.flights;
      setTotal(data.total);
      setServers(data.servers);
      render();
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(elRef.current, {
        center: [30, 5],
        zoom: 3,
        minZoom: 2,
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
        preferCanvas: true,
      });
      L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png", {
        subdomains: "abcd",
        maxZoom: 12,
      }).addTo(map);
      mapRef.current = map;
      map.on("moveend zoomend", render);
      await load();
      timer = setInterval(load, POLL_MS);
    })();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render when the server filter changes.
  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server]);

  const serverList = Object.entries(servers).sort((a, b) => b[1] - a[1]);

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="h-full w-full rounded-2xl" />

      {/* HUD */}
      <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex flex-wrap items-center gap-2">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-night)]/85 px-3 py-1.5 text-xs backdrop-blur">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-trail)]" />
          <span className="text-vapor">{total.toLocaleString()}</span>
          <span className="text-dim">flying now</span>
        </div>
        <div className="pointer-events-auto flex rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-night)]/85 p-0.5 text-xs backdrop-blur">
          <button
            onClick={() => setServer("all")}
            className={`rounded-full px-2.5 py-1 ${server === "all" ? "bg-[color:var(--color-trail)] text-[#04121a]" : "text-haze"}`}
          >
            All
          </button>
          {serverList.map(([name, n]) => (
            <button
              key={name}
              onClick={() => setServer(name)}
              className={`rounded-full px-2.5 py-1 ${server === name ? "bg-[color:var(--color-trail)] text-[#04121a]" : "text-haze"}`}
              title={`${n} flights`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {shown >= CAP && (
        <div className="absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-night)]/85 px-3 py-1 text-[11px] text-dim backdrop-blur">
          Showing {CAP.toLocaleString()} — zoom in to see more
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center text-sm text-dim">
          Loading live flights…
        </div>
      )}
    </div>
  );
}

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);
}

function popupHtml(f: WorldFlight): string {
  const track = `/track?q=${encodeURIComponent(f.cs || f.u)}`;
  const prof = f.u ? `/u/${encodeURIComponent(f.u)}` : "";
  return (
    `<div style="min-width:150px">` +
    `<div style="font-weight:600;color:#f1f4fa">${esc(f.cs || f.u || "Flight")}</div>` +
    `<div style="color:#a7b2c5;font-size:11px">${esc(f.ac || "Aircraft")} · ${esc(f.sv)}</div>` +
    `<div style="color:#62708a;font-size:11px">${f.al.toLocaleString()} ft · ${f.gs} kt</div>` +
    `<div style="margin-top:6px;display:flex;gap:10px">` +
    `<a href="${track}" style="color:#6fe0e8;font-size:12px;text-decoration:none">Track →</a>` +
    (prof ? `<a href="${prof}" style="color:#a7b2c5;font-size:12px;text-decoration:none">Profile</a>` : "") +
    `</div></div>`
  );
}
