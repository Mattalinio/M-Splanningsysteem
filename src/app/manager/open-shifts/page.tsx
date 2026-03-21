import Link from "next/link";
import { requireRole } from "@/lib/guards";
import { hourLabel } from "@/lib/planning";
import { prisma } from "@/lib/prisma";

export default async function OpenShiftsPage() {
  await requireRole("MANAGER");

  const openShifts = await prisma.shift.findMany({
    where: { status: "OPEN" },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Open Shifts</h1>
      <div className="glass p-4">
        {openShifts.length === 0 ? <p className="text-sm text-muted-foreground">No open shifts.</p> : null}
        <div className="space-y-2">
          {openShifts.map((shift) => (
            <div className="rounded-xl border p-3 text-sm" key={shift.id}>
              <p>
                {shift.date} | {hourLabel(shift.startHour)}-{hourLabel(shift.endHour)} | {shift.whereNeeded}
              </p>
              <Link className="mt-2 inline-flex rounded border px-2 py-1 text-xs" href={`/manager?date=${shift.date}`}>
                Go to planning
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
