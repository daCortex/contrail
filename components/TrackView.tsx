"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchTrack, TrackResult } from "@/lib/ifc";
import { PlaneIcon, SearchIcon, ArrowRightIcon, TrashIcon, BoltIcon } from "./icons";

const LiveMap = dynamic(() => import("./LiveMap"), { ssr: false });

const WATCH_KEY = "contrail.watchlist";
const POLL_MS = 20000;

function loadWatch(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(WATCH_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function TrackView() {
  const router = useRouter();
  const search = useSearchParams();
  const initial = search.get("q") || "";

  const [query, setQuery] = useState(initial);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [watch, setWatch] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setWatch(loadWatch()), []);

  const run = useCallback(async (q: string, silent = false) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    if (!silent) {
      setLoading(true);
      setError("");
      setResult(null);
    }
    try {
      const r = await fetchTrack(trimmed);
      setResult(r);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Not found.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Run when the ?q param is present (also covers shared links).
  useEffect(() => {
    if (initial) {
      setQuery(initial);
      run(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // Auto-refresh the active subject.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    const q = result?.subject?.query;
    if (q) timer.current = setInterval(() => run(q, true), POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [result?.subject?.query, run]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.replace(`/track?q=${encodeURIComponent(q)}`);
    run(q);
  };

  const saveWatch = (q: string) => {
    setWatch((w) => {
      const next = [q, ...w.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 12);
      localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      return next;
    });
  };
  const removeWatch = (q: string) => {
    setWatch((w) => {
      const next = w.filter((x) => x !== q);
      localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      return next;
    });
  };

  const shareLink = () => {
    const q = result?.subject?.query || query;
    const url = `${window.location.origin}/track?q=${encodeURIComponent(q)}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const live = result?.live;
  const subj = result?.subject;
  const isWatched = subj && watch.some((w) => w.toLowerCase() === subj.query.toLowerCase());

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 text-sm text-haze hover:text-vapor">
          <span className="text-trail-soft">
            <PlaneIcon size={18} />
          </span>
          Contrail
        </Link>
      </header>

      <h1 className="text-2xl font-bold tracking-tight text-vapor">Live tracker</h1>
      <p className="mt-1 text-sm text-haze">
        Track any Infinite Flight pilot by IFC username or live callsign — then share the link.
      </p>

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim">
            <SearchIcon size={16} />
          </span>
          <input
            className="input w-full py-2.5 pl-9 pr-3 text-sm"
            placeholder="Username (e.g. Eggs_Aviation) or callsign (e.g. BAW123)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-trail rounded-lg px-5 py-2.5 text-sm">
          Track
        </button>
      </form>

      {/* Watchlist */}
      {watch.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-dim">Watchlist:</span>
          {watch.map((w) => (
            <span key={w} className="card-2 flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs">
              <button
                onClick={() => {
                  setQuery(w);
                  router.replace(`/track?q=${encodeURIComponent(w)}`);
                  run(w);
                }}
                className="text-haze hover:text-vapor"
              >
                {w}
              </button>
              <button onClick={() => removeWatch(w)} className="text-dim hover:text-rose">
                <TrashIcon size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Result */}
      <div className="mt-6">
        {loading && <div className="card p-12 text-center text-sm text-dim">Searching live sessions…</div>}
        {error && !loading && (
          <div className="card p-8 text-center">
            <p className="text-sm text-haze">{error}</p>
          </div>
        )}

        {subj && !loading && (
          <div className="space-y-4">
            <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-vapor">
                    {subj.type === "callsign" ? subj.callsign || subj.query : `@${subj.username || subj.query}`}
                  </h2>
                  {live ? (
                    <span className="chip flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px]">
                      <span className="live-dot h-1.5 w-1.5 rounded-full bg-[color:var(--color-trail)]" />
                      Airborne
                    </span>
                  ) : (
                    <span className="rounded-full border border-[color:var(--color-line)] px-2.5 py-0.5 text-[11px] text-dim">
                      Not flying
                    </span>
                  )}
                </div>
                {live && (
                  <div className="mt-0.5 truncate text-xs text-haze">
                    {live.callsign} · {live.aircraft || "Aircraft"} · {live.origin || "—"} → {live.destination || "—"} · {live.sessionName}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {subj.username && (
                  <Link
                    href={`/u/${encodeURIComponent(subj.username)}`}
                    className="flex items-center gap-1 rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor"
                  >
                    View profile <ArrowRightIcon size={13} />
                  </Link>
                )}
                <button
                  onClick={() => saveWatch(subj.query)}
                  disabled={!!isWatched}
                  className="flex items-center gap-1.5 rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor disabled:opacity-50"
                >
                  <BoltIcon size={13} /> {isWatched ? "Watching" : "Watch"}
                </button>
                <button
                  onClick={shareLink}
                  className="rounded-full border border-[color:var(--color-trail)]/40 px-3 py-1.5 text-xs text-trail-soft hover:bg-[color:var(--color-trail)]/10"
                >
                  {copied ? "Copied ✓" : "Share"}
                </button>
              </div>
            </div>

            {live ? (
              <>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  <Telem label="Altitude" value={`${live.position.altitude.toLocaleString()} ft`} />
                  <Telem label="Ground speed" value={`${live.position.speed} kt`} />
                  <Telem label="Heading" value={`${live.position.heading}°`} />
                  <Telem label="Origin" value={live.origin || "—"} />
                  <Telem label="Destination" value={live.destination || "—"} />
                  <Telem label="Server" value={live.sessionName} />
                </div>
                <div className="card h-[55vh] min-h-[380px] overflow-hidden p-1.5">
                  <LiveMap live={live} />
                </div>
              </>
            ) : (
              <div className="card p-10 text-center text-sm text-dim">
                {subj.type === "callsign"
                  ? "That callsign isn't active right now."
                  : `@${subj.username || subj.query} isn't airborne right now. Check their profile or watch them for later.`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Telem({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-2 px-3 py-2.5">
      <div className="truncate font-mono text-sm text-trail-soft">{value}</div>
      <div className="text-[10px] tracking-wide text-dim uppercase">{label}</div>
    </div>
  );
}
