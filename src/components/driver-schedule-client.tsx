"use client";

import { useMemo, useState } from "react";
import { ShiftStatus, WhereNeeded } from "@prisma/client";
import { ShiftBlock } from "@/components/shift-block";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { addDays, dayLabel, getWeekDates, hourLabel, todayIsoDate } from "@/lib/planning";

type ShiftViewItem = {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  whereNeeded: WhereNeeded;
  status: ShiftStatus;
  blockType: string;
};

export function DriverScheduleClient({
  initialWeek,
  items,
}: {
  initialWeek: string;
  items: ShiftViewItem[];
}) {
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [view, setView] = useState<"week" | "month">("week");
  const [selected, setSelected] = useState<ShiftViewItem | null>(null);

  const today = todayIsoDate();

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => `${a.date}-${a.startHour}`.localeCompare(`${b.date}-${b.startHour}`)),
    [items],
  );

  const nowHour = new Date().getHours();
  const nextShift = sortedItems.find((item) => item.date > today || (item.date === today && item.endHour > nowHour)) ?? null;
  const todaysShift = sortedItems.find((item) => item.date === today) ?? null;

  const weekStarts = view === "month" ? [0, 7, 14, 21].map((offset) => addDays(weekStart, offset)) : [weekStart];
  const weeks = weekStarts.map((start) => ({ start, dates: getWeekDates(start) }));

  const visibleFrom = weeks[0].dates[0];
  const visibleTo = weeks[weeks.length - 1].dates[6];
  const visibleItems = sortedItems.filter((item) => item.date >= visibleFrom && item.date <= visibleTo);

  const currentWeekDates = getWeekDates(weekStart);
  const thisWeekItems = sortedItems.filter((item) => item.date >= currentWeekDates[0] && item.date <= currentWeekDates[6]);
  const totalHours = thisWeekItems.reduce((sum, item) => sum + (item.endHour - item.startHour), 0);

  return (
    <section className="space-y-4">
      {todaysShift ? (
        <div className="glass animate-in fade-in flex items-center justify-between gap-2 p-3 duration-200">
          <p className="text-sm font-semibold">
            Today: {todaysShift.blockType} {hourLabel(todaysShift.startHour)}-{hourLabel(todaysShift.endHour)}
          </p>
          <button className="pressable rounded border px-2 py-1 text-xs" onClick={() => setSelected(todaysShift)} type="button">
            View
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            className={`pressable glass px-3 py-1 text-sm ${view === "week" ? "font-semibold" : ""}`}
            onClick={() => setView("week")}
            type="button"
          >
            Weekly
          </button>
          <button
            className={`pressable glass px-3 py-1 text-sm ${view === "month" ? "font-semibold" : ""}`}
            onClick={() => setView("month")}
            type="button"
          >
            Monthly
          </button>
        </div>
        <div className="flex gap-2">
          <button className="pressable glass px-3 py-1 text-sm" onClick={() => setWeekStart(addDays(weekStart, -7))} type="button">
            Prev
          </button>
          <button className="pressable glass px-3 py-1 text-sm" onClick={() => setWeekStart(getWeekDates(today)[0])} type="button">
            Today
          </button>
          <button className="pressable glass px-3 py-1 text-sm" onClick={() => setWeekStart(addDays(weekStart, 7))} type="button">
            Next
          </button>
        </div>
      </div>

      {view === "week" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="grid animate-in gap-3 fade-in duration-200 md:grid-cols-2 xl:grid-cols-7">
            {weeks[0].dates.map((date) => {
              const dayItems = visibleItems.filter((item) => item.date === date).sort((a, b) => a.startHour - b.startHour);

              return (
                <section className={`glass p-3 ${date === today ? "today-highlight" : ""}`} key={date}>
                  <h3 className="mb-2 border-b border-border pb-2 text-sm font-semibold">{dayLabel(date)}</h3>
                  <div className="space-y-2">
                    {dayItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No shifts</p>
                    ) : (
                      dayItems.map((item) => (
                        <button className="block w-full text-left" key={item.id} onClick={() => setSelected(item)} type="button">
                          <ShiftBlock
                            status={item.status}
                            subtitle={item.blockType}
                            timeRange={`${hourLabel(item.startHour)}-${hourLabel(item.endHour)}`}
                            whereNeeded={item.whereNeeded}
                          />
                        </button>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="glass space-y-3 p-4">
            <h2 className="text-lg font-semibold">This Week Summary</h2>
            <div className="space-y-2 text-sm">
              <p>Total shifts: {thisWeekItems.length}</p>
              <p>Total hours: {totalHours}</p>
            </div>

            {nextShift ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Next upcoming shift</p>
                <button className="block w-full text-left" onClick={() => setSelected(nextShift)} type="button">
                  <ShiftBlock
                    status={nextShift.status}
                    subtitle={`${nextShift.date} · ${nextShift.blockType}`}
                    timeRange={`${hourLabel(nextShift.startHour)}-${hourLabel(nextShift.endHour)}`}
                    whereNeeded={nextShift.whereNeeded}
                  />
                </button>
                <button
                  className="pressable w-full rounded border px-3 py-1 text-sm"
                  onClick={() => {
                    setWeekStart(getWeekDates(nextShift.date)[0]);
                    setView("week");
                  }}
                  type="button"
                >
                  Go to next shift
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming shift.</p>
            )}
          </aside>
        </div>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-200">
          {weeks.map((week) => (
            <section className="glass space-y-2 p-3" key={week.start}>
              <h2 className="text-sm font-semibold text-muted-foreground">
                {week.dates[0]} to {week.dates[6]}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                {week.dates.map((date) => {
                  const dayItems = visibleItems.filter((item) => item.date === date).sort((a, b) => a.startHour - b.startHour);
                  return (
                    <div className={`glass p-2 ${date === today ? "today-highlight" : ""}`} key={date}>
                      <h3 className="mb-2 text-xs font-semibold">{dayLabel(date)}</h3>
                      <div className="space-y-2">
                        {dayItems.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">No shifts</p>
                        ) : (
                          dayItems.map((item) => (
                            <button className="block w-full text-left" key={item.id} onClick={() => setSelected(item)} type="button">
                              <ShiftBlock
                                status={item.status}
                                subtitle={item.blockType}
                                timeRange={`${hourLabel(item.startHour)}-${hourLabel(item.endHour)}`}
                                whereNeeded={item.whereNeeded}
                              />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {sortedItems.length === 0 ? <p className="glass p-4 text-sm text-muted-foreground">No shifts scheduled yet.</p> : null}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="max-h-[70vh]">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>Shift details</SheetTitle>
                <SheetDescription>{selected.date}</SheetDescription>
              </SheetHeader>
              <ShiftBlock
                status={selected.status}
                subtitle={selected.blockType}
                timeRange={`${hourLabel(selected.startHour)}-${hourLabel(selected.endHour)}`}
                whereNeeded={selected.whereNeeded}
              />
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
