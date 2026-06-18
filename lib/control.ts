/**
 * Reads this app's live control state from the Aileron control plane
 * (god-mode console at /crew). Fail-open: any error returns null so the
 * app renders normally and is never taken down by a control-plane hiccup.
 */
const PRODUCT = "contrail";
const BASE = process.env.AILERON_CONTROL_URL || "https://aileronifc.vercel.app";

export type ControlState = {
  status: "operational" | "maintenance" | "down";
  message: string;
  flags: Record<string, boolean>;
};

export async function getControl(): Promise<ControlState | null> {
  try {
    const headers: Record<string, string> = {};
    if (process.env.CONTROL_SECRET) headers["x-control-secret"] = process.env.CONTROL_SECRET;
    const res = await fetch(`${BASE}/api/control?product=${PRODUCT}`, {
      headers,
      next: { revalidate: 20 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j.ok) return null;
    return { status: j.status, message: j.message ?? "", flags: j.flags ?? {} };
  } catch {
    return null;
  }
}

/** Convenience: is a given feature flag enabled? Defaults to `fallback`. */
export async function flagEnabled(key: string, fallback = true): Promise<boolean> {
  const c = await getControl();
  if (!c || !(key in c.flags)) return fallback;
  return c.flags[key];
}
