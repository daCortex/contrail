"use client";

import { useEffect, useState } from "react";
import { Flight, NewFlight } from "@/lib/types";
import { AIRCRAFT } from "@/lib/aircraft";
import { haversineKm, estimateDurationMin } from "@/lib/geo";
import { fmtKm, fmtDuration } from "@/lib/stats";
import { resolveAirports, toLite } from "@/lib/airport-client";
import AirportInput from "./AirportInput";

const EMPTY: NewFlight = {
  date: new Date().toISOString().slice(0, 10),
  flightNumber: "",
  airline: "",
  aircraft: "",
  registration: "",
  from: "",
  to: "",
  durationMin: 0,
  distanceKm: 0,
  seat: "",
  cabin: "",
  note: "",
};

const manufacturers = [...new Set(AIRCRAFT.map((a) => a.manufacturer))];

export default function FlightForm({
  open,
  onClose,
  onSave,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (f: NewFlight, id?: string) => void;
  editing?: Flight | null;
}) {
  const [f, setF] = useState<NewFlight>(EMPTY);
  const [hh, setHh] = useState("");
  const [mm, setMm] = useState("");

  useEffect(() => {
    if (open) {
      if (editing) {
        const { id, source, createdAt, ...rest } = editing;
        void id;
        void source;
        void createdAt;
        setF(rest);
        setHh(String(Math.floor(editing.durationMin / 60)));
        setMm(String(editing.durationMin % 60));
      } else {
        setF(EMPTY);
        setHh("");
        setMm("");
      }
    }
  }, [open, editing]);

  if (!open) return null;

  // Distance comes from the resolved airport coordinates (full dataset), so any
  // ICAO/IATA the user picks computes a real distance — never 0.
  const dist =
    f.fromGeo && f.toGeo ? Math.round(haversineKm(f.fromGeo, f.toGeo)) : f.distanceKm || 0;
  const enteredMin = (parseInt(hh || "0", 10) || 0) * 60 + (parseInt(mm || "0", 10) || 0);
  const estMin = enteredMin || estimateDurationMin(dist);
  const set = (patch: Partial<NewFlight>) => setF((prev) => ({ ...prev, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If the user typed codes without picking from the dropdown, resolve their
    // coordinates now so the flight still gets a real distance (never 0 km).
    let fromGeo = f.fromGeo;
    let toGeo = f.toGeo;
    if ((!fromGeo || !toGeo) && f.from && f.to) {
      const m = await resolveAirports([f.from, f.to]);
      if (!fromGeo && m[f.from.toUpperCase()]) fromGeo = toLite(m[f.from.toUpperCase()]);
      if (!toGeo && m[f.to.toUpperCase()]) toGeo = toLite(m[f.to.toUpperCase()]);
    }
    const distanceKm =
      fromGeo && toGeo ? Math.round(haversineKm(fromGeo, toGeo)) : f.distanceKm || 0;
    const durationMin = enteredMin || estimateDurationMin(distanceKm);
    onSave({ ...f, fromGeo, toGeo, durationMin, distanceKm }, editing?.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="card my-8 w-full max-w-2xl p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vapor">
            {editing ? "Edit flight" : "Log a flight"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-haze hover:bg-[color:var(--color-line)]"
          >
            ✕
          </button>
        </div>

        {/* Route */}
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <div>
            <label className="mb-1 block text-xs text-haze">From — any airport, ICAO or IATA</label>
            <AirportInput
              value={f.from}
              onChange={(c, geo) => set({ from: c, fromGeo: geo })}
              placeholder="Search e.g. LHR, EGLL, London"
            />
          </div>
          <div className="pt-7 text-trail">→</div>
          <div>
            <label className="mb-1 block text-xs text-haze">To — any airport, ICAO or IATA</label>
            <AirportInput
              value={f.to}
              onChange={(c, geo) => set({ to: c, toGeo: geo })}
              placeholder="Search e.g. JFK, KJFK, New York"
            />
          </div>
        </div>

        {dist > 0 && (
          <div className="mb-4 text-xs text-trail-soft">
            <span className="font-mono">{fmtKm(dist)} km</span>
            <span className="text-dim"> · </span>
            {enteredMin ? (
              <span className="font-mono">{fmtDuration(enteredMin)}</span>
            ) : (
              <span className="font-mono">≈ {fmtDuration(estMin)}</span>
            )}
            {!enteredMin && <span className="text-dim"> (estimated — set a time below to override)</span>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Field label="Date">
            <input
              type="date"
              className="input w-full px-3 py-2 text-sm"
              value={f.date}
              onChange={(e) => set({ date: e.target.value })}
              required
            />
          </Field>
          <Field label="Flight no.">
            <input
              className="input w-full px-3 py-2 text-sm uppercase"
              value={f.flightNumber}
              placeholder="BA286"
              onChange={(e) => set({ flightNumber: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Airline">
            <input
              className="input w-full px-3 py-2 text-sm"
              value={f.airline}
              placeholder="British Airways"
              onChange={(e) => set({ airline: e.target.value })}
            />
          </Field>

          <Field label="Aircraft" full>
            <input
              className="input w-full px-3 py-2 text-sm"
              list="aircraft-list"
              value={f.aircraft}
              placeholder="Boeing 777-300ER"
              onChange={(e) => set({ aircraft: e.target.value })}
            />
            <datalist id="aircraft-list">
              {manufacturers.map((m) => (
                <optgroup key={m} label={m} />
              ))}
              {AIRCRAFT.map((a) => (
                <option key={a.name} value={a.name} />
              ))}
            </datalist>
          </Field>
          <Field label="Registration">
            <input
              className="input w-full px-3 py-2 text-sm uppercase"
              value={f.registration}
              placeholder="G-STBA"
              onChange={(e) => set({ registration: e.target.value.toUpperCase() })}
            />
          </Field>

          <Field label="Duration">
            <div className="flex items-center gap-1">
              <input
                className="input w-full px-2 py-2 text-center text-sm"
                inputMode="numeric"
                value={hh}
                placeholder="7"
                onChange={(e) => setHh(e.target.value.replace(/\D/g, ""))}
              />
              <span className="text-xs text-dim">h</span>
              <input
                className="input w-full px-2 py-2 text-center text-sm"
                inputMode="numeric"
                value={mm}
                placeholder="30"
                onChange={(e) => setMm(e.target.value.replace(/\D/g, ""))}
              />
              <span className="text-xs text-dim">m</span>
            </div>
          </Field>
          <Field label="Cabin">
            <select
              className="input w-full px-3 py-2 text-sm"
              value={f.cabin}
              onChange={(e) => set({ cabin: e.target.value as NewFlight["cabin"] })}
            >
              <option value="">—</option>
              <option>Economy</option>
              <option>Premium</option>
              <option>Business</option>
              <option>First</option>
            </select>
          </Field>
          <Field label="Seat">
            <input
              className="input w-full px-3 py-2 text-sm uppercase"
              value={f.seat}
              placeholder="24A"
              onChange={(e) => set({ seat: e.target.value.toUpperCase() })}
            />
          </Field>

          <Field label="Note" full>
            <input
              className="input w-full px-3 py-2 text-sm"
              value={f.note}
              placeholder="Window seat, great sunset over Greenland"
              onChange={(e) => set({ note: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-haze hover:bg-[color:var(--color-line)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!f.from || !f.to}
            className="btn-trail rounded-lg px-5 py-2 text-sm disabled:opacity-40"
          >
            {editing ? "Save changes" : "Add flight"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2 md:col-span-3" : ""}>
      <label className="mb-1 block text-xs text-haze">{label}</label>
      {children}
    </div>
  );
}
