"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { connectIFC, syncIFC } from "@/lib/ifc";
import { IFCProfile, Flight, NewFlight } from "@/lib/types";
import { computeStats, fmtDurationLong, fmtKm } from "@/lib/stats";
import { ProfileBio, loadBio, decodeBio, bioHasContent, safeUrl } from "@/lib/profile";
import StatsPanel from "./StatsPanel";
import Achievements from "./Achievements";
import LivePanel from "./LivePanel";
import BioEditor from "./BioEditor";
import { PlaneIcon, ArrowRightIcon, PencilIcon, BoltIcon } from "./icons";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

const GRADES = ["", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

function withId(f: NewFlight): Flight {
  return { ...f, id: f.extId || Math.random().toString(36).slice(2), distanceKm: f.distanceKm || 0, source: "ifc", createdAt: 0 };
}

export default function ProfileView({ username }: { username: string }) {
  const search = useSearchParams();
  const [profile, setProfile] = useState<IFCProfile | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [bio, setBio] = useState<ProfileBio | null>(null);
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
        // Determine ownership from the locally-connected account.
        try {
          const ifc = JSON.parse(localStorage.getItem("contrail.ifc.v1") || "{}");
          setIsOwner(!!ifc?.username && ifc.username.toLowerCase() === p.username.toLowerCase());
        } catch {
          /* ignore */
        }
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

  // Bio: prefer the encoded copy in the URL, else the owner's local copy.
  useEffect(() => {
    const enc = search.get("c");
    const fromUrl = enc ? decodeBio(enc) : null;
    if (fromUrl) setBio(fromUrl);
    else if (profile) setBio(loadBio(profile.username));
  }, [search, profile]);

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
      {/* Top bar */}
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 text-sm text-haze hover:text-vapor">
          <span className="text-trail-soft">
            <PlaneIcon size={18} />
          </span>
          Contrail
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/track?q=${encodeURIComponent(username)}`}
            className="rounded-full border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor"
          >
            Track live
          </Link>
          {isOwner && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-full border border-[color:var(--color-trail)]/40 px-3 py-1.5 text-xs text-trail-soft hover:bg-[color:var(--color-trail)]/10"
            >
              <PencilIcon size={13} /> Edit profile
            </button>
          )}
        </div>
      </header>

      {/* Identity */}
      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--color-trail)]/12 text-trail-soft">
            <PlaneIcon size={28} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight text-vapor">@{p?.username ?? username}</h1>
              {p?.grade ? (
                <span className="chip rounded-full px-2 py-0.5 text-[11px]">{GRADES[p.grade] || `Grade ${p.grade}`}</span>
              ) : null}
            </div>
            <div className="mt-0.5 text-sm text-haze">
              {p?.virtualOrganization ? p.virtualOrganization : "Infinite Flight pilot"}
            </div>
          </div>
        </div>

        {bio?.description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-haze">{bio.description}</p>
        )}

        {/* Career stats */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {career.map((c) => (
            <div key={c.label} className="card-2 px-3 py-2.5">
              <div className="truncate text-sm font-semibold text-vapor">
                {status === "loading" ? "…" : c.value}
              </div>
              <div className="text-[10px] tracking-wide text-dim uppercase">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ongoing challenges */}
      {bio && bioHasContent(bio) && bio.challenges.length > 0 && (
        <div className="card mb-6 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-haze uppercase">
            <BoltIcon size={15} /> Ongoing challenges
          </h2>
          <div className="space-y-3">
            {bio.challenges.map((ch) => (
              <div key={ch.id} className="card-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-vapor">{ch.title || "Challenge"}</div>
                  {safeUrl(ch.ifcUrl) && (
                    <a
                      href={safeUrl(ch.ifcUrl)!}
                      target="_blank"
                      rel="noreferrer"
                      className="flex shrink-0 items-center gap-1 text-xs text-trail-soft hover:underline"
                    >
                      IFC thread <ArrowRightIcon size={13} />
                    </a>
                  )}
                </div>
                {ch.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-haze">{ch.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live now (if airborne) */}
      {p && <div className="mb-6"><LivePanel userId={p.userId} connected /></div>}

      {/* Tabs */}
      <nav className="mb-5 flex gap-1">
        {(
          [
            ["overview", "Overview"],
            ["stats", "Statistics"],
            ["awards", "Awards"],
          ] as [typeof tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              tab === t ? "bg-[color:var(--color-panel-2)] text-vapor" : "text-dim hover:text-haze"
            }`}
          >
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
        <BioEditor
          open={editing}
          onClose={() => setEditing(false)}
          username={p.username}
          bio={bio}
          onSave={setBio}
        />
      )}
    </div>
  );
}
