import { NextResponse } from "next/server";
import { dbConfigured, leaderboard, LeaderMetric } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METRICS: LeaderMetric[] = [
  "distance_km",
  "flights",
  "minutes",
  "countries",
  "airports",
  "aircraft_types",
  "landings",
];

export async function GET(req: Request) {
  if (!dbConfigured) return NextResponse.json({ rows: [], dbConfigured: false });
  const param = new URL(req.url).searchParams.get("metric") as LeaderMetric | null;
  const metric: LeaderMetric = param && METRICS.includes(param) ? param : "distance_km";
  const rows = await leaderboard(metric, 50);
  return NextResponse.json({ rows, metric, dbConfigured: true });
}
