"use client";

import { useState } from "react";
import { startLogin, verifyLogin, StartResult, Session } from "@/lib/auth-client";
import { CloseIcon, ArrowRightIcon } from "./icons";

export default function LoginModal({
  open,
  onClose,
  onLogin,
}: {
  open: boolean;
  onClose: () => void;
  onLogin: (s: Session) => void;
}) {
  const [username, setUsername] = useState("");
  const [challenge, setChallenge] = useState<StartResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const reset = () => {
    setChallenge(null);
    setErr("");
    setUsername("");
  };
  const close = () => {
    reset();
    onClose();
  };

  const start = async () => {
    if (!username.trim()) return;
    setBusy(true);
    setErr("");
    try {
      setChallenge(await startLogin(username));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start login.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!challenge) return;
    setBusy(true);
    setErr("");
    try {
      const session = await verifyLogin(challenge.token);
      onLogin(session);
      reset();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyCode = () => {
    if (!challenge) return;
    navigator.clipboard?.writeText(challenge.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div onClick={(e) => e.stopPropagation()} className="card my-8 w-full max-w-lg p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-vapor">Log in with Infinite Flight</h2>
          <button onClick={close} className="rounded-lg p-1.5 text-haze hover:bg-[color:var(--color-line)]">
            <CloseIcon size={16} />
          </button>
        </div>

        {!challenge ? (
          <>
            <p className="mb-5 text-sm text-haze">
              Verify you own your Infinite Flight Community account to claim your profile. Enter your
              IFC username to start.
            </p>
            <label className="block text-xs text-haze">IFC username</label>
            <div className="mt-1 flex gap-2">
              <span className="flex items-center rounded-l-lg border border-r-0 border-[color:var(--color-line)] bg-[color:var(--color-deep)] px-3 text-sm text-dim">
                @
              </span>
              <input
                className="input flex-1 rounded-l-none px-3 py-2 text-sm"
                value={username}
                placeholder="your_ifc_username"
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && start()}
              />
              <button onClick={start} disabled={busy || !username.trim()} className="btn-trail rounded-lg px-4 py-2 text-sm disabled:opacity-40">
                {busy ? "…" : "Continue"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-haze">
              Almost there, <span className="text-vapor">@{challenge.username}</span>. Copy this code into
              your IFC profile, then come back and verify.
            </p>
            <div className="card-2 mb-4 flex items-center justify-between gap-3 p-3">
              <code className="font-mono text-sm text-trail-soft">{challenge.code}</code>
              <button onClick={copyCode} className="rounded-lg border border-[color:var(--color-line)] px-3 py-1.5 text-xs text-haze hover:text-vapor">
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <ol className="mb-4 space-y-2 text-sm text-haze">
              <li className="flex gap-2">
                <span className="text-dim">1.</span>
                <span>
                  Open your{" "}
                  <a href={challenge.profileUrl} target="_blank" rel="noreferrer" className="text-trail-soft hover:underline">
                    IFC profile settings
                  </a>{" "}
                  and paste the code into your <span className="text-vapor">About me</span> or{" "}
                  <span className="text-vapor">Location</span> field.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-dim">2.</span>
                <span>Save your IFC profile, then click Verify below.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-dim">3.</span>
                <span>Once verified you can remove the code — you&rsquo;ll stay logged in.</span>
              </li>
            </ol>
            <div className="flex items-center justify-between gap-3">
              <button onClick={reset} className="text-xs text-dim hover:text-haze">
                ← Use a different account
              </button>
              <button onClick={verify} disabled={busy} className="btn-trail flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm disabled:opacity-50">
                {busy ? "Verifying…" : "Verify"} <ArrowRightIcon size={14} />
              </button>
            </div>
          </>
        )}

        {err && (
          <div className="mt-4 rounded-lg border border-[color:var(--color-rose)]/40 bg-[color:var(--color-rose)]/8 px-3 py-2 text-xs text-rose">
            {err}
          </div>
        )}

        <p className="mt-5 text-[11px] leading-relaxed text-dim">
          We only read your public IFC profile to confirm the code. Contrail never sees your password
          and never posts on your behalf.
        </p>
      </div>
    </div>
  );
}
