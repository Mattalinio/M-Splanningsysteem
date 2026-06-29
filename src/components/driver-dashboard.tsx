"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Package, MapPin } from "lucide-react";
import {
  dayAbbrev,
  decimalHours,
  formatDayLong,
  formatHours,
  formatRangeLabel,
  getISOWeek,
  getWeekDays,
  getWeekRange,
  isoDateKey,
  nextWeek,
  prevWeek,
  weekParam,
  type IsoWeek,
} from "@/lib/hours";
import {
  SHIFT_TYPE_LABEL,
  SHIFT_TYPE_SHORT,
  isDHLType,
  type DriverShiftType as ShiftType,
} from "@/lib/driver-shift-types";

type Shift = {
  id: string;
  date: string;
  type: ShiftType;
  startTime: string | null;
  endTime: string | null;
  packages: number | null;
  stops: number | null;
};

function localTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shiftHours(s: Shift): number {
  if (s.type !== "DRAGONFLY_MIDDAG" || !s.startTime || !s.endTime) return 0;
  return decimalHours(s.startTime, s.endTime) ?? 0;
}

export function DriverDashboard({ initialWeek }: { initialWeek: IsoWeek }) {
  const [current, setCurrent] = useState<IsoWeek>(initialWeek);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => getWeekRange(current.year, current.week), [current]);
  const weekDays = useMemo(() => getWeekDays(current.year, current.week), [current]);
  const todayKey = useMemo(() => localTodayKey(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/shifts?week=${weekParam(current)}`);
    setShifts(res.ok ? await res.json() : []);
    setLoading(false);
  }, [current]);

  useEffect(() => {
    load();
  }, [load]);

  // Diensten per dag (key = UTC datum).
  const byDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const key = isoDateKey(new Date(s.date));
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [shifts]);

  const dragonfly = useMemo(
    () =>
      shifts
        .filter((s) => s.type === "DRAGONFLY_MIDDAG")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [shifts],
  );
  const dhl = useMemo(
    () =>
      shifts
        .filter((s) => isDHLType(s.type))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [shifts],
  );

  const totalDragonflyHours = useMemo(() => dragonfly.reduce((s, x) => s + shiftHours(x), 0), [dragonfly]);
  const totalPackages = useMemo(() => dhl.reduce((s, x) => s + (x.packages ?? 0), 0), [dhl]);
  const totalStops = useMemo(() => dhl.reduce((s, x) => s + (x.stops ?? 0), 0), [dhl]);

  // Eerstvolgende dag (vandaag of later in deze week) met diensten.
  const nextDay = useMemo(() => {
    for (const day of weekDays) {
      const key = isoDateKey(day);
      if (key >= todayKey && byDay.has(key)) {
        return { day, key, shifts: byDay.get(key)! };
      }
    }
    return null;
  }, [weekDays, byDay, todayKey]);

  const hasShifts = shifts.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Overzichtskaarten */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<Clock className="h-4 w-4" />} label="Dragonfly uren" value={formatHours(totalDragonflyHours)} suffix="uur" accent="blue" />
        <StatCard icon={<Package className="h-4 w-4" />} label="DHL pakketten" value={`${totalPackages}`} accent="amber" />
        <StatCard icon={<MapPin className="h-4 w-4" />} label="DHL stops" value={`${totalStops}`} accent="amber" />
        <div className="glass p-4 sm:p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Volgende dienst</div>
          {nextDay ? (
            <div className="mt-2">
              <div className="text-xl font-semibold capitalize sm:text-2xl">
                {nextDay.key === todayKey ? "vandaag" : formatDayLong(nextDay.day)}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {nextDay.shifts.map((s) => (
                  <TypeChip key={s.id} type={s.type} hours={shiftHours(s)} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-2xl font-semibold sm:text-3xl">Geen</div>
          )}
        </div>
      </div>

      {/* Weeksectie */}
      <section className="glass space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Week {current.week}</h2>
            <p className="text-sm text-muted-foreground">{formatRangeLabel(range.start, range.end)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="pressable glass flex items-center gap-1 px-3 py-1.5 text-sm" onClick={() => setCurrent(prevWeek(current))} type="button">
              <ChevronLeft className="h-4 w-4" />
              Vorige
            </button>
            <button className="pressable glass px-3 py-1.5 text-sm" onClick={() => setCurrent(getISOWeek(new Date()))} type="button">
              Vandaag
            </button>
            <button className="pressable glass flex items-center gap-1 px-3 py-1.5 text-sm" onClick={() => setCurrent(nextWeek(current))} type="button">
              Volgende
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Weekstrip */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const key = isoDateKey(day);
            const dayShifts = [...(byDay.get(key) ?? [])].sort((a, b) => a.type.localeCompare(b.type));
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`flex min-h-[68px] flex-col items-center gap-1 rounded-xl border px-0.5 py-2 text-center sm:min-h-[92px] sm:gap-1.5 sm:rounded-2xl sm:px-1 ${
                  isToday ? "border-sky-400 ring-1 ring-sky-400" : "border-border/60"
                }`}
              >
                <span className="text-[11px] text-muted-foreground sm:text-xs">{dayAbbrev(day)}</span>
                <span className="text-base font-semibold tabular-nums">{day.getUTCDate()}</span>
                {dayShifts.length === 0 ? (
                  <span className="mt-0.5 text-sm text-muted-foreground">—</span>
                ) : (
                  <>
                    {/* mobiel: compacte gekleurde stippen */}
                    <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1 sm:hidden">
                      {dayShifts.map((s) => (
                        <span
                          key={s.id}
                          className={`h-2 w-2 rounded-full ${
                            isDHLType(s.type) ? "bg-amber-400" : "bg-blue-500"
                          }`}
                        />
                      ))}
                    </div>
                    {/* desktop: labels met uren */}
                    <div className="hidden w-full flex-col items-stretch gap-1 sm:flex">
                      {dayShifts.map((s) => (
                        <span
                          key={s.id}
                          className={`truncate rounded-md px-1 py-0.5 text-[10px] font-medium ${
                            isDHLType(s.type) ? "bg-amber-400 text-black" : "bg-blue-500 text-white"
                          }`}
                        >
                          {isDHLType(s.type)
                            ? SHIFT_TYPE_SHORT[s.type]
                            : shiftHours(s) > 0
                              ? `${formatHours(shiftHours(s))}u`
                              : "DF"}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {loading ? (
          <p className="rounded-xl border border-border/60 p-6 text-center text-sm text-muted-foreground">Laden…</p>
        ) : !hasShifts ? (
          <p className="rounded-xl border border-border/60 p-6 text-center text-sm text-muted-foreground">
            Nog geen diensten deze week.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Dragonfly-lijst */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Dragonfly · uren
              </h3>
              {dragonfly.length === 0 ? (
                <p className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">Geen Dragonfly-diensten.</p>
              ) : (
                <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                  {dragonfly.map((s) => {
                    const hours = shiftHours(s);
                    return (
                      <li className="flex items-center gap-3 px-4 py-2.5 text-sm" key={s.id}>
                        <span className="w-20 shrink-0 font-medium">{formatDayLong(new Date(s.date))}</span>
                        <span className="text-muted-foreground">
                          {s.startTime && s.endTime ? `${s.startTime} – ${s.endTime}` : "nog in te vullen"}
                        </span>
                        <span className="ml-auto font-semibold tabular-nums">
                          {s.startTime && s.endTime ? `${formatHours(hours)} uur` : "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="flex items-center justify-between px-1 text-sm font-semibold">
                <span>Totaal Dragonfly</span>
                <span className="tabular-nums">{formatHours(totalDragonflyHours)} uur</span>
              </div>
            </div>

            {/* DHL-lijst */}
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                DHL · pakketten &amp; stops
              </h3>
              {dhl.length === 0 ? (
                <p className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">Geen DHL-diensten.</p>
              ) : (
                <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                  {dhl.map((s) => (
                    <li className="flex items-center gap-3 px-4 py-2.5 text-sm" key={s.id}>
                      <span className="w-20 shrink-0 font-medium">{formatDayLong(new Date(s.date))}</span>
                      <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                        {SHIFT_TYPE_LABEL[s.type]}
                      </span>
                      <span className="ml-auto tabular-nums text-muted-foreground">
                        {s.packages !== null || s.stops !== null
                          ? `${s.packages ?? 0} pakketten · ${s.stops ?? 0} stops`
                          : "nog in te vullen"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between px-1 text-sm font-semibold">
                <span>Totaal DHL</span>
                <span className="tabular-nums">
                  {totalPackages} pakketten · {totalStops} stops
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function TypeChip({ type, hours }: { type: ShiftType; hours: number }) {
  if (isDHLType(type)) {
    return (
      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-medium text-black">
        {SHIFT_TYPE_LABEL[type]}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
      Dragonfly{hours > 0 ? ` · ${formatHours(hours)}u` : ""}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  accent: "blue" | "amber";
}) {
  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:gap-2 sm:text-xs">
        <span className={accent === "blue" ? "text-blue-500" : "text-amber-500"}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</span>
        {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
    </div>
  );
}
