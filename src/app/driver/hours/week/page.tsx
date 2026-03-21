import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

function getISOWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

function getWeekRange(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const start = new Date(startOfWeek1);
  start.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

function prevWeek(year: number, week: number) {
  if (week === 1) {
    const dec28 = new Date(Date.UTC(year - 1, 11, 28));
    return getISOWeek(dec28);
  }
  return { year, week: week - 1 };
}

function nextWeek(year: number, week: number) {
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const maxWeek = getISOWeek(dec28).week;
  if (week >= maxWeek) return { year: year + 1, week: 1 };
  return { year, week: week + 1 };
}

function weekParam(year: number, week: number) {
  return `${year}-${String(week).padStart(2, "0")}`;
}

const DAGEN_NL = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MAANDEN_NL = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function formatDatum(date: Date) {
  const dag = DAGEN_NL[date.getUTCDay()];
  const d = date.getUTCDate();
  const m = MAANDEN_NL[date.getUTCMonth()];
  return `${dag} ${d} ${m}`;
}

export default async function WeekoverzichtPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await requireRole("DRIVER");
  const params = await searchParams;

  let year: number;
  let week: number;

  if (params.week) {
    [year, week] = params.week.split("-").map(Number);
  } else {
    const nu = getISOWeek(new Date());
    year = nu.year;
    week = nu.week;
  }

  const { start, end } = getWeekRange(year, week);

  const entries = await prisma.timeEntry.findMany({
    where: {
      driverId: session.user.id,
      date: { gte: start, lte: end },
    },
    orderBy: { date: "asc" },
  });

  const totaalUren = entries.reduce((sum, e) => sum + e.totalHours, 0);
  const vorigeWeek = prevWeek(year, week);
  const volgendeWeek = nextWeek(year, week);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Weekoverzicht</h1>

      <div className="glass flex items-center justify-between p-3">
        <Link
          className="pressable glass flex items-center gap-1 px-3 py-1 text-sm"
          href={`/driver/hours/week?week=${weekParam(vorigeWeek.year, vorigeWeek.week)}`}
        >
          <ChevronLeft className="h-4 w-4" />
          Vorige week
        </Link>

        <span className="text-sm font-medium">
          Week {week} · {year}
        </span>

        <Link
          className="pressable glass flex items-center gap-1 px-3 py-1 text-sm"
          href={`/driver/hours/week?week=${weekParam(volgendeWeek.year, volgendeWeek.week)}`}
        >
          Volgende week
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="glass p-6 text-center text-sm text-muted-foreground">
          Geen uren geregistreerd voor deze week.
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Datum</th>
                <th className="px-4 py-2 font-medium">Starttijd</th>
                <th className="px-4 py-2 font-medium">Eindtijd</th>
                <th className="px-4 py-2 font-medium text-right">Gewerkte uren</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr className="border-b last:border-0" key={entry.id}>
                  <td className="px-4 py-2">{formatDatum(new Date(entry.date))}</td>
                  <td className="px-4 py-2">{entry.startTime}</td>
                  <td className="px-4 py-2">{entry.endTime}</td>
                  <td className="px-4 py-2 text-right">{entry.totalHours.toFixed(2)} uur</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-black/5 dark:bg-white/5">
                <td className="px-4 py-2 font-semibold" colSpan={3}>
                  Weektotaal
                </td>
                <td className="px-4 py-2 text-right font-semibold">
                  {totaalUren.toFixed(2)} uur
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
