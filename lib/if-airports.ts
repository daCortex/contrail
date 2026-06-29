// Server-side airport resolver + search over the full OurAirports dataset
// (~72k airports). Each airport carries both its ICAO and IATA code, so we can
// resolve either, search by code or city, and display them clearly. The 4.5MB
// table is read from disk at runtime (not statically imported) and bundled via
// outputFileTracingIncludes. Imported only from server routes.

import fs from "fs";
import path from "path";

// [icao, iata, city, cc, lat, lon, importance]
type Row = [string, string, string, string, number, number, number?];
interface Data {
  a: Row[];
  i: Record<string, number>;
  c: Record<string, string>;
}

let DATA: Data | null = null;
function data(): Data {
  if (!DATA) {
    const file = path.join(process.cwd(), "lib", "data", "airports-full.json");
    DATA = JSON.parse(fs.readFileSync(file, "utf8")) as Data;
  }
  return DATA;
}

// The world's busiest hubs — boosted so a city search surfaces them first
// (OurAirports tags several airports per city as "large", so size alone can't
// distinguish e.g. CDG from Le Bourget or SYD from Western Sydney).
const HUBS = new Set(
  ("ATL LAX ORD DFW DEN JFK SFO SEA LAS MCO MIA EWR BOS PHX IAH CLT LGA DCA IAD " +
    "YYZ YVR YUL MEX CUN GRU GIG EZE SCL BOG LIM PTY YYC " +
    "LHR LGW STN CDG ORY AMS FRA MUC DUS BER MAD BCN PMI FCO MXP VCE LIN NAP ZRH GVA VIE " +
    "BRU CPH ARN OSL HEL WAW PRG BUD ATH LIS OPO DUB MAN EDI LYS NCE SVO DME LED IST SAW KEF " +
    "DXB AUH DOH RUH JED KWI BAH MCT TLV AMM CAI JNB CPT DUR NBO ADD LOS ACC CMN ALG TUN " +
    "HND NRT KIX NGO ICN GMP PEK PKX PVG SHA CAN SZX CTU XIY HKG TPE TSA SIN KUL BKK DMK " +
    "CGK DPS SUB MNL CEB HAN SGN DEL BOM BLR MAA HYD CCU GOI CMB MLE DAC KHI ISB LHE " +
    "SYD MEL BNE PER ADL OOL AKL CHC WLG NAN GUM HNL").split(/\s+/)
);

export interface ResolvedAirport {
  code: string; // preferred display code — IATA when known, else ICAO
  icao: string;
  iata: string;
  city: string;
  country: string;
  cc: string;
  lat: number;
  lon: number;
}

function toAirport(row: Row): ResolvedAirport {
  const [icao, iata, city, cc, lat, lon] = row;
  return {
    code: iata || icao,
    icao,
    iata,
    city: city || icao || iata,
    country: data().c[cc] || cc,
    cc,
    lat,
    lon,
  };
}

/** Resolve an ICAO or IATA code to a full airport (null if unknown). */
export function resolveAirport(code: string): ResolvedAirport | null {
  const c = (code || "").trim().toUpperCase();
  if (!c) return null;
  const d = data();
  const idx = d.i[c];
  if (idx === undefined) return null;
  return toAirport(d.a[idx]);
}

/** Fuzzy search by ICAO, IATA, or city. Returns the best matches. */
export function searchAirports(query: string, limit = 10): ResolvedAirport[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const d = data();
  const scored: { row: Row; score: number }[] = [];
  for (const row of d.a) {
    const [icao, iata, city] = row;
    const ic = icao.toLowerCase();
    const ia = iata.toLowerCase();
    const ct = city.toLowerCase();
    // Primary city name, ignoring qualifiers like "Sydney (Mascot)".
    const ctp = ct.split(/\s*[(,]/)[0].trim();
    let score = -1;
    if (ia === q || ic === q) score = 100;
    else if (ia.startsWith(q) || ic.startsWith(q)) score = 80;
    else if (ctp === q) score = 70;
    else if (ctp.startsWith(q)) score = 55;
    else if (ct.includes(q)) score = 35;
    if (score > 0) {
      // Surface the airports people actually fly: IATA + larger/scheduled ones.
      // Weighted enough that a major hub (e.g. SYD "Sydney (Mascot)") still beats
      // a tiny airfield whose city is exactly the query.
      if (iata) score += 6;
      score += (row[6] || 0) * 10; // importance: large=3, medium=2, small=1
      if (iata && HUBS.has(iata)) score += 50; // famous hubs win their city search
      scored.push({ row, score });
    }
    if (scored.length > 4000) break; // safety cap on huge prefix matches
  }
  return scored
    .sort((a, b) => b.score - a.score || a.row[2].localeCompare(b.row[2]))
    .slice(0, limit)
    .map((s) => toAirport(s.row));
}
