"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl: "/" });
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="glass w-full p-6">
        <h1 className="text-2xl font-semibold">Driver Planning Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use your account credentials to continue.</p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-slate-950/50"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Password
            <input
              className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-slate-950/50"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-600">Invalid email or password.</p> : null}

          <button className="pressable w-full rounded-xl bg-black px-3 py-2 text-white dark:bg-white dark:text-black" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto flex min-h-screen max-w-md items-center px-4"><section className="glass w-full p-6">Loading...</section></main>}>
      <LoginContent />
    </Suspense>
  );
}
