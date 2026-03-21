import { ShiftBlockType, WhereNeeded } from "@prisma/client";

export const LOCATION_LABELS: Record<WhereNeeded, string> = {
  DHL: "DHL",
  DRAGONFLY: "Dragonfly",
};

export const SHIFT_BLOCKS: Record<
  ShiftBlockType,
  {
    label: string;
    whereNeeded: WhereNeeded;
    startHour: number;
    endHour: number;
  }
> = {
  DHL_OCHTEND: {
    label: "DHL Ochtend",
    whereNeeded: "DHL",
    startHour: 9,
    endHour: 12,
  },
  DHL_MIDDAG: {
    label: "DHL Middag",
    whereNeeded: "DHL",
    startHour: 12,
    endHour: 17,
  },
  DHL_AVOND: {
    label: "DHL Avond",
    whereNeeded: "DHL",
    startHour: 17,
    endHour: 22,
  },
  DHL_HELEDAG: {
    label: "DHL Hele dag",
    whereNeeded: "DHL",
    startHour: 9,
    endHour: 18,
  },
  DRAGONFLY: {
    label: "Dragonfly",
    whereNeeded: "DRAGONFLY",
    startHour: 12,
    endHour: 22,
  },
};

export const QUICK_BLOCKS: ShiftBlockType[] = [
  "DHL_OCHTEND",
  "DRAGONFLY",
  "DHL_HELEDAG",
  "DHL_AVOND",
];

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function rangeLabel(startHour: number, endHour: number): string {
  return `${hourLabel(startHour)}-${hourLabel(endHour)}`;
}

export function getWeekStart(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function getWeekDates(anchor?: string): string[] {
  const start = getWeekStart(anchor ? new Date(anchor) : new Date());
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return toIsoDate(d);
  });
}

export function addDays(date: string, amount: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return toIsoDate(d);
}

export function addMonths(date: string, amount: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return toIsoDate(d);
}

export function getMonthBounds(anchor?: string): { monthStart: string; monthEnd: string } {
  const base = anchor ? new Date(anchor) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { monthStart: toIsoDate(start), monthEnd: toIsoDate(end) };
}

export function getMonthGridDates(anchor?: string): {
  monthStart: string;
  monthEnd: string;
  gridStart: string;
  gridEnd: string;
  dates: string[];
} {
  const { monthStart, monthEnd } = getMonthBounds(anchor);
  const start = getWeekStart(new Date(monthStart));
  const monthEndDate = new Date(monthEnd);
  const gridEnd = new Date(getWeekStart(monthEndDate));
  gridEnd.setDate(gridEnd.getDate() + 6);

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= gridEnd) {
    dates.push(toIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    monthStart,
    monthEnd,
    gridStart: toIsoDate(start),
    gridEnd: toIsoDate(gridEnd),
    dates,
  };
}

export function dayLabel(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function dateLabel(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function monthLabel(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
