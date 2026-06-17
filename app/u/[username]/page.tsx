import { Suspense } from "react";
import type { Metadata } from "next";
import ProfileView from "@/components/ProfileView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const name = decodeURIComponent(username);
  return {
    title: `@${name} · Contrail`,
    description: `${name}'s Infinite Flight flightbook on Contrail — routes, stats, and achievements.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return (
    <Suspense fallback={<div className="px-6 py-24 text-center text-sm text-dim">Loading…</div>}>
      <ProfileView username={decodeURIComponent(username)} />
    </Suspense>
  );
}
