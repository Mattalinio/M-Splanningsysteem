import { Role } from "@prisma/client";

export function AppHeader({ role }: { role: Role }) {
  return (
    <header className="glass flex items-center justify-between p-3 text-sm">
      <p>Driver Planning System</p>
      <p>{role}</p>
    </header>
  );
}
