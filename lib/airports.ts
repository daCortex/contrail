// Curated database of major world airports.
// Fields: IATA, ICAO, name, city, country, ISO country code, lat, lon.
// Used for route mapping, country tallies, and the manual-log autocomplete.

export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  cc: string; // ISO 3166-1 alpha-2
  lat: number;
  lon: number;
}

export const AIRPORTS: Airport[] = [
  // North America
  { iata: "ATL", icao: "KATL", name: "Hartsfield–Jackson Atlanta Intl", city: "Atlanta", country: "United States", cc: "US", lat: 33.6407, lon: -84.4277 },
  { iata: "LAX", icao: "KLAX", name: "Los Angeles Intl", city: "Los Angeles", country: "United States", cc: "US", lat: 33.9416, lon: -118.4085 },
  { iata: "ORD", icao: "KORD", name: "O'Hare Intl", city: "Chicago", country: "United States", cc: "US", lat: 41.9742, lon: -87.9073 },
  { iata: "DFW", icao: "KDFW", name: "Dallas/Fort Worth Intl", city: "Dallas", country: "United States", cc: "US", lat: 32.8998, lon: -97.0403 },
  { iata: "DEN", icao: "KDEN", name: "Denver Intl", city: "Denver", country: "United States", cc: "US", lat: 39.8561, lon: -104.6737 },
  { iata: "JFK", icao: "KJFK", name: "John F. Kennedy Intl", city: "New York", country: "United States", cc: "US", lat: 40.6413, lon: -73.7781 },
  { iata: "SFO", icao: "KSFO", name: "San Francisco Intl", city: "San Francisco", country: "United States", cc: "US", lat: 37.6213, lon: -122.379 },
  { iata: "SEA", icao: "KSEA", name: "Seattle–Tacoma Intl", city: "Seattle", country: "United States", cc: "US", lat: 47.4502, lon: -122.3088 },
  { iata: "LAS", icao: "KLAS", name: "Harry Reid Intl", city: "Las Vegas", country: "United States", cc: "US", lat: 36.084, lon: -115.1537 },
  { iata: "MCO", icao: "KMCO", name: "Orlando Intl", city: "Orlando", country: "United States", cc: "US", lat: 28.4312, lon: -81.3081 },
  { iata: "MIA", icao: "KMIA", name: "Miami Intl", city: "Miami", country: "United States", cc: "US", lat: 25.7959, lon: -80.287 },
  { iata: "EWR", icao: "KEWR", name: "Newark Liberty Intl", city: "Newark", country: "United States", cc: "US", lat: 40.6895, lon: -74.1745 },
  { iata: "BOS", icao: "KBOS", name: "Logan Intl", city: "Boston", country: "United States", cc: "US", lat: 42.3656, lon: -71.0096 },
  { iata: "PHX", icao: "KPHX", name: "Sky Harbor Intl", city: "Phoenix", country: "United States", cc: "US", lat: 33.4342, lon: -112.0116 },
  { iata: "IAH", icao: "KIAH", name: "George Bush Intercontinental", city: "Houston", country: "United States", cc: "US", lat: 29.9902, lon: -95.3368 },
  { iata: "IAD", icao: "KIAD", name: "Washington Dulles Intl", city: "Washington", country: "United States", cc: "US", lat: 38.9531, lon: -77.4565 },
  { iata: "DCA", icao: "KDCA", name: "Reagan National", city: "Washington", country: "United States", cc: "US", lat: 38.8512, lon: -77.0402 },
  { iata: "MSP", icao: "KMSP", name: "Minneapolis–St. Paul Intl", city: "Minneapolis", country: "United States", cc: "US", lat: 44.8848, lon: -93.2223 },
  { iata: "DTW", icao: "KDTW", name: "Detroit Metro", city: "Detroit", country: "United States", cc: "US", lat: 42.2162, lon: -83.3554 },
  { iata: "CLT", icao: "KCLT", name: "Charlotte Douglas Intl", city: "Charlotte", country: "United States", cc: "US", lat: 35.214, lon: -80.9431 },
  { iata: "PHL", icao: "KPHL", name: "Philadelphia Intl", city: "Philadelphia", country: "United States", cc: "US", lat: 39.8729, lon: -75.2437 },
  { iata: "SLC", icao: "KSLC", name: "Salt Lake City Intl", city: "Salt Lake City", country: "United States", cc: "US", lat: 40.7899, lon: -111.9791 },
  { iata: "SAN", icao: "KSAN", name: "San Diego Intl", city: "San Diego", country: "United States", cc: "US", lat: 32.7338, lon: -117.1933 },
  { iata: "HNL", icao: "PHNL", name: "Daniel K. Inouye Intl", city: "Honolulu", country: "United States", cc: "US", lat: 21.3187, lon: -157.9224 },
  { iata: "YYZ", icao: "CYYZ", name: "Toronto Pearson Intl", city: "Toronto", country: "Canada", cc: "CA", lat: 43.6777, lon: -79.6248 },
  { iata: "YVR", icao: "CYVR", name: "Vancouver Intl", city: "Vancouver", country: "Canada", cc: "CA", lat: 49.1947, lon: -123.1792 },
  { iata: "YUL", icao: "CYUL", name: "Montréal–Trudeau Intl", city: "Montreal", country: "Canada", cc: "CA", lat: 45.4706, lon: -73.7408 },
  { iata: "YYC", icao: "CYYC", name: "Calgary Intl", city: "Calgary", country: "Canada", cc: "CA", lat: 51.1139, lon: -114.0203 },
  { iata: "MEX", icao: "MMMX", name: "Mexico City Intl", city: "Mexico City", country: "Mexico", cc: "MX", lat: 19.4363, lon: -99.0721 },
  { iata: "CUN", icao: "MMUN", name: "Cancún Intl", city: "Cancún", country: "Mexico", cc: "MX", lat: 21.0365, lon: -86.8771 },
  // South America
  { iata: "GRU", icao: "SBGR", name: "São Paulo–Guarulhos Intl", city: "São Paulo", country: "Brazil", cc: "BR", lat: -23.4356, lon: -46.4731 },
  { iata: "GIG", icao: "SBGL", name: "Rio de Janeiro–Galeão Intl", city: "Rio de Janeiro", country: "Brazil", cc: "BR", lat: -22.81, lon: -43.2506 },
  { iata: "EZE", icao: "SAEZ", name: "Ministro Pistarini Intl", city: "Buenos Aires", country: "Argentina", cc: "AR", lat: -34.8222, lon: -58.5358 },
  { iata: "SCL", icao: "SCEL", name: "Comodoro Arturo Merino Benítez", city: "Santiago", country: "Chile", cc: "CL", lat: -33.393, lon: -70.7858 },
  { iata: "BOG", icao: "SKBO", name: "El Dorado Intl", city: "Bogotá", country: "Colombia", cc: "CO", lat: 4.7016, lon: -74.1469 },
  { iata: "LIM", icao: "SPJC", name: "Jorge Chávez Intl", city: "Lima", country: "Peru", cc: "PE", lat: -12.0219, lon: -77.1143 },
  // Europe
  { iata: "LHR", icao: "EGLL", name: "Heathrow", city: "London", country: "United Kingdom", cc: "GB", lat: 51.47, lon: -0.4543 },
  { iata: "LGW", icao: "EGKK", name: "Gatwick", city: "London", country: "United Kingdom", cc: "GB", lat: 51.1537, lon: -0.1821 },
  { iata: "MAN", icao: "EGCC", name: "Manchester", city: "Manchester", country: "United Kingdom", cc: "GB", lat: 53.3537, lon: -2.275 },
  { iata: "EDI", icao: "EGPH", name: "Edinburgh", city: "Edinburgh", country: "United Kingdom", cc: "GB", lat: 55.95, lon: -3.3725 },
  { iata: "DUB", icao: "EIDW", name: "Dublin", city: "Dublin", country: "Ireland", cc: "IE", lat: 53.4213, lon: -6.2701 },
  { iata: "CDG", icao: "LFPG", name: "Charles de Gaulle", city: "Paris", country: "France", cc: "FR", lat: 49.0097, lon: 2.5479 },
  { iata: "ORY", icao: "LFPO", name: "Orly", city: "Paris", country: "France", cc: "FR", lat: 48.7233, lon: 2.3794 },
  { iata: "NCE", icao: "LFMN", name: "Côte d'Azur", city: "Nice", country: "France", cc: "FR", lat: 43.6584, lon: 7.2159 },
  { iata: "AMS", icao: "EHAM", name: "Schiphol", city: "Amsterdam", country: "Netherlands", cc: "NL", lat: 52.3105, lon: 4.7683 },
  { iata: "FRA", icao: "EDDF", name: "Frankfurt", city: "Frankfurt", country: "Germany", cc: "DE", lat: 50.0379, lon: 8.5622 },
  { iata: "MUC", icao: "EDDM", name: "Munich", city: "Munich", country: "Germany", cc: "DE", lat: 48.3538, lon: 11.7861 },
  { iata: "BER", icao: "EDDB", name: "Berlin Brandenburg", city: "Berlin", country: "Germany", cc: "DE", lat: 52.3667, lon: 13.5033 },
  { iata: "DUS", icao: "EDDL", name: "Düsseldorf", city: "Düsseldorf", country: "Germany", cc: "DE", lat: 51.2895, lon: 6.7668 },
  { iata: "MAD", icao: "LEMD", name: "Adolfo Suárez Madrid–Barajas", city: "Madrid", country: "Spain", cc: "ES", lat: 40.4719, lon: -3.5626 },
  { iata: "BCN", icao: "LEBL", name: "Barcelona–El Prat", city: "Barcelona", country: "Spain", cc: "ES", lat: 41.2974, lon: 2.0833 },
  { iata: "PMI", icao: "LEPA", name: "Palma de Mallorca", city: "Palma", country: "Spain", cc: "ES", lat: 39.5517, lon: 2.7388 },
  { iata: "LIS", icao: "LPPT", name: "Humberto Delgado", city: "Lisbon", country: "Portugal", cc: "PT", lat: 38.7742, lon: -9.1342 },
  { iata: "FCO", icao: "LIRF", name: "Fiumicino", city: "Rome", country: "Italy", cc: "IT", lat: 41.8003, lon: 12.2389 },
  { iata: "MXP", icao: "LIMC", name: "Malpensa", city: "Milan", country: "Italy", cc: "IT", lat: 45.6306, lon: 8.7281 },
  { iata: "VCE", icao: "LIPZ", name: "Venice Marco Polo", city: "Venice", country: "Italy", cc: "IT", lat: 45.5053, lon: 12.3519 },
  { iata: "ZRH", icao: "LSZH", name: "Zurich", city: "Zurich", country: "Switzerland", cc: "CH", lat: 47.4647, lon: 8.5492 },
  { iata: "GVA", icao: "LSGG", name: "Geneva", city: "Geneva", country: "Switzerland", cc: "CH", lat: 46.2381, lon: 6.1089 },
  { iata: "VIE", icao: "LOWW", name: "Vienna Intl", city: "Vienna", country: "Austria", cc: "AT", lat: 48.1103, lon: 16.5697 },
  { iata: "BRU", icao: "EBBR", name: "Brussels", city: "Brussels", country: "Belgium", cc: "BE", lat: 50.9014, lon: 4.4844 },
  { iata: "CPH", icao: "EKCH", name: "Copenhagen", city: "Copenhagen", country: "Denmark", cc: "DK", lat: 55.6181, lon: 12.6561 },
  { iata: "ARN", icao: "ESSA", name: "Stockholm Arlanda", city: "Stockholm", country: "Sweden", cc: "SE", lat: 59.6519, lon: 17.9186 },
  { iata: "OSL", icao: "ENGM", name: "Oslo Gardermoen", city: "Oslo", country: "Norway", cc: "NO", lat: 60.1939, lon: 11.1004 },
  { iata: "HEL", icao: "EFHK", name: "Helsinki-Vantaa", city: "Helsinki", country: "Finland", cc: "FI", lat: 60.3172, lon: 24.9633 },
  { iata: "WAW", icao: "EPWA", name: "Warsaw Chopin", city: "Warsaw", country: "Poland", cc: "PL", lat: 52.1657, lon: 20.9671 },
  { iata: "PRG", icao: "LKPR", name: "Václav Havel", city: "Prague", country: "Czechia", cc: "CZ", lat: 50.1008, lon: 14.26 },
  { iata: "ATH", icao: "LGAV", name: "Athens Intl", city: "Athens", country: "Greece", cc: "GR", lat: 37.9364, lon: 23.9445 },
  { iata: "IST", icao: "LTFM", name: "Istanbul", city: "Istanbul", country: "Turkey", cc: "TR", lat: 41.2753, lon: 28.7519 },
  { iata: "SVO", icao: "UUEE", name: "Sheremetyevo", city: "Moscow", country: "Russia", cc: "RU", lat: 55.9726, lon: 37.4146 },
  { iata: "KEF", icao: "BIKF", name: "Keflavík Intl", city: "Reykjavík", country: "Iceland", cc: "IS", lat: 63.985, lon: -22.6056 },
  // Middle East & Africa
  { iata: "DXB", icao: "OMDB", name: "Dubai Intl", city: "Dubai", country: "United Arab Emirates", cc: "AE", lat: 25.2532, lon: 55.3657 },
  { iata: "AUH", icao: "OMAA", name: "Abu Dhabi Intl", city: "Abu Dhabi", country: "United Arab Emirates", cc: "AE", lat: 24.433, lon: 54.6511 },
  { iata: "DOH", icao: "OTHH", name: "Hamad Intl", city: "Doha", country: "Qatar", cc: "QA", lat: 25.2731, lon: 51.6081 },
  { iata: "RUH", icao: "OERK", name: "King Khalid Intl", city: "Riyadh", country: "Saudi Arabia", cc: "SA", lat: 24.9576, lon: 46.6988 },
  { iata: "JED", icao: "OEJN", name: "King Abdulaziz Intl", city: "Jeddah", country: "Saudi Arabia", cc: "SA", lat: 21.6796, lon: 39.1565 },
  { iata: "KWI", icao: "OKBK", name: "Kuwait Intl", city: "Kuwait City", country: "Kuwait", cc: "KW", lat: 29.2266, lon: 47.9689 },
  { iata: "BAH", icao: "OBBI", name: "Bahrain Intl", city: "Manama", country: "Bahrain", cc: "BH", lat: 26.2708, lon: 50.6336 },
  { iata: "TLV", icao: "LLBG", name: "Ben Gurion", city: "Tel Aviv", country: "Israel", cc: "IL", lat: 32.0114, lon: 34.8867 },
  { iata: "CAI", icao: "HECA", name: "Cairo Intl", city: "Cairo", country: "Egypt", cc: "EG", lat: 30.1219, lon: 31.4056 },
  { iata: "JNB", icao: "FAOR", name: "O. R. Tambo Intl", city: "Johannesburg", country: "South Africa", cc: "ZA", lat: -26.1392, lon: 28.246 },
  { iata: "CPT", icao: "FACT", name: "Cape Town Intl", city: "Cape Town", country: "South Africa", cc: "ZA", lat: -33.9715, lon: 18.6021 },
  { iata: "NBO", icao: "HKJK", name: "Jomo Kenyatta Intl", city: "Nairobi", country: "Kenya", cc: "KE", lat: -1.3192, lon: 36.9278 },
  { iata: "ADD", icao: "HAAB", name: "Bole Intl", city: "Addis Ababa", country: "Ethiopia", cc: "ET", lat: 8.9779, lon: 38.7993 },
  { iata: "LOS", icao: "DNMM", name: "Murtala Muhammed Intl", city: "Lagos", country: "Nigeria", cc: "NG", lat: 6.5774, lon: 3.3212 },
  { iata: "CMN", icao: "GMMN", name: "Mohammed V Intl", city: "Casablanca", country: "Morocco", cc: "MA", lat: 33.3675, lon: -7.5897 },
  // Asia
  { iata: "HND", icao: "RJTT", name: "Tokyo Haneda", city: "Tokyo", country: "Japan", cc: "JP", lat: 35.5494, lon: 139.7798 },
  { iata: "NRT", icao: "RJAA", name: "Tokyo Narita", city: "Tokyo", country: "Japan", cc: "JP", lat: 35.772, lon: 140.3929 },
  { iata: "KIX", icao: "RJBB", name: "Kansai Intl", city: "Osaka", country: "Japan", cc: "JP", lat: 34.4273, lon: 135.2442 },
  { iata: "ICN", icao: "RKSI", name: "Incheon Intl", city: "Seoul", country: "South Korea", cc: "KR", lat: 37.4602, lon: 126.4407 },
  { iata: "PEK", icao: "ZBAA", name: "Beijing Capital Intl", city: "Beijing", country: "China", cc: "CN", lat: 40.0801, lon: 116.5846 },
  { iata: "PKX", icao: "ZBAD", name: "Beijing Daxing Intl", city: "Beijing", country: "China", cc: "CN", lat: 39.509, lon: 116.4108 },
  { iata: "PVG", icao: "ZSPD", name: "Shanghai Pudong Intl", city: "Shanghai", country: "China", cc: "CN", lat: 31.1443, lon: 121.8083 },
  { iata: "CAN", icao: "ZGGG", name: "Guangzhou Baiyun Intl", city: "Guangzhou", country: "China", cc: "CN", lat: 23.3924, lon: 113.2988 },
  { iata: "HKG", icao: "VHHH", name: "Hong Kong Intl", city: "Hong Kong", country: "Hong Kong", cc: "HK", lat: 22.308, lon: 113.9185 },
  { iata: "TPE", icao: "RCTP", name: "Taoyuan Intl", city: "Taipei", country: "Taiwan", cc: "TW", lat: 25.0777, lon: 121.2328 },
  { iata: "SIN", icao: "WSSS", name: "Changi", city: "Singapore", country: "Singapore", cc: "SG", lat: 1.3644, lon: 103.9915 },
  { iata: "KUL", icao: "WMKK", name: "Kuala Lumpur Intl", city: "Kuala Lumpur", country: "Malaysia", cc: "MY", lat: 2.7456, lon: 101.7099 },
  { iata: "BKK", icao: "VTBS", name: "Suvarnabhumi", city: "Bangkok", country: "Thailand", cc: "TH", lat: 13.69, lon: 100.7501 },
  { iata: "CGK", icao: "WIII", name: "Soekarno–Hatta Intl", city: "Jakarta", country: "Indonesia", cc: "ID", lat: -6.1256, lon: 106.6559 },
  { iata: "DPS", icao: "WADD", name: "Ngurah Rai Intl", city: "Denpasar", country: "Indonesia", cc: "ID", lat: -8.7482, lon: 115.1672 },
  { iata: "MNL", icao: "RPLL", name: "Ninoy Aquino Intl", city: "Manila", country: "Philippines", cc: "PH", lat: 14.5086, lon: 121.0197 },
  { iata: "DEL", icao: "VIDP", name: "Indira Gandhi Intl", city: "Delhi", country: "India", cc: "IN", lat: 28.5562, lon: 77.1 },
  { iata: "BOM", icao: "VABB", name: "Chhatrapati Shivaji Intl", city: "Mumbai", country: "India", cc: "IN", lat: 19.0887, lon: 72.8679 },
  { iata: "BLR", icao: "VOBL", name: "Kempegowda Intl", city: "Bengaluru", country: "India", cc: "IN", lat: 13.1986, lon: 77.7066 },
  { iata: "MLE", icao: "VRMM", name: "Velana Intl", city: "Malé", country: "Maldives", cc: "MV", lat: 4.1918, lon: 73.5291 },
  { iata: "CMB", icao: "VCBI", name: "Bandaranaike Intl", city: "Colombo", country: "Sri Lanka", cc: "LK", lat: 7.1808, lon: 79.8841 },
  { iata: "KHI", icao: "OPKC", name: "Jinnah Intl", city: "Karachi", country: "Pakistan", cc: "PK", lat: 24.9065, lon: 67.1608 },
  // Oceania
  { iata: "SYD", icao: "YSSY", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", cc: "AU", lat: -33.9461, lon: 151.1772 },
  { iata: "MEL", icao: "YMML", name: "Melbourne Tullamarine", city: "Melbourne", country: "Australia", cc: "AU", lat: -37.6733, lon: 144.8433 },
  { iata: "BNE", icao: "YBBN", name: "Brisbane", city: "Brisbane", country: "Australia", cc: "AU", lat: -27.3842, lon: 153.1175 },
  { iata: "PER", icao: "YPPH", name: "Perth", city: "Perth", country: "Australia", cc: "AU", lat: -31.9385, lon: 115.9672 },
  { iata: "AKL", icao: "NZAA", name: "Auckland", city: "Auckland", country: "New Zealand", cc: "NZ", lat: -37.0082, lon: 174.785 },
  { iata: "NAN", icao: "NFFN", name: "Nadi Intl", city: "Nadi", country: "Fiji", cc: "FJ", lat: -17.7554, lon: 177.4434 },
  { iata: "GUM", icao: "PGUM", name: "Antonio B. Won Pat Intl", city: "Hagåtña", country: "Guam", cc: "GU", lat: 13.4834, lon: 144.7959 },
];

const byIata = new Map(AIRPORTS.map((a) => [a.iata, a]));
const byIcao = new Map(AIRPORTS.map((a) => [a.icao, a]));

/** Look up an airport by IATA or ICAO code (case-insensitive). */
export function findAirport(code: string): Airport | undefined {
  const c = code.trim().toUpperCase();
  return byIata.get(c) || byIcao.get(c);
}

/** Fuzzy search by code, city, name, or country for the autocomplete. */
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { a: Airport; score: number }[] = [];
  for (const a of AIRPORTS) {
    const iata = a.iata.toLowerCase();
    const icao = a.icao.toLowerCase();
    let score = -1;
    if (iata === q || icao === q) score = 100;
    else if (iata.startsWith(q) || icao.startsWith(q)) score = 80;
    else if (a.city.toLowerCase().startsWith(q)) score = 60;
    else if (a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)) score = 40;
    else if (a.country.toLowerCase().includes(q)) score = 20;
    if (score > 0) scored.push({ a, score });
  }
  return scored
    .sort((x, y) => y.score - x.score || x.a.city.localeCompare(y.a.city))
    .slice(0, limit)
    .map((s) => s.a);
}
