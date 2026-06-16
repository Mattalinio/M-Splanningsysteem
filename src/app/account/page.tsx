import { updateAccountNameAction, updateAccountPasswordAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/guards";

export default async function AccountPage() {
  const session = await requireAuth();

  return (
    <AppShell name={session.user.name ?? "User"} role={session.user.role}>
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Account</h1>

        <div className="glass p-4">
          <h2 className="mb-2 text-lg font-semibold">Profiel</h2>
          <form action={updateAccountNameAction} className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              Naam
              <input className="ml-2 rounded border bg-white/70 px-2 py-1 dark:bg-black/20" defaultValue={session.user.name ?? ""} name="name" required />
            </label>
            <button className="pressable rounded bg-primary px-3 py-1 text-sm text-primary-foreground" type="submit">
              Opslaan
            </button>
          </form>
        </div>

        <div className="glass p-4">
          <h2 className="mb-2 text-lg font-semibold">Wachtwoord wijzigen</h2>
          <form action={updateAccountPasswordAction} className="grid gap-2 md:max-w-lg">
            <input className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" name="currentPassword" placeholder="Huidig wachtwoord" required type="password" />
            <input className="rounded border bg-white/70 px-2 py-1 dark:bg-black/20" minLength={8} name="newPassword" placeholder="Nieuw wachtwoord" required type="password" />
            <button className="pressable w-fit rounded bg-primary px-3 py-1 text-sm text-primary-foreground" type="submit">
              Wachtwoord bijwerken
            </button>
          </form>
        </div>

        <div className="glass p-4">
          <h2 className="mb-2 text-lg font-semibold">Thema</h2>
          <p className="text-sm text-muted-foreground">Gebruik de Licht/Donker/Systeem-schakelaar in de navigatiebalk bovenaan.</p>
        </div>
      </section>
    </AppShell>
  );
}
