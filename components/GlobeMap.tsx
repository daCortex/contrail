"use client";

import { useEffect, useRef } from "react";
import { Flight } from "@/lib/types";
import { resolvePoint } from "@/lib/airports";

export default function GlobeMap({
  flights,
  visited,
}: {
  flights: Flight[];
  visited: string[];
}) {
  const elRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let raf = 0;

    (async () => {
      const Globe = (await import("globe.gl")).default;
      const el = elRef.current;
      if (cancelled || !el) return;

      const visitedSet = new Set(visited.map((c) => c.toUpperCase()));

      const arcs: { startLat: number; startLng: number; endLat: number; endLng: number }[] = [];
      const ptMap = new Map<string, { lat: number; lng: number; size: number; cc: string }>();
      for (const f of flights) {
        const a = resolvePoint(f.from, f.fromGeo);
        const b = resolvePoint(f.to, f.toGeo);
        if (!a || !b) continue;
        arcs.push({ startLat: a.lat, startLng: a.lon, endLat: b.lat, endLng: b.lon });
        for (const p of [a, b]) {
          const cur = ptMap.get(p.code);
          if (cur) cur.size += 0.05;
          else ptMap.set(p.code, { lat: p.lat, lng: p.lon, size: 0.2, cc: p.cc });
        }
      }
      const points = [...ptMap.values()];

      const size = () => ({
        w: el.clientWidth || el.parentElement?.clientWidth || 800,
        h: el.clientHeight || el.parentElement?.clientHeight || 460,
      });
      const { w, h } = size();

      // Factory form — Globe()(domElement).
      const globe = Globe()(el)
        .width(w)
        .height(h)
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .showAtmosphere(true)
        .atmosphereColor("#38d6e0")
        .atmosphereAltitude(0.2)
        .arcsData(arcs)
        .arcColor(() => ["rgba(95,227,236,0.9)", "rgba(79,140,255,0.7)"])
        .arcStroke(0.5)
        .arcAltitudeAutoScale(0.4)
        .arcDashLength(0.5)
        .arcDashGap(0.25)
        .arcDashInitialGap(() => Math.random())
        .arcDashAnimateTime(3000)
        .pointsData(points)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .pointColor((d: any) => (visitedSet.has((d.cc || "").toUpperCase()) ? "#5fe3ec" : "#f5b942"))
        .pointAltitude(0.012)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .pointRadius((d: any) => Math.min(d.size, 0.7));

      const controls = globe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableZoom = true;
      globe.pointOfView({ lat: 20, lng: 0, altitude: 2.3 });

      globeRef.current = globe;

      // Re-assert size on the next frame (container may settle after mount).
      raf = requestAnimationFrame(() => {
        const s = size();
        globe.width(s.w).height(s.h);
      });

      ro = new ResizeObserver(() => {
        const s = size();
        globe.width(s.w).height(s.h);
      });
      ro.observe(el);
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (globeRef.current?._destructor) globeRef.current._destructor();
      globeRef.current = null;
      if (elRef.current) elRef.current.innerHTML = "";
    };
  }, [flights, visited]);

  return <div ref={elRef} className="h-full w-full" />;
}
