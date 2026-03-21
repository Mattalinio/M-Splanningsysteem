import { DriverScheduleClient } from "@/components/driver-schedule-client";
import { requireRole } from "@/lib/guards";
import { getWeekDates } from "@/lib/planning";
import { prisma } from "@/lib/prisma";

export default async function DriverPage() {
  const session = await requireRole("DRIVER");

  const assignments = await prisma.assignment.findMany({
    where: { userId: session.user.id },
    include: { shift: true },
    orderBy: [{ shift: { date: "asc" } }, { shift: { startHour: "asc" } }],
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Driver Dashboard</h1>
      <DriverScheduleClient
        initialWeek={getWeekDates()[0]}
        items={assignments.map((assignment) => ({
          id: assignment.id,
          date: assignment.shift.date,
          startHour: assignment.shift.startHour,
          endHour: assignment.shift.endHour,
          whereNeeded: assignment.shift.whereNeeded,
          status: assignment.shift.status,
          blockType: assignment.shift.blockType,
        }))}
      />
    </section>
  );
}
