import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { DriverFilter } from "./driver-filter";

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

export default async function ManagerUrenPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; driverId?: string }>;
}) {
  await requireRole("MANAGER");
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

  const huidigWeek = weekParam(year, week);
  const huidigDriverId = params.driverId ?? "";

  const { start, end } = getWeekRange(year, week);

  const [drivers, entries] = await Promise.all([
    prisma.user.findMany({
      where: { role: "DRIVER", active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.timeEntry.findMany({
      where: {
        company: "dragonfly",
        date: { gte: start, lte: end },
        ...(huidigDriverId ? { driverId: huidigDriverId } : {}),
      },
      include: { driver: { select: { name: true, email: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const totaalUren = entries.reduce((sum, e) => sum + e.totalHours, 0);
  const vorigeWeek = prevWeek(year, week);
  const volgendeWeek = nextWeek(year, week);

  function weekLink(yw: { year: number; week: number }) {
    const p = new URLSearchParams();
    p.set("week", weekParam(yw.year, yw.week));
    if (huidigDriverId) p.set("driverId", huidigDriverId);
    return `/manager/hours?${p.toString()}`;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Uren overzicht (Dragonfly)</h1>

      <div className="flex flex-wrap items-center gap-3">
        <DriverFilter
          drivers={drivers}
          huidigDriverId={huidigDriverId}
          huidigWeek={huidigWeek}
        />
      </div>

      <div className="glass flex items-center justify-between p-3">
        <Link className="pressable glass flex items-center gap-1 px-3 py-1 text-sm" href={weekLink(vorigeWeek)}>
          <ChevronLeft className="h-4 w-4" />
          Vorige week
        </Link>
        <span className="text-sm font-medium">Week {week} · {year}</span>
        <Link className="pressable glass flex items-center gap-1 px-3 py-1 text-sm" href={weekLink(volgendeWeek)}>
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
                <th className="px-4 py-2 font-medium">Driver</th>
                <th className="px-4 py-2 font-medium">Datum</th>
                <th className="px-4 py-2 font-medium">Starttijd</th>
                <th className="px-4 py-2 font-medium">Eindtijd</th>
                <th className="px-4 py-2 font-medium text-right">Gewerkte uren</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr className="border-b last:border-0" key={entry.id}>
                  <td className="px-4 py-2">{entry.driver.name}</td>
                  <td className="px-4 py-2">{formatDatum(new Date(entry.date))}</td>
                  <td className="px-4 py-2">{entry.startTime}</td>
                  <td className="px-4 py-2">{entry.endTime}</td>
                  <td className="px-4 py-2 text-right">{entry.totalHours.toFixed(2)} uur</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-black/5 dark:bg-white/5">
                <td className="px-4 py-2 font-semibold" colSpan={4}>Weektotaal</td>
                <td className="px-4 py-2 text-right font-semibold">{totaalUren.toFixed(2)} uur</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
