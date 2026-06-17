"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup, Marker, PolylineOptions } from "leaflet";
import { LiveFlightData } from "@/lib/ifc";
import { planeIcon } from "@/lib/plane-marker";
import { splitAntimeridian } from "@/lib/geo";

export default function LiveMap({ live }: { live: LiveFlightData }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const plannedRef = useRef<LayerGroup | null>(null);
  const trackRef = useRef<LayerGroup | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const fittedRef = useRef(false);

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      const map = L.map(elRef.current, {
        center: [live.position.lat, live.position.lon],
        zoom: 4,
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
      });
      L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png", {
        subdomains: "abcd",
        maxZoom: 12,
      }).addTo(map);
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      plannedRef.current = trackRef.current = null;
      markerRef.current = null;
      fittedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update geometry smoothly on each poll — no full redraw, no re-fit.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (cancelled || !map) return;

      const planned = live.plannedPath;
      const flown = live.track;
      const pos: [number, number] = [live.position.lat, live.position.lon];

      // Draw a multi-segment line (split at the antimeridian) into a layer group.
      const drawLine = (
        ref: typeof plannedRef,
        pts: { lat: number; lon: number }[],
        style: PolylineOptions
      ) => {
        if (!ref.current) ref.current = L.layerGroup().addTo(map);
        ref.current.clearLayers();
        if (pts.length < 2) return;
        for (const seg of splitAntimeridian(pts)) {
          if (seg.length < 2) continue;
          L.polyline(
            seg.map((p) => [p.lat, p.lon] as [number, number]),
            style
          ).addTo(ref.current!);
        }
      };

      drawLine(plannedRef, planned, { color: "#4f8cff", weight: 1.5, opacity: 0.45, dashArray: "4 6" });
      drawLine(trackRef, flown, { color: "#38d6e0", weight: 2.5, opacity: 0.9 });

      // Aircraft marker — move + rotate in place.
      const icon = planeIcon(L, { heading: live.position.track, color: "#5fe3ec", size: 26, glow: true });
      if (!markerRef.current) {
        markerRef.current = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(map);
      } else {
        markerRef.current.setLatLng(pos);
        markerRef.current.setIcon(icon);
      }

      // Fit bounds only on the first load so the view doesn't jump every poll.
      // Bias toward the flown track + current position (the planned route can
      // span the globe and would otherwise zoom too far out).
      if (!fittedRef.current) {
        const pts: [number, number][] = [
          ...flown.map((p) => [p.lat, p.lon] as [number, number]),
          pos,
        ];
        if (pts.length >= 2) {
          try {
            map.fitBounds(pts, { padding: [40, 40], maxZoom: 6 });
          } catch {
            map.setView(pos, 5);
          }
        } else {
          map.setView(pos, 5);
        }
        fittedRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [live]);

  return <div ref={elRef} className="h-full w-full rounded-2xl" />;
}
