import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRODUCT = "contrail";
const BASE = process.env.AILERON_CONTROL_URL || "https://aileronifc.vercel.app";

/**
 * Diagnostic: reports whether this app is correctly wired to Aileron's control
 * plane. Does NOT expose the secret value — only whether one is configured and
 * what status the live poll returns.
 *   200 + honored:true  → connected (secret matches, or Aileron is open)
 *   403 + secretConfigured:true  → secret is WRONG (mismatch)
 *   403 + secretConfigured:false → secret is MISSING (Aileron requires one)
 */
export async function GET() {
  const secretConfigured = !!process.env.CONTROL_SECRET;
  const headers: Record<string, string> = {};
  if (process.env.CONTROL_SECRET) headers["x-control-secret"] = process.env.CONTROL_SECRET;

  let status = 0;
  let honored = false;
  try {
    const res = await fetch(`${BASE}/api/control?product=${PRODUCT}`, { headers, cache: "no-store" });
    status = res.status;
    if (res.ok) {
      const j = await res.json();
      honored = !!j?.ok;
    }
  } catch {
    /* network error → status stays 0 */
  }

  return NextResponse.json(
    { ok: true, product: PRODUCT, aileronUrl: BASE, secretConfigured, status, honored },
    { headers: { "Cache-Control": "no-store" } }
  );
}
