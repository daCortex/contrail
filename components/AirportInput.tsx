"use client";

import { useEffect, useRef, useState } from "react";
import { Airport, findAirport, searchAirports } from "@/lib/airports";

export default function AirportInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matched = findAirport(value);

  const update = (q: string) => {
    onChange(q.toUpperCase());
    const r = searchAirports(q);
    setResults(r);
    setActive(0);
    setOpen(r.length > 0);
  };

  const choose = (a: Airport) => {
    onChange(a.iata);
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
        onChange={(e) => update(e.target.value)}
        onFocus={() => value && setOpen(searchAirports(value).length > 0)}
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
      {matched && !open && (
        <div className="mt-1 truncate text-[11px] text-dim">
          {matched.city}, {matched.country}
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="card-2 absolute z-30 mt-1 max-h-64 w-full overflow-auto py-1 shadow-2xl">
          {results.map((a, i) => (
            <li key={a.icao}>
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
                <span className="font-mono font-semibold text-trail-soft">{a.iata}</span>
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
