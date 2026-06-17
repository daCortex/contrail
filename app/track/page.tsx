import { Suspense } from "react";
import type { Metadata } from "next";
import TrackView from "@/components/TrackView";

export const metadata: Metadata = {
  title: "Live tracker · Contrail",
  description: "Track any Infinite Flight pilot by IFC username or live callsign.",
};

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="px-6 py-24 text-center text-sm text-dim">Loading…</div>}>
      <TrackView />
    </Suspense>
  );
}
