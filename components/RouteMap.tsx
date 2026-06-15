"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { Flight } from "@/lib/types";
import { resolvePoint } from "@/lib/airports";
import { greatCircleSegments } from "@/lib/geo";

export default function RouteMap({ flights }: { flights: Flight[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;

      const map = L.map(elRef.current, {
        center: [25, 10],
        zoom: 2,
        minZoom: 2,
        worldCopyJump: true,
        attributionControl: true,
        zoomControl: true,
      });

      L.tileLayer(
        "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      drawRoutes(L);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when flights change.
  useEffect(() => {
    (async () => {
      if (!mapRef.current || !layerRef.current) return;
      const L = (await import("leaflet")).default;
      drawRoutes(L);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flights]);

  async function drawRoutes(L: typeof import("leaflet")) {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    const airportFreq = new Map<string, { lat: number; lon: number; code: string; city: string; n: number }>();
    const routeFreq = new Map<string, number>();

    for (const f of flights) {
      const a = resolvePoint(f.from, f.fromGeo);
      const b = resolvePoint(f.to, f.toGeo);
      if (!a || !b) continue;
      const rk = [f.from.toUpperCase(), f.to.toUpperCase()].sort().join("-");
      routeFreq.set(rk, (routeFreq.get(rk) || 0) + 1);

      for (const ap of [a, b]) {
        const cur = airportFreq.get(ap.code);
        if (cur) cur.n += 1;
        else airportFreq.set(ap.code, { lat: ap.lat, lon: ap.lon, code: ap.code, city: ap.city, n: 1 });
      }
    }

    // Routes (great-circle arcs). Thicker = flown more often.
    for (const f of flights) {
      const a = resolvePoint(f.from, f.fromGeo);
      const b = resolvePoint(f.to, f.toGeo);
      if (!a || !b) continue;
      const rk = [f.from.toUpperCase(), f.to.toUpperCase()].sort().join("-");
      const weight = Math.min(1 + (routeFreq.get(rk) || 1) * 0.6, 4);
      const segments = greatCircleSegments(a, b);
      for (const seg of segments) {
        L.polyline(
          seg.map((p) => [p.lat, p.lon] as [number, number]),
          {
            color: "#38d6e0",
            weight,
            opacity: 0.55,
            smoothFactor: 1,
          }
        ).addTo(layer);
      }
    }

    // Airport dots. Bigger = visited more.
    const bounds: [number, number][] = [];
    for (const ap of airportFreq.values()) {
      const r = Math.min(3 + ap.n * 1.4, 11);
      L.circleMarker([ap.lat, ap.lon], {
        radius: r,
        color: "#e8eef7",
        weight: 1.5,
        fillColor: "#f5b942",
        fillOpacity: 0.9,
      })
        .bindPopup(
          `<strong>${ap.code}</strong> · ${ap.city}<br/><span style="color:#9fb0c8">${ap.n} visit${ap.n > 1 ? "s" : ""}</span>`
        )
        .addTo(layer);
      bounds.push([ap.lat, ap.lon]);
    }

    if (bounds.length >= 2) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="relative h-full w-full">
      <div ref={elRef} className="h-full w-full rounded-2xl" />
      {flights.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="card-2 px-5 py-3 text-sm text-haze">
            Your routes will appear here once you log a flight.
          </div>
        </div>
      )}
    </div>
  );
}
