import { NextResponse } from "next/server";
import { searchAirports, resolveAirport, ResolvedAirport } from "@/lib/if-airports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/airports?q=seattle — search by ICAO, IATA, or city.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") || "";
  return NextResponse.json({ airports: q.trim() ? searchAirports(q, 10) : [] });
}

// POST { codes: ["KSEA","LHR"] } — batch-resolve codes to coordinates.
export async function POST(req: Request) {
  let codes: string[] = [];
  try {
    const body = await req.json();
    codes = Array.isArray(body?.codes) ? body.codes : [];
  } catch {
    /* ignore */
  }
  const out: Record<string, ResolvedAirport> = {};
  for (const c of codes.slice(0, 500)) {
    const a = resolveAirport(c);
    if (a) out[c.trim().toUpperCase()] = a;
  }
  return NextResponse.json({ airports: out });
}
