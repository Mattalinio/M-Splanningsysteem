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
          <h2 className="mb-2 text-lg font-semibold">Profile</h2>
          <form action={updateAccountNameAction} className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              Name
              <input className="ml-2 rounded border bg-white/70 px-2 py-1 dark:bg-slate-950/50" defaultValue={session.user.name ?? ""} name="name" required />
            </label>
            <button className="pressable rounded bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black" type="submit">
              Save
            </button>
          </form>
        </div>

        <div className="glass p-4">
          <h2 className="mb-2 text-lg font-semibold">Change password</h2>
          <form action={updateAccountPasswordAction} className="grid gap-2 md:max-w-lg">
            <input className="rounded border bg-white/70 px-2 py-1 dark:bg-slate-950/50" name="currentPassword" placeholder="Current password" required type="password" />
            <input className="rounded border bg-white/70 px-2 py-1 dark:bg-slate-950/50" minLength={8} name="newPassword" placeholder="New password" required type="password" />
            <button className="pressable w-fit rounded bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black" type="submit">
              Update password
            </button>
          </form>
        </div>

        <div className="glass p-4">
          <h2 className="mb-2 text-lg font-semibold">Theme</h2>
          <p className="text-sm text-muted-foreground">Use the Light/Dark/System toggle in the top-right app shell.</p>
        </div>
      </section>
    </AppShell>
  );
}
