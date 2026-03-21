import Link from "next/link";
import { Role } from "@prisma/client";
import { CalendarDays, ListTodo, Users, UserCircle2, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

export function AppShell({
  role,
  name,
  children,
}: {
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  if (role === "MANAGER") {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-4 p-4">
        <aside className="glass w-64 shrink-0 p-4">
          <p className="text-sm text-slate-500">Manager</p>
          <h2 className="mb-4 text-lg font-semibold">{name}</h2>

          <nav className="space-y-2 text-sm">
            <Link className="pressable glass flex items-center gap-2 px-3 py-2" href="/manager">
              <CalendarDays className="h-4 w-4" />
              Dashboard / Planning
            </Link>
            <Link className="pressable glass flex items-center gap-2 px-3 py-2" href="/manager/open-shifts">
              <ListTodo className="h-4 w-4" />
              Open Shifts
            </Link>
            <Link className="pressable glass flex items-center gap-2 px-3 py-2" href="/manager/drivers">
              <Users className="h-4 w-4" />
              Drivers
            </Link>
            <Link className="pressable glass flex items-center gap-2 px-3 py-2" href="/manager/hours">
              <Clock className="h-4 w-4" />
              Uren overzicht
            </Link>
            <Link className="pressable glass flex items-center gap-2 px-3 py-2" href="/account">
              <UserCircle2 className="h-4 w-4" />
              Account
            </Link>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="flex items-center justify-end gap-2">
            <ThemeToggle />
            <SignOutButton />
          </header>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Driver</p>
          <h1 className="text-lg font-semibold">{name}</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link className="pressable glass px-3 py-1 text-sm" href="/driver">
            Dashboard
          </Link>
          <Link className="pressable glass px-3 py-1 text-sm" href="/driver/availability">
            Availability
          </Link>
          <Link className="pressable glass px-3 py-1 text-sm" href="/driver/hours">
            Uren invoeren
          </Link>
          <Link className="pressable glass px-3 py-1 text-sm" href="/driver/hours/week">
            Weekoverzicht
          </Link>
          <Link className="pressable glass px-3 py-1 text-sm" href="/account">
            Account
          </Link>
          <ThemeToggle />
          <SignOutButton />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
