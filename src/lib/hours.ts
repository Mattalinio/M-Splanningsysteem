// Helpers voor uren-registratie: ISO-week berekening, duurberekening en
// nette komma-notatie. Gedeeld tussen API-routes en de driver-schermen.

export type IsoWeek = { year: number; week: number };

/** ISO-8601 weeknummer + bijbehorend jaar voor een datum. */
export function getISOWeek(date: Date): IsoWeek {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Donderdag bepaalt het ISO-jaar.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** Maandag 00:00 t/m zondag 23:59:59.999 (UTC) van een ISO-week. */
export function getWeekRange(year: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

/** Hoogste weeknummer (52 of 53) van een ISO-jaar. */
function maxWeekOfYear(year: number): number {
  return getISOWeek(new Date(Date.UTC(year, 11, 28))).week;
}

export function prevWeek({ year, week }: IsoWeek): IsoWeek {
  if (week <= 1) {
    const prevY = year - 1;
    return { year: prevY, week: maxWeekOfYear(prevY) };
  }
  return { year, week: week - 1 };
}

export function nextWeek({ year, week }: IsoWeek): IsoWeek {
  if (week >= maxWeekOfYear(year)) return { year: year + 1, week: 1 };
  return { year, week: week + 1 };
}

/** "2026-19" — query-param formaat (jaar-week, week 2-cijferig). */
export function weekParam({ year, week }: IsoWeek): string {
  return `${year}-${String(week).padStart(2, "0")}`;
}

/** Parse "2026-19" terug naar { year, week }. Valt terug op huidige week bij onzin. */
export function parseWeekParam(value: string | null | undefined): IsoWeek {
  if (value) {
    const [y, w] = value.split("-").map(Number);
    if (Number.isInteger(y) && Number.isInteger(w) && w >= 1 && w <= 53) {
      return { year: y, week: w };
    }
  }
  return getISOWeek(new Date());
}

/**
 * Decimale uren tussen "HH:mm"-start en -eind. GEEN pauze eraf.
 * Eindtijd < starttijd => nachtdienst => +24 uur. Geeft null bij ongeldige input.
 */
export function decimalHours(startTime: string, endTime: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/;
  const s = m.exec(startTime);
  const e = m.exec(endTime);
  if (!s || !e) return null;

  const startMin = Number(s[1]) * 60 + Number(s[2]);
  let endMin = Number(e[1]) * 60 + Number(e[2]);
  if (
    Number(s[1]) > 23 || Number(s[2]) > 59 ||
    Number(e[1]) > 23 || Number(e[2]) > 59
  ) {
    return null;
  }

  if (endMin <= startMin) endMin += 24 * 60; // nachtdienst
  return (endMin - startMin) / 60;
}

/**
 * Decimale uren met KOMMA en zonder onnodige nullen.
 * 6 -> "6", 4,5 -> "4,5", 8,25 -> "8,25".
 */
export function formatHours(hours: number): string {
  // Afronden op 2 decimalen, trailing nullen weg, punt -> komma.
  const rounded = Math.round(hours * 100) / 100;
  return rounded.toString().replace(".", ",");
}

const MAANDEN_NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const DAGEN_NL = ["ma", "di", "wo", "do", "vr", "za", "zo"];

/** De 7 UTC-datums (maandag t/m zondag) van een ISO-week. */
export function getWeekDays(year: number, week: number): Date[] {
  const { start } = getWeekRange(year, week);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d;
  });
}

/** Dag-afkorting ma/di/wo/… op basis van de UTC-dag. */
export function dayAbbrev(date: Date): string {
  // getUTCDay: 0 = zondag … 6 = zaterdag -> herindexeren naar ma=0.
  return DAGEN_NL[(date.getUTCDay() + 6) % 7];
}

/** "ma 15 jun" — dag-afkorting + datumnummer + maand. */
export function formatDayLong(date: Date): string {
  return `${dayAbbrev(date)} ${date.getUTCDate()} ${MAANDEN_NL[date.getUTCMonth()]}`;
}

/** Stabiele YYYY-MM-DD sleutel (UTC) om datums te vergelijken. */
export function isoDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "dd-mm" op basis van de UTC-datum (zoals opgeslagen). */
export function formatDayMonth(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${d}-${m}`;
}

/** "1 jun – 7 jun" datumbereik label voor de week-navigatie. */
export function formatRangeLabel(start: Date, end: Date): string {
  const s = `${start.getUTCDate()} ${MAANDEN_NL[start.getUTCMonth()]}`;
  const e = `${end.getUTCDate()} ${MAANDEN_NL[end.getUTCMonth()]}`;
  return `${s} – ${e}`;
}

export type ExportEntry = { date: Date | string; startTime: string; endTime: string };

/**
 * Bouwt de kopieerbare platte-tekst uitdraai voor een week. Voorbeeld:
 *   Week 19
 *   04-05 (wk19) 13:45 - 19:45 (6)
 *   Totaal week 19: 31 uur
 */
export function buildWeekExport(week: number, entries: ExportEntry[]): string {
  const lines: string[] = [`Week ${week}`];
  let total = 0;

  for (const entry of entries) {
    const date = typeof entry.date === "string" ? new Date(entry.date) : entry.date;
    const hours = decimalHours(entry.startTime, entry.endTime) ?? 0;
    total += hours;
    lines.push(
      `${formatDayMonth(date)} (wk${week}) ${entry.startTime} - ${entry.endTime} (${formatHours(hours)})`,
    );
  }

  lines.push(`Totaal week ${week}: ${formatHours(total)} uur`);
  return lines.join("\n");
}
