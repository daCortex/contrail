"use client";

import { useEffect, useState } from "react";
import {
  ProfileBio,
  EMPTY_BIO,
  Challenge,
  saveBio,
  encodeBio,
  uid,
  safeUrl,
  saveRemoteBio,
} from "@/lib/profile";
import { CloseIcon, TrashIcon, PlusIcon } from "./icons";

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
      setDraft(bio ? { ...bio, challenges: [...bio.challenges] } : EMPTY_BIO);
      setErr("");
    }
  }, [open, bio]);

  if (!open) return null;

  const addChallenge = () =>
    setDraft((d) => ({
      ...d,
      challenges: [...d.challenges, { id: uid(), title: "", ifcUrl: "", description: "" }],
    }));

  const updateChallenge = (id: string, patch: Partial<Challenge>) =>
    setDraft((d) => ({
      ...d,
      challenges: d.challenges.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));

  const removeChallenge = (id: string) =>
    setDraft((d) => ({ ...d, challenges: d.challenges.filter((c) => c.id !== id) }));

  // Save locally always; try the server (persistent + visible to everyone).
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
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="card my-8 w-full max-w-2xl p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vapor">Edit profile</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-haze hover:bg-[color:var(--color-line)]">
            <CloseIcon size={16} />
          </button>
        </div>

        <label className="mb-1 block text-xs text-haze">Description</label>
        <textarea
          className="input min-h-[90px] w-full px-3 py-2 text-sm"
          placeholder="Tell people about yourself, your VA, the routes you love to fly…"
          value={draft.description}
          maxLength={600}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        />
        <div className="mt-1 text-right text-[10px] text-dim">{draft.description.length}/600</div>

        <div className="mt-4 mb-2 flex items-center justify-between">
          <label className="text-xs text-haze">Ongoing challenges</label>
          <button
            type="button"
            onClick={addChallenge}
            className="flex items-center gap-1 text-xs text-trail-soft hover:underline"
          >
            <PlusIcon size={13} /> Add challenge
          </button>
        </div>

        <div className="space-y-3">
          {draft.challenges.length === 0 && (
            <div className="card-2 px-4 py-6 text-center text-xs text-dim">
              No challenges yet. Add one and link its IFC thread.
            </div>
          )}
          {draft.challenges.map((c) => {
            const badUrl = c.ifcUrl.trim() !== "" && !safeUrl(c.ifcUrl);
            return (
              <div key={c.id} className="card-2 space-y-2 p-3">
                <div className="flex items-center gap-2">
                  <input
                    className="input flex-1 px-3 py-1.5 text-sm"
                    placeholder="Challenge title"
                    value={c.title}
                    onChange={(e) => updateChallenge(c.id, { title: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeChallenge(c.id)}
                    className="rounded-md p-1.5 text-rose hover:bg-[color:var(--color-line)]"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
                <input
                  className="input w-full px-3 py-1.5 text-sm"
                  placeholder="IFC thread link (https://community.infiniteflight.com/…)"
                  value={c.ifcUrl}
                  onChange={(e) => updateChallenge(c.id, { ifcUrl: e.target.value })}
                />
                {badUrl && <div className="text-[10px] text-rose">Enter a valid http(s) link.</div>}
                <textarea
                  className="input min-h-[56px] w-full px-3 py-1.5 text-sm"
                  placeholder="Explain the challenge…"
                  value={c.description}
                  maxLength={400}
                  onChange={(e) => updateChallenge(c.id, { description: e.target.value })}
                />
              </div>
            );
          })}
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
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[color:var(--color-line)] px-4 py-2 text-sm text-haze hover:bg-[color:var(--color-line)]"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-trail rounded-lg px-5 py-2 text-sm disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-dim">
          Your profile is saved to Contrail so anyone visiting your page sees it. Live stats and your
          map are always pulled fresh from Infinite Flight.
        </p>
      </form>
    </div>
  );
}
