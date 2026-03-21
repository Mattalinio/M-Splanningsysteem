import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/guards";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("MANAGER");
  return <AppShell name={session.user.name ?? "Manager"} role="MANAGER">{children}</AppShell>;
}
