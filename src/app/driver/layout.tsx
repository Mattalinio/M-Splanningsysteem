import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/guards";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("DRIVER");
  return <AppShell name={session.user.name ?? "Driver"} role="DRIVER">{children}</AppShell>;
}
