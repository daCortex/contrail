import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Contrail — your flightbook",
  description:
    "Log every flight, map your routes, and track the stats — countries, aircraft, airports, and time aloft. Connect Infinite Flight to auto-log from your logbook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="sky-bg min-h-screen antialiased">{children}</body>
    </html>
  );
}
