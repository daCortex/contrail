"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES } from "@/lib/theme";

export default function ThemeMenu({
  theme,
  onChange,
}: {
  theme: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Theme"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--color-line)] text-haze hover:text-vapor"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="13.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="8.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="6.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
          <path d="M12 2a10 10 0 1 0 0 20c1.5 0 2-1 2-2 0-.7-.4-1.2-.9-1.6-.4-.4-.6-.8-.6-1.4 0-1 .8-1.8 1.8-1.8H17a5 5 0 0 0 5-5c0-4.6-4.5-8.2-10-8.2Z" />
        </svg>
      </button>

      {open && (
        <div className="card-2 absolute right-0 z-[2200] mt-2 w-40 p-2 shadow-2xl">
          <div className="px-1.5 py-1 text-[10px] tracking-wide text-dim uppercase">Theme</div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${
                theme === t.id ? "bg-[color:var(--color-line)] text-vapor" : "text-haze hover:bg-[color:var(--color-line)]/50"
              }`}
            >
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: `linear-gradient(135deg, ${t.trailSoft}, ${t.trail})` }}
              />
              {t.name}
              {theme === t.id && <span className="ml-auto text-trail-soft">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
