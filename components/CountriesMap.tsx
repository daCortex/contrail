"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON } from "leaflet";

export default function CountriesMap({ visited }: { visited: string[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletGeoJSON | null>(null);
  const visitedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    visitedRef.current = new Set(visited.map((c) => c.toUpperCase()));
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current) return;

      if (!mapRef.current) {
        const map = L.map(elRef.current, {
          center: [25, 10],
          zoom: 2,
          minZoom: 1,
          worldCopyJump: true,
          attributionControl: false,
          zoomControl: true,
        });
        L.tileLayer(
          "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png",
          { subdomains: "abcd", maxZoom: 10 }
        ).addTo(map);
        mapRef.current = map;
      }

      const res = await fetch("/world-countries.json");
      const geo = await res.json();
      if (cancelled) return;

      if (layerRef.current) layerRef.current.remove();
      layerRef.current = L.geoJSON(geo, {
        style: (feat) => {
          const cc = (feat?.properties?.cc || "").toUpperCase();
          const hit = visitedRef.current.has(cc);
          return {
            color: hit ? "#38d6e0" : "#233148",
            weight: hit ? 1 : 0.5,
            fillColor: hit ? "#38d6e0" : "#111a2e",
            fillOpacity: hit ? 0.55 : 0.25,
          };
        },
        onEachFeature: (feat, lyr) => {
          const cc = (feat?.properties?.cc || "").toUpperCase();
          if (visitedRef.current.has(cc)) lyr.bindPopup(`Visited · ${cc}`);
        },
      }).addTo(mapRef.current!);
    })();
    return () => {
      cancelled = true;
    };
  }, [visited]);

  return <div ref={elRef} className="h-full w-full rounded-2xl" />;
}
