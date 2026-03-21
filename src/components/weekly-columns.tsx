import { ShiftStatus, WhereNeeded } from "@prisma/client";
import { dayLabel, hourLabel } from "@/lib/planning";
import { ShiftBlock } from "@/components/shift-block";

type Item = {
  id: string;
  date: string;
  startHour: number;
  endHour: number;
  whereNeeded: WhereNeeded;
  status: ShiftStatus;
  title?: string;
  subtitle?: string;
};

export function WeeklyColumns({
  weekDates,
  items,
  today,
  emptyText,
}: {
  weekDates: string[];
  items: Item[];
  today?: string;
  emptyText: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {weekDates.map((date) => {
        const dayItems = items
          .filter((item) => item.date === date)
          .sort((a, b) => a.startHour - b.startHour);

        return (
          <section className={`glass p-3 ${today === date ? "today-highlight" : ""}`} key={date}>
            <h3 className="mb-2 border-b border-border pb-2 text-sm font-semibold">{dayLabel(date)}</h3>
            <div className="space-y-2">
              {dayItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">{emptyText}</p>
              ) : (
                dayItems.map((item) => (
                  <ShiftBlock
                    key={item.id}
                    status={item.status}
                    subtitle={item.subtitle}
                    timeRange={`${hourLabel(item.startHour)}-${hourLabel(item.endHour)}`}
                    title={item.title}
                    whereNeeded={item.whereNeeded}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
