// Centrale definitie van de dienst-types die een driver zelf registreert.
// Eén bron voor de volgorde, de Nederlandse labels en de korte weekstrip-namen,
// zodat het dashboard en het uren-scherm niet uit elkaar lopen.

export const DRIVER_SHIFT_TYPES = [
  "DHL_OCHTEND",
  "DHL_OCHTEND_MIDDAG",
  "DHL_AVOND",
  "DRAGONFLY_MIDDAG",
] as const;

export type DriverShiftType = (typeof DRIVER_SHIFT_TYPES)[number];

// Volledige labels voor de dienst-keuze en chips.
export const SHIFT_TYPE_LABEL: Record<DriverShiftType, string> = {
  DHL_OCHTEND: "DHL ochtend",
  DHL_OCHTEND_MIDDAG: "DHL ochtend/middag",
  DHL_AVOND: "DHL avond",
  DRAGONFLY_MIDDAG: "Dragonfly middag",
};

// Korte namen voor de weekstrip-labels.
export const SHIFT_TYPE_SHORT: Record<DriverShiftType, string> = {
  DHL_OCHTEND: "DHL och",
  DHL_OCHTEND_MIDDAG: "DHL o/m",
  DHL_AVOND: "DHL avond",
  DRAGONFLY_MIDDAG: "DF",
};

// Alle DHL-varianten gedragen zich gelijk (pakketten/stops, geen uren).
// Alleen Dragonfly werkt met start/eindtijd en uren.
export function isDHLType(type: DriverShiftType): boolean {
  return type !== "DRAGONFLY_MIDDAG";
}
