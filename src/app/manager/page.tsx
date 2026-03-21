import Link from "next/link";
import { ShiftStatus } from "@prisma/client";
import { createShiftsFromBlocksAction, deleteOpenShiftAction, unassignShiftAction } from "@/app/actions";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { ManagerAddShiftsSheet } from "@/components/manager-add-shifts-sheet";
import { ManagerAssignSheet } from "@/components/manager-assign-sheet";
import { ShiftBlock } from "@/components/shift-block";
import { requireRole } from "@/lib/guards";
import {
  QUICK_BLOCKS,
  SHIFT_BLOCKS,
  addDays,
  addMonths,
  dateLabel,
  dayLabel,
  getMonthBounds,
  getMonthGridDates,
  getWeekDates,
  hourLabel,
  monthLabel,
  todayIsoDate,
} from "@/lib/planning";
import { prisma } from "@/lib/prisma";
import { containsRange, rangesOverlap } from "@/lib/time";

type SearchParams = {
  view?: "week" | "month";
  week?: string;
  month?: string;
  date?: string;
  toast?: string;
};

type GroupedShift = {
  date: string;
  shifts: Array<{
    id: string;
    date: string;
    startHour: number;
    endHour: number;
    blockType: string;
    whereNeeded: "DHL" | "DRAGONFLY";
    status: ShiftStatus;
  }>;
};

function byDate<T extends { date: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    acc[item.date] = acc[item.date] ? [...acc[item.date], item] : [item];
    return acc;
  }, {});
}

function buildPath(params: SearchParams, overrides: Partial<SearchParams>) {
  const next = new URLSearchParams();
  const view = overrides.view ?? params.view ?? "week";
  next.set("view", view);

  const week = overrides.week ?? params.week;
  const month = overrides.month ?? params.month;
  const date = overrides.date ?? params.date;

  if (week) next.set("week", week);
  if (month) next.set("month", month);
  if (date) next.set("date", date);

  return `/manager?${next.toString()}`;
}

