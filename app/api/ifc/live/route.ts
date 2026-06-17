import { NextResponse } from "next/server";
import { ifConfigured, findLiveFlight } from "@/lib/infiniteflight";
import { buildLivePayload } from "@/lib/live-payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!ifConfigured) {
    return NextResponse.json({ error: "Infinite Flight API is not configured." }, { status: 503 });
  }

  let userId = "";
  try {
    const body = await req.json();
    userId = (body?.userId ?? "").toString();
  } catch {
    /* ignore */
  }
  if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });

  const hit = await findLiveFlight(userId);
  return NextResponse.json({ live: hit ? await buildLivePayload(hit) : null });
}
