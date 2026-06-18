import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { getControl } from "@/lib/control";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const control = await getControl();
  const offline = control && control.status !== "operational";

  return (
    <html lang="en" className={inter.variable}>
      <body className="sky-bg min-h-screen antialiased">
        {offline ? (
          <MaintenanceScreen
            name="Contrail"
            status={control!.status}
            message={control!.message}
          />
        ) : (
          children
        )}
      </body>
    </html>
  );
}

function MaintenanceScreen({
  name,
  status,
  message,
}: {
  name: string;
  status: "operational" | "maintenance" | "down";
  message: string;
}) {
  const heading = status === "down" ? "Temporarily offline" : "Down for maintenance";
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b1020",
        color: "#eef1f7",
        fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "30rem", textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "999px",
            padding: "0.35rem 0.85rem",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#c9a84c",
          }}
        >
          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "999px", background: "#c9a84c" }} />
          {name}
        </div>
        <h1 style={{ marginTop: "1.5rem", fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.1 }}>
          {heading}
        </h1>
        <p style={{ marginTop: "1rem", color: "rgba(238,241,247,0.7)", lineHeight: 1.6 }}>
          {message || "We're making things better and will be back shortly. Thanks for your patience."}
        </p>
      </div>
    </main>
  );
}
