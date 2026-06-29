"use client";

import { useEffect, useRef, useState } from "react";
import { AirportLite } from "@/lib/types";
import { searchAirports, resolveAirports, toLite, AirportHit } from "@/lib/airport-client";

export default function AirportInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (code: string, geo?: AirportLite) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<AirportHit[]>([]);
  const [active, setActive] = useState(0);
  const [label, setLabel] = useState<string>("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Show a "City, Country" label for the current code when it isn't being edited.
  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setLabel("");
      return;
    }
    resolveAirports([value]).then((m) => {
      if (cancelled) return;
      const a = m[value.toUpperCase()];
      setLabel(a ? `${a.city}, ${a.country}` : "");
    });
    return () => {
      cancelled = true;
    };
  }, [value]);

  const query = (q: string) => {
    onChange(q.toUpperCase());
    if (debRef.current) clearTimeout(debRef.current);
    const term = q.trim();
    if (!term) {
      setResults([]);
      setOpen(false);
      return;
    }
    debRef.current = setTimeout(async () => {
      const r = await searchAirports(term);
      setResults(r);
      setActive(0);
      setOpen(r.length > 0);
    }, 160);
  };

  const choose = (a: AirportHit) => {
    onChange(a.code, toLite(a));
    setLabel(`${a.city}, ${a.country}`);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        className="input w-full px-3 py-2 text-sm uppercase tracking-wide"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => query(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (results[active]) choose(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {label && !open && <div className="mt-1 truncate text-[11px] text-dim">{label}</div>}
      {open && results.length > 0 && (
        <ul className="card-2 absolute z-30 mt-1 max-h-72 w-full overflow-auto py-1 shadow-2xl">
          {results.map((a, i) => (
            <li key={`${a.icao}-${a.iata}-${i}`}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(a);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                  i === active ? "bg-[color:var(--color-line)]" : ""
                }`}
              >
                <span className="flex shrink-0 gap-1 font-mono text-xs">
                  {a.iata && <span className="font-semibold text-trail-soft">{a.iata}</span>}
                  <span className="text-dim">{a.icao}</span>
                </span>
                <span className="flex-1 truncate text-vapor">{a.city}</span>
                <span className="truncate text-[11px] text-dim">{a.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
