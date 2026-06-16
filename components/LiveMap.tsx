"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { LiveFlightData } from "@/lib/ifc";

export default function LiveMap({ live }: { live: LiveFlightData }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current) return;
      if (!mapRef.current) {
        const map = L.map(elRef.current, {
          center: [live.position.lat, live.position.lon],
          zoom: 4,
          zoomControl: true,
          attributionControl: false,
          worldCopyJump: true,
        });
        L.tileLayer(
          "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
          { subdomains: "abcd", maxZoom: 12 }
        ).addTo(map);
        mapRef.current = map;
        layerRef.current = L.layerGroup().addTo(map);
      }
      draw(L);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  async function draw(L: typeof import("leaflet")) {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    const planned = live.plannedPath.map((p) => [p.lat, p.lon] as [number, number]);
    const flown = live.track.map((p) => [p.lat, p.lon] as [number, number]);

    if (planned.length > 1) {
      L.polyline(planned, { color: "#4f8cff", weight: 1.5, opacity: 0.5, dashArray: "4 6" }).addTo(layer);
    }
    if (flown.length > 1) {
      L.polyline(flown, { color: "#38d6e0", weight: 2.5, opacity: 0.9 }).addTo(layer);
    }

    const pos: [number, number] = [live.position.lat, live.position.lon];
    const icon = L.divIcon({
      className: "",
      html: `<div style="transform:rotate(${live.position.track}deg);font-size:20px;line-height:1;filter:drop-shadow(0 0 4px #38d6e0)">✈️</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    L.marker(pos, { icon }).addTo(layer);

    const pts = [...planned, ...flown, pos];
    if (pts.length >= 2) {
      try {
        map.fitBounds(pts, { padding: [30, 30], maxZoom: 7 });
      } catch {
        map.setView(pos, 5);
      }
    } else {
      map.setView(pos, 5);
    }
  }

  return <div ref={elRef} className="h-full w-full rounded-2xl" />;
}