export default async function ManagerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole("MANAGER");
  const params = await searchParams;

  const view: "week" | "month" = params.view === "month" ? "month" : "week";
  const today = todayIsoDate();

  const weekDates = getWeekDates(params.week);
  const monthGrid = getMonthGridDates(params.month);
  const monthBounds = getMonthBounds(params.month);

  const focusDate = params.date ?? (view === "week" ? weekDates[0] : monthBounds.monthStart);

  const visibleRange =
    view === "week"
      ? { start: weekDates[0], end: weekDates[6] }
      : { start: monthBounds.monthStart, end: monthBounds.monthEnd };

  const [drivers, openShifts, assignedInWeek, shiftsInMonth] = await Promise.all([
    prisma.user.findMany({ where: { role: "DRIVER", active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.shift.findMany({
      where: { status: "OPEN", date: { gte: visibleRange.start, lte: visibleRange.end } },
      orderBy: [{ date: "asc" }, { startHour: "asc" }],
    }),
    prisma.assignment.findMany({
      where: { shift: { date: { gte: weekDates[0], lte: weekDates[6] } } },
      include: { shift: true, user: true },
      orderBy: [{ shift: { date: "asc" } }, { shift: { startHour: "asc" } }],
    }),
    prisma.shift.findMany({
      where: { date: { gte: monthBounds.monthStart, lte: monthBounds.monthEnd } },
      orderBy: [{ date: "asc" }, { startHour: "asc" }],
    }),
  ]);

  const eligibleByShift = Object.fromEntries(
    await Promise.all(
      openShifts.map(async (shift) => {
        const [availabilities, existingAssignments] = await Promise.all([
          prisma.availability.findMany({ where: { date: shift.date, userId: { in: drivers.map((d) => d.id) } } }),
          prisma.assignment.findMany({
            where: { userId: { in: drivers.map((d) => d.id) }, shift: { date: shift.date } },
            include: { shift: true },
          }),
        ]);

        const eligible = drivers.filter((driver) => {
          const covered = availabilities.some(
            (availability) =>
              availability.userId === driver.id &&
              containsRange(availability.startHour, availability.endHour, shift.startHour, shift.endHour),
          );
          if (!covered) return false;

          const overlap = existingAssignments.some(
            (assignment) =>
              assignment.userId === driver.id &&
              rangesOverlap(assignment.shift.startHour, assignment.shift.endHour, shift.startHour, shift.endHour),
          );

          return !overlap;
        });

        return [shift.id, eligible];
      }),
    ),
  ) as Record<string, Array<{ id: string; name: string }>>;

  const assignedByDate = byDate(
    assignedInWeek.map((assignment) => ({
      id: assignment.id,
      shiftId: assignment.shiftId,
      date: assignment.shift.date,
      startHour: assignment.shift.startHour,
      endHour: assignment.shift.endHour,
      blockType: assignment.shift.blockType,
      whereNeeded: assignment.shift.whereNeeded,
      status: assignment.shift.status,
      driverName: assignment.user.name,
    })),
  );

  const openByDate = byDate(openShifts);
  const openGrouped: GroupedShift[] = Object.entries(openByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, shifts]) => ({ date, shifts }));

  const monthSummaryByDate = byDate(shiftsInMonth);

  const thisUrl = buildPath(params, {});
  const prevWeek = addDays(weekDates[0], -7);
  const nextWeek = addDays(weekDates[0], 7);
  const prevMonth = addMonths(monthBounds.monthStart, -1);
  const nextMonth = addMonths(monthBounds.monthStart, 1);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Planning</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            className={`pressable glass px-3 py-1 text-sm ${view === "week" ? "font-semibold" : ""}`}
            href={buildPath(params, { view: "week", week: weekDates[0] })}
          >
            Weekly
          </Link>
          <Link
            className={`pressable glass px-3 py-1 text-sm ${view === "month" ? "font-semibold" : ""}`}
            href={buildPath(params, { view: "month", month: monthBounds.monthStart })}
          >
            Monthly
          </Link>
        </div>
      </div>

      <div className="glass animate-in fade-in p-4 duration-200">
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Template Quick Add ({dateLabel(focusDate)})</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_BLOCKS.map((blockType) => (
            <form action={createShiftsFromBlocksAction} key={blockType}>
              <input name="date" type="hidden" value={focusDate} />
              <input name="blockTypes" type="hidden" value={blockType} />
              <input name="returnTo" type="hidden" value={thisUrl} />
              <button className="pressable rounded-xl border bg-white/70 px-3 py-1 text-sm dark:bg-slate-900/50" type="submit">
                {SHIFT_BLOCKS[blockType].label}
              </button>
            </form>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {view === "week" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Link className="pressable glass px-3 py-1 text-sm" href={buildPath(params, { week: prevWeek, date: prevWeek })}>
                    Prev week
                  </Link>
                  <Link className="pressable glass px-3 py-1 text-sm" href={buildPath(params, { week: nextWeek, date: nextWeek })}>
                    Next week
                  </Link>
                </div>
                <Link className="pressable glass px-3 py-1 text-sm" href={buildPath(params, { week: today, date: today })}>
                  Today
                </Link>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                {weekDates.map((date) => {
                  const dayAssignments = (assignedByDate[date] ?? []).sort((a, b) => a.startHour - b.startHour);
                  const openCount = (openByDate[date] ?? []).length;

                  return (
                    <section className={`glass p-3 ${date === today ? "today-highlight" : ""}`} key={date}>
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
                        <ManagerAddShiftsSheet
                          date={date}
                          returnTo={thisUrl}
                          triggerClassName="pressable rounded border border-transparent px-1 py-0.5 text-left text-sm font-semibold"
                          triggerLabel={dayLabel(date)}
                        />
                        {openCount > 0 ? (
                          <span className="rounded-full bg-orange-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">{openCount} open</span>
                        ) : null}
                      </div>

                      <div className="space-y-2">
                        {dayAssignments.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No assigned shifts</p>
                        ) : (
                          dayAssignments.map((item) => (
                            <div className="space-y-2" key={item.id}>
                              <ShiftBlock
                                status={item.status}
                                subtitle={`${item.blockType} · ${item.driverName}`}
                                timeRange={`${hourLabel(item.startHour)}-${hourLabel(item.endHour)}`}
                                whereNeeded={item.whereNeeded}
                              />
                              <ConfirmActionForm
                                action={unassignShiftAction}
                                className="w-full rounded border px-2 py-1 text-xs"
                                confirmLabel="Unassign"
                                hidden={[
                                  { name: "shiftId", value: item.shiftId },
                                  { name: "returnTo", value: thisUrl },
                                ]}
                                title="Shift unassignen"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link className="pressable glass px-3 py-1 text-sm" href={buildPath(params, { month: prevMonth, date: prevMonth })}>
                    Prev month
                  </Link>
                  <Link className="pressable glass px-3 py-1 text-sm" href={buildPath(params, { month: nextMonth, date: nextMonth })}>
                    Next month
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{monthLabel(monthBounds.monthStart)}</p>
                  <Link className="pressable glass px-3 py-1 text-sm" href={buildPath(params, { month: today, date: today })}>
                    Today
                  </Link>
                </div>
              </div>

              <div className="glass animate-in fade-in p-3 duration-200">
                <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
                  <p>Mon</p>
                  <p>Tue</p>
                  <p>Wed</p>
                  <p>Thu</p>
                  <p>Fri</p>
                  <p>Sat</p>
                  <p>Sun</p>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {monthGrid.dates.map((date) => {
                    const dayShifts = monthSummaryByDate[date] ?? [];
                    const assignedCount = dayShifts.filter((shift) => shift.status === "ASSIGNED").length;
                    const openCount = dayShifts.length - assignedCount;
                    const hasDhl = dayShifts.some((shift) => shift.whereNeeded === "DHL");
                    const hasDragonfly = dayShifts.some((shift) => shift.whereNeeded === "DRAGONFLY");
                    const isCurrentMonth = date >= monthBounds.monthStart && date <= monthBounds.monthEnd;

                    return (
                      <div className={`glass min-h-28 space-y-2 p-2 ${isCurrentMonth ? "" : "opacity-60"}`} key={date}>
                        <ManagerAddShiftsSheet
                          date={date}
                          returnTo={thisUrl}
                          triggerClassName="pressable w-full rounded-xl border bg-white/55 px-2 py-2 text-left dark:bg-slate-900/40"
                          triggerContent={
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">{date.slice(-2)}</span>
                              <span className="text-[11px] font-medium text-muted-foreground">Add shifts</span>
                            </div>
                          }
                        />
                        <div className="text-[11px] text-muted-foreground">
                          <p>Total: {dayShifts.length}</p>
                          <p>
                            Assigned {assignedCount} / Open {openCount}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {hasDhl ? <span className="h-2.5 w-2.5 rounded-full bg-dhl" title="DHL" /> : null}
                          {hasDragonfly ? <span className="h-2.5 w-2.5 rounded-full bg-dragonfly" title="Dragonfly" /> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="glass space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Open Shifts</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{openShifts.length}</span>
          </div>

          {openGrouped.length === 0 ? <p className="text-sm text-muted-foreground">No open shifts in this period.</p> : null}

          <div className="max-h-[70vh] space-y-3 overflow-auto pr-1">
            {openGrouped.map((group) => (
              <section className="space-y-2" key={group.date}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.date}</h3>
                {group.shifts.map((shift) => (
                  <article className="space-y-2 rounded-2xl border p-3" key={shift.id}>
                    <ShiftBlock
                      status={shift.status}
                      subtitle={shift.blockType}
                      timeRange={`${hourLabel(shift.startHour)}-${hourLabel(shift.endHour)}`}
                      whereNeeded={shift.whereNeeded}
                    />
                    <div className="flex gap-2">
                      <ManagerAssignSheet eligibleDrivers={eligibleByShift[shift.id] ?? []} returnTo={thisUrl} shift={shift} />
                      <ConfirmActionForm
                        action={deleteOpenShiftAction}
                        className="rounded border px-3 py-1 text-xs text-red-600"
                        confirmLabel="Delete"
                        hidden={[
                          { name: "shiftId", value: shift.id },
                          { name: "returnTo", value: thisUrl },
                        ]}
                        title="Open shift verwijderen"
                      />
                    </div>
                  </article>
                ))}
              </section>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
