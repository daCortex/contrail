import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="en" className={inter.variable}>
      <body className="sky-bg min-h-screen antialiased">{children}</body>
    </html>
  );
}
