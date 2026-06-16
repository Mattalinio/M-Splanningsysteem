import {
  addAvailabilityAction,
  deleteAvailabilityAction,
  updateAvailabilityAction,
} from "@/app/actions";
import { BulkAvailabilityCalendar } from "@/components/bulk-availability-calendar";
import { requireRole } from "@/lib/guards";
import { hourLabel } from "@/lib/planning";
import { prisma } from "@/lib/prisma";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default async function DriverAvailabilityPage() {
  const session = await requireRole("DRIVER");

  const availabilities = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: "asc" }, { startHour: "asc" }],
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Availability</h1>

      <div className="glass p-4">
        <h2 className="mb-2 text-lg font-semibold">Per-day availability</h2>
        <form action={addAvailabilityAction} className="grid gap-2 md:grid-cols-4">
          <input className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" name="date" required type="date" />
          <select className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" defaultValue={9} name="startHour">
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </select>
          <select className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" defaultValue={17} name="endHour">
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </select>
          <button className="pressable rounded bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black" type="submit">
            Save
          </button>
        </form>
      </div>

      <div className="glass p-4">
        <h2 className="mb-2 text-lg font-semibold">Bulk availability (multi-select)</h2>
        <BulkAvailabilityCalendar />
      </div>

      <div className="space-y-2">
        {availabilities.length === 0 ? (
          <div className="glass p-4 text-sm text-muted-foreground">No availability yet.</div>
        ) : null}

        {availabilities.map((availability) => (
          <article className="glass p-3" key={availability.id}>
            {availability.status === "LOCKED" ? (
              <div>
                <p className="text-sm font-semibold">
                  {availability.date} | {hourLabel(availability.startHour)}-{hourLabel(availability.endHour)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Locked: overlaps with an assigned shift.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <form action={updateAvailabilityAction} className="grid gap-2 md:grid-cols-5">
                  <input name="availabilityId" type="hidden" value={availability.id} />
                  <input className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" defaultValue={availability.date} name="date" required type="date" />
                  <select className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" defaultValue={availability.startHour} name="startHour">
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {hourLabel(hour)}
                      </option>
                    ))}
                  </select>
                  <select className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" defaultValue={availability.endHour} name="endHour">
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {hourLabel(hour)}
                      </option>
                    ))}
                  </select>
                  <button className="rounded border px-2 py-1 text-sm" type="submit">
                    Update
                  </button>
                </form>

                <form action={deleteAvailabilityAction}>
                  <input name="availabilityId" type="hidden" value={availability.id} />
                  <button className="rounded border px-2 py-1 text-sm text-red-600" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
