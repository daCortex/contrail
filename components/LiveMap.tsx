"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup, Marker, PolylineOptions } from "leaflet";
import { LiveFlightData } from "@/lib/ifc";
import { planeIcon } from "@/lib/plane-marker";
import { unwrapLongitudes, haversineKm } from "@/lib/geo";

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
      const here = { lat: live.position.lat, lon: live.position.lon };

      // Remaining leg: from the aircraft forward along the filed route. Find the
      // nearest planned waypoint (great-circle distance, so it's correct across
      // the antimeridian and near the poles) and keep everything ahead of it.
      let remainingWp: { lat: number; lon: number }[] = [];
      if (planned.length) {
        let bestI = 0;
        let bestD = Infinity;
        for (let i = 0; i < planned.length; i++) {
          const d = haversineKm(here, planned[i]);
          if (d < bestD) {
            bestD = d;
            bestI = i;
          }
        }
        remainingWp = planned.slice(bestI + 1);
        if (remainingWp.length === 0) remainingWp = [planned[planned.length - 1]];
      }

      // Unwrap the WHOLE journey (flown → plane → remaining) in one continuous
      // longitude frame so antimeridian crossings flow smoothly, then split it
      // back into the completed track and the remaining leg at the plane.
      const journey = [...flown, here, ...remainingWp];
      const u = unwrapLongitudes(journey);
      const flownU = u.slice(0, flown.length + 1); // includes the plane
      const remainingU = u.slice(flown.length); // plane → destination
      const posU = u[flown.length]; // the plane in the unwrapped frame
      const pos: [number, number] = [posU.lat, posU.lon];

      const drawLine = (
        ref: typeof plannedRef,
        pts: { lat: number; lon: number }[],
        style: PolylineOptions
      ) => {
        if (!ref.current) ref.current = L.layerGroup().addTo(map);
        ref.current.clearLayers();
        if (pts.length < 2) return;
        L.polyline(
          pts.map((p) => [p.lat, p.lon] as [number, number]),
          style
        ).addTo(ref.current);
      };

      // Completed track = solid cyan; remaining leg = faint dashed.
      drawLine(trackRef, flownU, { color: "#38d6e0", weight: 2.5, opacity: 0.95 });
      drawLine(plannedRef, remainingU, { color: "#8fa6c8", weight: 1.2, opacity: 0.4, dashArray: "2 7" });

      // Aircraft marker — move + rotate in place.
      const icon = planeIcon(L, { heading: live.position.track, color: "#5fe3ec", size: 26, glow: true });
      if (!markerRef.current) {
        markerRef.current = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(map);
      } else {
        markerRef.current.setLatLng(pos);
        markerRef.current.setIcon(icon);
      }

      // Fit bounds only on the first load so the view doesn't jump every poll.
      // Show the whole journey (unwrapped, so trans-antimeridian routes fit).
      if (!fittedRef.current) {
        const pts: [number, number][] = u.map((p) => [p.lat, p.lon] as [number, number]);
        if (pts.length >= 2) {
          try {
            map.fitBounds(pts, { padding: [40, 40], maxZoom: 6 });
          } catch {
            map.setView(pos, 5);
          }
          // Lock the fit only once we have the forward route, so a sparse first
          // frame doesn't pin a half-view.
          if (remainingWp.length > 0) fittedRef.current = true;
        } else {
          map.setView(pos, 5);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [live]);

  return <div ref={elRef} className="h-full w-full rounded-2xl" />;
}
