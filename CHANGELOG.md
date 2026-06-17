# Changelog

**v1.14 — June 16, 2026**

✨ **New**
- Custom themes — pick an accent colour for the whole app from the new palette button (Contrail cyan, Sky, Violet, Gold, Rose, Mint, Coral, Ice); your choice also styles your public profile
- Profiles got a redesign and a lot more to customise — a tagline, home base, favourite aircraft, and social links (Discord, YouTube, Twitch, website)
- Your Challenges now show on your public profile with live progress bars
- Add a flight to a challenge straight from your logbook — no need to open the challenge first

---

**v1.13 — June 16, 2026**

✨ **New**
- Challenges — create a goal (like a World Conquest), hand-pick flights from your logbook, and get the whole dashboard scoped to just those flights: a map, countries map, stats, and awards, plus a progress bar toward your target (countries, airports, flights, or distance) and an optional IFC thread link

---

**v1.12 — June 16, 2026**

🔧 **Improved**
- Live flight routes now read like a real tracker — your completed path is a solid line, and only the remaining leg to your destination is drawn as a faint dashed line (instead of the whole filed plan), with antimeridian crossings (e.g. flights to Australia) finally rendering smoothly

---

**v1.11 — June 16, 2026**

✨ **New**
- Log in with Infinite Flight — verify you own your IFC account (by adding a one-time code to your IFC profile) to claim and edit your Contrail profile; we only read your public profile, never your password

🐞 **Fixed**
- Flight plan paths no longer dart off toward Africa — navpoints Infinite Flight can't place (which it returns as 0,0) are dropped, and long routes that cross the antimeridian (e.g. to Australia) now draw correctly

---

**v1.10 — June 16, 2026**

✨ **New**
- Global live map — the live tracker now opens on a world map of *every* active Infinite Flight, FlightRadar24-style, with a count and Expert / Training / Casual filters; search still focuses a single flight, and clicking any plane lets you track it or open its profile

🔧 **Improved**
- Real aircraft markers — flights now use a proper top-down plane icon that rotates to the heading, instead of the old emoji
- Smoother tracking — the live route no longer flickers or jumps on every refresh; the map updates the aircraft and trail in place

---

**v1.9 — June 16, 2026**

✨ **New**
- Profiles are now persistent — your description and ongoing challenges save to Contrail, so anyone visiting your page sees them (no share-link needed)
- Leaderboards — rank pilots by distance, flights, hours, countries, airports, aircraft types, and landings; you join the board by opening your profile

🔧 **Improved**
- Editing your profile is protected — once claimed on a device, only that device can change it

---

**v1.8 — June 16, 2026**

✨ **New**
- Live tracker — follow any Infinite Flight pilot by IFC username or live callsign, with real position, telemetry, planned route, and flown track, plus a watchlist and a shareable link
- Public profiles at /u/your-username — anyone's real career stats, route map, statistics, achievements, and a "live now" panel, all pulled fresh from Infinite Flight
- Editable profile — add a description and ongoing challenges (each with a link to its IFC thread); your bio saves locally and travels in your share link so others can see it

---

**v1.7 — June 16, 2026**

✨ **New**
- A refined visual identity — new logo, the Inter typeface, a deeper and more premium colour palette, and a clean custom icon set replacing emoji throughout
- Logbook pagination — long logbooks now load in pages with a "Showing 50 of 235" count and Show more / Show all

🐞 **Fixed**
- The "Log flights automatically" toggle no longer overflows its track when switched on
- Logbook rows now align correctly when a flight has no departure or arrival airport set

---

**v1.6 — June 16, 2026**

🐞 **Fixed**
- Contrail Wrapped no longer shows the map zoom/toggle controls bleeding through its overlay, and no longer flickers when opened over the 3D globe (modals now sit above all map controls; the Wrapped backdrop is fully opaque)

---

**v1.5 — June 16, 2026**

🔧 **Improved**
- The 3D globe now renders reliably with a night-earth texture and a type-safe init (fixes an occasional blank globe)

---

**v1.4 — June 16, 2026**

✨ **New**
- 3D globe map view — a rotating night-earth with glowing great-circle arcs and airport points, with a Routes / Globe / Countries toggle

---

**v1.3 — June 16, 2026**

✨ **New**
- Live flight tracking — when you're airborne in Infinite Flight, see your flight on a live map with real telemetry (altitude, speed, heading), the filed route, and the actual flown track
- Flight detail pages — tap any logbook flight for a focused route map and the full picture (distance, duration, average speed, fuel & CO₂, server, landings)

---

**v1.2 — June 16, 2026**

✨ **New**
- Achievements — 30 tiered badges across Distance, Volume, Time, World, Fleet, and Special, with progress toward the ones you haven't earned yet
- Visited-countries map — a world choropleth filling in everywhere you've flown
- Contrail Wrapped — a per-year and all-time recap of your flying, with a copyable share summary

🔧 **Improved**
- Richer stats — CO₂ burned, total landings, and an Expert / Training / Casual server breakdown

---

**v1.1 — June 16, 2026**

✨ **New**
- Discord community & support link in the footer
- Changelog bot — auto-posts release notes to Discord on every push

---

**v1.0 — June 16, 2026**

✨ **New**
- Contrail — a personal flightbook with a route map, full stats, and Infinite Flight logbook sync

🔧 **Improved**
- Real Infinite Flight Live API integration — pulls your actual profile and logbook (replaced the initial simulated sync)

---

Full details on bigger releases go in **#announcements**.
💬 Community & support: https://discord.gg/f4rhKFa6MD

---
