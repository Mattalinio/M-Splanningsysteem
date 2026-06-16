import { DriverDashboard } from "@/components/driver-dashboard";
import { requireRole } from "@/lib/guards";
import { getISOWeek } from "@/lib/hours";

export default async function DriverPage() {
  // Sessie-check; de dienstdata komt per gebruiker via /api/time-entries (gefilterd op userId).
  await requireRole("DRIVER");

  return <DriverDashboard initialWeek={getISOWeek(new Date())} />;
}
