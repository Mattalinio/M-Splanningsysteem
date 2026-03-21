"use client";

import { useMemo, useState } from "react";
import { addBulkAvailabilityAction } from "@/app/actions";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthCells(base: Date): Array<string | null> {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();

  const dayOffset = (firstDay.getDay() + 6) % 7;
  const cells: Array<string | null> = [];

  for (let i = 0; i < dayOffset; i += 1) cells.push(null);
  for (let d = 1; d <= totalDays; d += 1) cells.push(toIso(new Date(year, month, d)));

  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i += 1) cells.push(null);
  }

  return cells;
}

export function BulkAvailabilityCalendar() {
  const now = new Date();
  const [monthCursor, setMonthCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);

  const months = useMemo(() => {
    const second = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1);
    return [monthCursor, second];
  }, [monthCursor]);

  function toggleDate(date: string) {
    setSelectedDates((current) =>
      current.includes(date) ? current.filter((d) => d !== date) : [...current, date],
    );
  }

  return (
    <form action={addBulkAvailabilityAction} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Select multiple dates</p>
        <div className="flex gap-2">
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
            type="button"
          >
            Prev
          </button>
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {months.map((monthBase) => {
          const cells = buildMonthCells(monthBase);
          const monthLabel = monthBase.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });

          return (
            <div className="rounded-xl border p-2" key={monthLabel}>
              <p className="mb-2 text-sm font-semibold">{monthLabel}</p>
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
                {WEEKDAYS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {cells.map((cell, index) => {
                  if (!cell) {
                    return <span key={`${monthLabel}-empty-${index}`} />;
                  }
                  const selected = selectedDates.includes(cell);
                  return (
                    <button
                      className={`rounded border px-2 py-1 ${selected ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white/60 dark:bg-slate-900/50"}`}
                      key={cell}
                      onClick={() => toggleDate(cell)}
                      type="button"
                    >
                      {new Date(cell).getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDates.map((date) => (
        <input key={date} name="selectedDates" type="hidden" value={date} />
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Start hour
          <select
            className="ml-2 rounded border px-2 py-1"
            name="startHour"
            value={startHour}
            onChange={(event) => setStartHour(Number(event.target.value))}
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {pad(hour)}:00
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          End hour
          <select
            className="ml-2 rounded border px-2 py-1"
            name="endHour"
            value={endHour}
            onChange={(event) => setEndHour(Number(event.target.value))}
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {pad(hour)}:00
              </option>
            ))}
          </select>
        </label>

        <button className="pressable rounded bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black" type="submit">
          Save selected dates
        </button>
      </div>
    </form>
  );
}
