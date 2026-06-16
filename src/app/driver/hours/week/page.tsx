import { requireRole } from "@/lib/guards";
import { getISOWeek, parseWeekParam } from "@/lib/hours";
import { WeekHoursClient } from "./week-hours-client";

export default async function WeekoverzichtPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireRole("DRIVER");
  const params = await searchParams;
  const initialWeek = params.week ? parseWeekParam(params.week) : getISOWeek(new Date());

  return <WeekHoursClient initialWeek={initialWeek} />;
}
