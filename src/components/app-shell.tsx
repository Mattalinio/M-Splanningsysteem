import Link from "next/link";
import { Role } from "@prisma/client";
import { CalendarDays, ListTodo, Users, UserCircle2, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { DriverNav } from "@/components/driver-nav";
import { DriverVanNav } from "@/components/driver-van-nav";

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

  const initials = getInitials(name);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col gap-6 p-4 sm:p-6">
      {/* Desktop: van-navbar */}
      <div className="hidden md:block">
        <DriverVanNav name={name} />
      </div>

      {/* Mobiel: compacte balk (van schaalt te klein op smalle schermen) */}
      <header className="glass flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {initials}
          </span>
          <div className="leading-tight">
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">Chauffeur</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DriverNav />
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main className="min-w-0">{children}</main>
    </div>
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
