// Infinite Flight fleet — used for the aircraft dropdown and "aircraft flown" stats.
// Grouped loosely by manufacturer for the picker.

export interface AircraftType {
  name: string;
  manufacturer: string;
}

export const AIRCRAFT: AircraftType[] = [
  // Airbus
  { name: "Airbus A318", manufacturer: "Airbus" },
  { name: "Airbus A319", manufacturer: "Airbus" },
  { name: "Airbus A320", manufacturer: "Airbus" },
  { name: "Airbus A321", manufacturer: "Airbus" },
  { name: "Airbus A330-300", manufacturer: "Airbus" },
  { name: "Airbus A330-900neo", manufacturer: "Airbus" },
  { name: "Airbus A350-900", manufacturer: "Airbus" },
  { name: "Airbus A380-800", manufacturer: "Airbus" },
  // Boeing
  { name: "Boeing 717-200", manufacturer: "Boeing" },
  { name: "Boeing 737-700", manufacturer: "Boeing" },
  { name: "Boeing 737-800", manufacturer: "Boeing" },
  { name: "Boeing 737-900", manufacturer: "Boeing" },
  { name: "Boeing 737 MAX 8", manufacturer: "Boeing" },
  { name: "Boeing 747-200", manufacturer: "Boeing" },
  { name: "Boeing 747-400", manufacturer: "Boeing" },
  { name: "Boeing 747-8", manufacturer: "Boeing" },
  { name: "Boeing 757-200", manufacturer: "Boeing" },
  { name: "Boeing 767-300", manufacturer: "Boeing" },
  { name: "Boeing 777-200ER", manufacturer: "Boeing" },
  { name: "Boeing 777-200LR", manufacturer: "Boeing" },
  { name: "Boeing 777-300ER", manufacturer: "Boeing" },
  { name: "Boeing 777F", manufacturer: "Boeing" },
  { name: "Boeing 787-8", manufacturer: "Boeing" },
  { name: "Boeing 787-9", manufacturer: "Boeing" },
  { name: "Boeing 787-10", manufacturer: "Boeing" },
  // Embraer
  { name: "Embraer E175", manufacturer: "Embraer" },
  { name: "Embraer E190", manufacturer: "Embraer" },
  // Bombardier / regional
  { name: "Bombardier CRJ-200", manufacturer: "Bombardier" },
  { name: "Bombardier CRJ-700", manufacturer: "Bombardier" },
  { name: "Bombardier CRJ-900", manufacturer: "Bombardier" },
  { name: "Bombardier Dash 8 Q400", manufacturer: "Bombardier" },
  // General aviation & military
  { name: "Cessna 172", manufacturer: "Cessna" },
  { name: "Cessna 208 Caravan", manufacturer: "Cessna" },
  { name: "Cessna Citation X", manufacturer: "Cessna" },
  { name: "Boeing C-130 Hercules", manufacturer: "Lockheed" },
  { name: "Spitfire", manufacturer: "Supermarine" },
];

export const AIRCRAFT_NAMES = AIRCRAFT.map((a) => a.name);
