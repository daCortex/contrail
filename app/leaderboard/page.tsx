import type { Metadata } from "next";
import Leaderboard from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard · Contrail",
  description: "Top Infinite Flight pilots on Contrail by distance, hours, countries, and more.",
};

export default function LeaderboardPage() {
  return <Leaderboard />;
}
