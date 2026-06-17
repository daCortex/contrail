"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { connectIFC, syncIFC } from "@/lib/ifc";
import { IFCProfile, Flight, NewFlight } from "@/lib/types";
import { computeStats, fmtDurationLong, fmtKm } from "@/lib/stats";
import {
  ProfileBio,
  EMPTY_BIO,
  PublicChallenge,
  loadBio,
  decodeBio,
  safeUrl,
  fetchRemoteProfile,
  syncRemoteStats,
} from "@/lib/profile";
import { GOAL_LABELS, GoalType } from "@/lib/challenges";
import { applyAccent } from "@/lib/theme";
import { useSession } from "@/lib/auth-client";
import StatsPanel from "./StatsPanel";
import Achievements from "./Achievements";
import LivePanel from "./LivePanel";
import BioEditor from "./BioEditor";
import LoginModal from "./LoginModal";
import { PlaneIcon, ArrowRightIcon, PencilIcon, BoltIcon, PinIcon } from "./icons";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

const GRADES = ["", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

function withId(f: NewFlight): Flight {
  return { ...f, id: f.extId || Math.random().toString(36).slice(2), distanceKm: f.distanceKm || 0, source: "ifc", createdAt: 0 };
}

export default function ProfileView({ username }: { username: string }) {
  const search = useSearchParams();
  const { session, setSession } = useSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [profile, setProfile] = useState<IFCProfile | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [bio, setBio] = useState<ProfileBio>(EMPTY_BIO);
  const [challenges, setChallenges] = useState<PublicChallenge[]>([]);
  const [editing, setEditing] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tab, setTab] = useState<"overview" | "stats" | "awards">("overview");

  const stats = useMemo(() => computeStats(flights), [flights]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const p = await connectIFC(username);
        if (cancelled) return;
        setProfile(p);
        const r = await syncIFC(p.userId, 15);
        if (cancelled) return;
        setFlights(r.flights.map(withId));
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load this profile.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    setIsOwner(!!session && !!profile && session.username.toLowerCase() === profile.username.toLowerCase());
  }, [session, profile]);

  // Push derived stats to the leaderboard snapshot once loaded.
  useEffect(() => {
    if (status !== "ready" || !profile) return;
    syncRemoteStats({
      username: profile.username,
      displayName: profile.username,
      userId: profile.userId,
      stats: {
        grade: profile.grade,
        flights: stats.totalFlights,
        minutes: stats.totalMinutes,
        distanceKm: stats.totalDistanceKm,
        countries: stats.uniqueCountries,
        airports: stats.uniqueAirports,
        aircraftTypes: stats.uniqueAircraft,
        landings: stats.totalLandings,
      },
    });
  }, [status, profile, stats]);

  // Load bio + challenges: URL-encoded copy first, else the server profile.
  useEffect(() => {
    let cancelled = false;
    const enc = search.get("c");
    const fromUrl = enc ? decodeBio(enc) : null;
    if (fromUrl) setBio(fromUrl);
    if (!profile) return;
    (async () => {
      const remote = await fetchRemoteProfile(profile.username);
      if (cancelled) return;
      if (remote) {
        if (!fromUrl) setBio(remote.bio);
        setChallenges(remote.challenges);
      } else if (!fromUrl) {
        setBio(loadBio(profile.username) ?? EMPTY_BIO);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search, profile]);

  // Apply the profile's accent theme; restore the visitor's own on leave.
  useEffect(() => {
    applyAccent(bio.accent || "cyan");
    return () => {
      let app = "cyan";
      try {
        app = localStorage.getItem("contrail.theme") || "cyan";
      } catch {
        /* ignore */
      }
      applyAccent(app);
    };
  }, [bio.accent]);

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <div className="card p-8">
          <div className="mb-3 flex justify-center text-dim">
            <PlaneIcon size={28} />
          </div>
          <h1 className="text-lg font-semibold text-vapor">Profile unavailable</h1>
          <p className="mt-2 text-sm text-haze">{error}</p>
          <Link href="/" className="mt-5 inline-block text-sm text-trail-soft hover:underline">
            ← Back to Contrail
          </Link>
        </div>
      </div>
    );
  }

  const p = profile;
  const links = bio.links || {};
  const linkEntries = (["discord", "youtube", "twitch", "website"] as const)
    .map((k) => ({ k, url: safeUrl(links[k] || "") }))
    .filter((x) => x.url);

  const career = p
    ? [
        { label: "Flight time", value: p.flightTimeMin != null ? fmtDurationLong(p.flightTimeMin) : "—" },
        { label: "Landings", value: p.landingCount?.toLocaleString() ?? "—" },
        { label: "Online flights", value: p.onlineFlights?.toLocaleString() ?? "—" },
        { label: "XP", value: p.xp?.toLocaleString() ?? "—" },
        { label: "ATC ops", value: p.atcOperations?.toLocaleString() ?? "—" },
        { label: "Violations", value: p.violations?.toLocaleString() ?? "—" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 text-sm text-haze hover:text-vapor">
          <span className="text-trail-soft">
            <PlaneIcon size={18} />
          </span>
          Contrail
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/track?q=${encodeURIComponent(username)}`} className="rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor">
            Track live
          </Link>
          {isOwner ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-full border border-[color:var(--color-trail)]/40 px-3 py-1.5 text-xs text-trail-soft hover:bg-[color:var(--color-trail)]/10">
              <PencilIcon size={13} /> Customize
            </button>
          ) : (
            <button onClick={() => setLoginOpen(true)} className="rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor">
              Log in
            </button>
          )}
        </div>
      </header>

      {/* Identity */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[color:var(--color-trail)]/25 via-[color:var(--color-trail)]/8 to-transparent" />
        <div className="px-6 pb-6">
          <div className="-mt-9 flex flex-wrap items-end gap-4">
            <div className="flex h-18 w-18 items-center justify-center rounded-2xl border-4 border-[color:var(--color-panel)] bg-[color:var(--color-trail)]/15 text-trail-soft" style={{ height: 72, width: 72 }}>
              <PlaneIcon size={30} />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold tracking-tight text-vapor">@{p?.username ?? username}</h1>
                {p?.grade ? <span className="chip rounded-full px-2 py-0.5 text-[11px]">{GRADES[p.grade] || `Grade ${p.grade}`}</span> : null}
                {p?.virtualOrganization ? <span className="rounded-full border border-[color:var(--color-line)] px-2 py-0.5 text-[11px] text-haze">{p.virtualOrganization}</span> : null}
              </div>
              {bio.tagline && <div className="mt-0.5 text-sm text-haze">{bio.tagline}</div>}
            </div>
          </div>

          {bio.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-haze">{bio.description}</p>}

          {(bio.homeAirport || bio.favoriteAircraft || linkEntries.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-haze">
              {bio.homeAirport && (
                <span className="flex items-center gap-1.5">
                  <PinIcon size={13} className="text-dim" /> Home base <span className="font-mono text-vapor">{bio.homeAirport}</span>
                </span>
              )}
              {bio.favoriteAircraft && (
                <span className="flex items-center gap-1.5">
                  <PlaneIcon size={13} className="text-dim" /> {bio.favoriteAircraft}
                </span>
              )}
              {linkEntries.map(({ k, url }) => (
                <a key={k} href={url!} target="_blank" rel="noreferrer" className="capitalize text-trail-soft hover:underline">
                  {k}
                </a>
              ))}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {career.map((c) => (
              <div key={c.label} className="card-2 px-3 py-2.5">
                <div className="truncate text-sm font-semibold text-vapor">{status === "loading" ? "…" : c.value}</div>
                <div className="text-[10px] tracking-wide text-dim uppercase">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenges */}
      {challenges.length > 0 && (
        <div className="card mb-6 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-haze uppercase">
            <BoltIcon size={15} /> Challenges
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {challenges.map((ch, i) => {
              const hasGoal = ch.goalType !== "none" && ch.goalTarget > 0;
              const pct = hasGoal ? Math.min((ch.value / ch.goalTarget) * 100, 100) : 0;
              return (
                <div key={i} className="card-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-vapor">{ch.name}</div>
                    {safeUrl(ch.ifcUrl) && (
                      <a href={safeUrl(ch.ifcUrl)!} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-trail-soft hover:underline">
                        IFC thread <ArrowRightIcon size={12} />
                      </a>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-dim">
                    {ch.flights} flights · {ch.countries} countries · {fmtKm(ch.distanceKm)} km
                  </div>
                  {ch.note && <p className="mt-2 text-xs leading-relaxed text-haze">{ch.note}</p>}
                  {hasGoal && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className="text-dim">{GOAL_LABELS[ch.goalType as GoalType] ?? ch.goalType}</span>
                        <span className="font-mono text-trail-soft">{ch.value.toLocaleString()} / {ch.goalTarget.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-line-soft)]">
                        <div className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-trail)] to-[color:var(--color-amber)]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {p && <div className="mb-6"><LivePanel userId={p.userId} connected /></div>}

      <nav className="mb-5 flex gap-1">
        {(
          [
            ["overview", "Overview"],
            ["stats", "Statistics"],
            ["awards", "Awards"],
          ] as [typeof tab, string][]
        ).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${tab === t ? "bg-[color:var(--color-panel-2)] text-vapor" : "text-dim hover:text-haze"}`}>
            {label}
          </button>
        ))}
      </nav>

      {status === "loading" ? (
        <div className="card p-12 text-center text-sm text-dim">Loading {username}&rsquo;s flights…</div>
      ) : (
        <>
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="card h-[55vh] min-h-[380px] overflow-hidden p-1.5">
                <RouteMap flights={flights} />
              </div>
              <StatsPanel stats={stats} />
            </div>
          )}
          {tab === "stats" && <StatsPanel stats={stats} />}
          {tab === "awards" && <Achievements stats={stats} flights={flights} />}
        </>
      )}

      <footer className="mt-12 text-center text-[11px] text-dim">
        {flights.length} flights synced from Infinite Flight · stats are live
      </footer>

      {isOwner && p && (
        <BioEditor open={editing} onClose={() => setEditing(false)} username={p.username} userId={p.userId} bio={bio} onSave={setBio} />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onLogin={(s) => setSession(s)} />
    </div>
  );
}
