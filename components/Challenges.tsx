"use client";

import { useMemo, useState } from "react";
import { Flight } from "@/lib/types";
import { computeStats, fmtKm } from "@/lib/stats";
import {
  useChallenges,
  TrackedChallenge,
  GoalType,
  GOAL_LABELS,
  goalValue,
} from "@/lib/challenges";
import ChallengeDetail from "./ChallengeDetail";
import { CloseIcon, PlusIcon, BoltIcon } from "./icons";

export default function Challenges({ flights }: { flights: Flight[] }) {
  const { challenges, create, update, remove, setFlights } = useChallenges();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TrackedChallenge | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const open = challenges.find((c) => c.id === openId) || null;

  if (open) {
    return (
      <>
        <ChallengeDetail
          challenge={open}
          flights={flights}
          onBack={() => setOpenId(null)}
          onSetFlights={(ids) => setFlights(open.id, ids)}
          onEdit={() => {
            setEditing(open);
            setFormOpen(true);
          }}
          onDelete={() => {
            if (confirm(`Delete the challenge “${open.name}”? Your flights are not affected.`)) {
              remove(open.id);
              setOpenId(null);
            }
          }}
        />
        {formOpen && editing?.id === open.id && (
          <ChallengeForm
            challenge={editing}
            onClose={() => setFormOpen(false)}
            onSave={(data) => {
              update(open.id, data);
              setFormOpen(false);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-trail)]/12 text-trail-soft">
            <BoltIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-vapor">Challenges</h2>
            <p className="text-sm text-haze">Track a goal across a hand-picked set of your flights.</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn-trail flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm"
        >
          <PlusIcon size={16} strokeWidth={2.2} /> New challenge
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mb-3 flex justify-center text-dim">
            <BoltIcon size={26} />
          </div>
          <p className="text-sm text-haze">No challenges yet.</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-dim">
            Create one — like a World Conquest — then add flights from your logbook and watch your
            progress (countries, distance, and more) build up.
          </p>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="mt-4 text-sm text-trail-soft hover:underline"
          >
            Create your first challenge →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <ChallengeCard key={c.id} challenge={c} flights={flights} onOpen={() => setOpenId(c.id)} />
          ))}
        </div>
      )}

      {formOpen && !editing && (
        <ChallengeForm
          challenge={null}
          onClose={() => setFormOpen(false)}
          onSave={(data) => {
            const ch = create(data);
            setFormOpen(false);
            setOpenId(ch.id);
          }}
        />
      )}
    </div>
  );
}

function ChallengeCard({
  challenge,
  flights,
  onOpen,
}: {
  challenge: TrackedChallenge;
  flights: Flight[];
  onOpen: () => void;
}) {
  const stats = useMemo(() => {
    const scoped = flights.filter((f) => challenge.flightIds.includes(f.id));
    return computeStats(scoped);
  }, [flights, challenge.flightIds]);

  const hasGoal = challenge.goalType !== "none" && challenge.goalTarget > 0;
  const value = goalValue(challenge.goalType, stats);
  const pct = hasGoal ? Math.min((value / challenge.goalTarget) * 100, 100) : 0;

  return (
    <button onClick={onOpen} className="card group p-5 text-left transition hover:border-[color:var(--color-trail)]/40">
      <h3 className="truncate text-base font-semibold text-vapor">{challenge.name}</h3>
      <div className="mt-1 text-xs text-haze">
        {challenge.flightIds.length} flights · {stats.uniqueCountries} countries · {fmtKm(stats.totalDistanceKm)} km
      </div>
      {hasGoal ? (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-dim">{GOAL_LABELS[challenge.goalType]}</span>
            <span className="font-mono text-trail-soft">
              {value.toLocaleString()} / {challenge.goalTarget.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-line-soft)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-trail)] to-[color:var(--color-amber)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 text-xs text-dim">No goal set</div>
      )}
    </button>
  );
}

function ChallengeForm({
  challenge,
  onClose,
  onSave,
}: {
  challenge: TrackedChallenge | null;
  onClose: () => void;
  onSave: (data: Omit<TrackedChallenge, "id" | "createdAt" | "flightIds">) => void;
}) {
  const [name, setName] = useState(challenge?.name ?? "");
  const [goalType, setGoalType] = useState<GoalType>(challenge?.goalType ?? "countries");
  const [goalTarget, setGoalTarget] = useState(String(challenge?.goalTarget ?? 195));
  const [ifcUrl, setIfcUrl] = useState(challenge?.ifcUrl ?? "");
  const [note, setNote] = useState(challenge?.note ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      goalType,
      goalTarget: parseInt(goalTarget || "0", 10) || 0,
      ifcUrl: ifcUrl.trim(),
      note: note.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="card my-8 w-full max-w-lg p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vapor">{challenge ? "Edit challenge" : "New challenge"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-haze hover:bg-[color:var(--color-line)]">
            <CloseIcon size={16} />
          </button>
        </div>

        <label className="mb-1 block text-xs text-haze">Name</label>
        <input
          className="input mb-4 w-full px-3 py-2 text-sm"
          placeholder="World Conquest"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-haze">Goal</label>
            <select className="input w-full px-3 py-2 text-sm" value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
              {(Object.keys(GOAL_LABELS) as GoalType[]).map((g) => (
                <option key={g} value={g}>
                  {GOAL_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-haze">Target</label>
            <input
              className="input w-full px-3 py-2 text-sm disabled:opacity-40"
              inputMode="numeric"
              value={goalTarget}
              disabled={goalType === "none"}
              onChange={(e) => setGoalTarget(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>

        <label className="mb-1 block text-xs text-haze">IFC thread link (optional)</label>
        <input
          className="input mb-4 w-full px-3 py-2 text-sm"
          placeholder="https://community.infiniteflight.com/t/…"
          value={ifcUrl}
          onChange={(e) => setIfcUrl(e.target.value)}
        />

        <label className="mb-1 block text-xs text-haze">Description (optional)</label>
        <textarea
          className="input mb-5 min-h-[70px] w-full px-3 py-2 text-sm"
          placeholder="Land in every country on the planet…"
          value={note}
          maxLength={400}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-haze hover:bg-[color:var(--color-line)]">
            Cancel
          </button>
          <button type="submit" disabled={!name.trim()} className="btn-trail rounded-lg px-5 py-2 text-sm disabled:opacity-40">
            {challenge ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
