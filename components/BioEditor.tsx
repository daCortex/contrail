"use client";

import { useEffect, useState } from "react";
import { ProfileBio, EMPTY_BIO, saveBio, encodeBio, saveRemoteBio, ProfileLinks } from "@/lib/profile";
import { THEMES } from "@/lib/theme";
import { CloseIcon } from "./icons";

const LINK_FIELDS: { key: keyof ProfileLinks; label: string; ph: string }[] = [
  { key: "discord", label: "Discord", ph: "https://discord.gg/…" },
  { key: "youtube", label: "YouTube", ph: "https://youtube.com/@…" },
  { key: "twitch", label: "Twitch", ph: "https://twitch.tv/…" },
  { key: "website", label: "Website", ph: "https://…" },
];

export default function BioEditor({
  open,
  onClose,
  username,
  userId,
  bio,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  username: string;
  userId: string;
  bio: ProfileBio | null;
  onSave: (b: ProfileBio) => void;
}) {
  const [draft, setDraft] = useState<ProfileBio>(EMPTY_BIO);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(bio ? { ...EMPTY_BIO, ...bio, links: { ...bio.links } } : EMPTY_BIO);
      setErr("");
    }
  }, [open, bio]);

  if (!open) return null;

  const set = (patch: Partial<ProfileBio>) => setDraft((d) => ({ ...d, ...patch }));
  const setLink = (k: keyof ProfileLinks, v: string) =>
    setDraft((d) => ({ ...d, links: { ...d.links, [k]: v } }));

  const persist = async (): Promise<boolean> => {
    saveBio(username, draft);
    onSave(draft);
    setErr("");
    try {
      await saveRemoteBio({ username, displayName: username, userId, bio: draft });
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save to the server.");
      return false;
    }
  };

  const save = async () => {
    setSaving(true);
    const ok = await persist();
    setSaving(false);
    if (ok) onClose();
  };

  const copyLink = async () => {
    setSaving(true);
    await persist();
    setSaving(false);
    const enc = encodeBio(draft);
    const url = `${window.location.origin}/u/${encodeURIComponent(username)}${enc ? `?c=${enc}` : ""}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="card my-8 w-full max-w-2xl p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vapor">Customize profile</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-haze hover:bg-[color:var(--color-line)]">
            <CloseIcon size={16} />
          </button>
        </div>

        <Field label="Tagline">
          <input
            className="input w-full px-3 py-2 text-sm"
            placeholder="Long-haul widebody enthusiast ✈"
            value={draft.tagline}
            maxLength={120}
            onChange={(e) => set({ tagline: e.target.value })}
          />
        </Field>

        <Field label="About you">
          <textarea
            className="input min-h-[80px] w-full px-3 py-2 text-sm"
            placeholder="Tell people about yourself, your VA, the routes you love to fly…"
            value={draft.description}
            maxLength={800}
            onChange={(e) => set({ description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Home base">
            <input
              className="input w-full px-3 py-2 text-sm uppercase"
              placeholder="EHAM"
              value={draft.homeAirport}
              maxLength={8}
              onChange={(e) => set({ homeAirport: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Favorite aircraft">
            <input
              className="input w-full px-3 py-2 text-sm"
              placeholder="Boeing 777-300ER"
              value={draft.favoriteAircraft}
              maxLength={60}
              onChange={(e) => set({ favoriteAircraft: e.target.value })}
            />
          </Field>
        </div>

        {/* Theme */}
        <div className="mt-1 mb-4">
          <label className="mb-1.5 block text-xs text-haze">Accent theme</label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => set({ accent: t.id })}
                title={t.name}
                className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-[color:var(--color-panel)] transition ${
                  draft.accent === t.id ? "ring-2" : "hover:scale-110"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${t.trailSoft}, ${t.trail})`,
                  // @ts-expect-error custom prop
                  "--tw-ring-color": t.trail,
                }}
              />
            ))}
          </div>
        </div>

        {/* Links */}
        <label className="mb-1.5 block text-xs text-haze">Links</label>
        <div className="grid grid-cols-2 gap-3">
          {LINK_FIELDS.map((f) => (
            <input
              key={f.key}
              className="input w-full px-3 py-2 text-sm"
              placeholder={`${f.label} — ${f.ph}`}
              value={draft.links[f.key] || ""}
              onChange={(e) => setLink(f.key, e.target.value)}
            />
          ))}
        </div>

        {err && (
          <div className="mt-4 rounded-lg border border-[color:var(--color-rose)]/40 bg-[color:var(--color-rose)]/8 px-3 py-2 text-xs text-rose">
            {err}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={copyLink}
            disabled={saving}
            className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-haze hover:border-[color:var(--color-trail)]/40 hover:text-trail-soft disabled:opacity-50"
          >
            {copied ? "Link copied ✓" : "Copy share link"}
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-haze hover:bg-[color:var(--color-line)]">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-trail rounded-lg px-5 py-2 text-sm disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-dim">
          Your profile is saved to Contrail so anyone visiting your page sees it. Challenges are managed
          from the Challenges tab and shown automatically.
        </p>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-xs text-haze">{label}</label>
      {children}
    </div>
  );
}
