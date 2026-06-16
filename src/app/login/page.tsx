"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const registered = searchParams.get("registered");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, password, callbackUrl: "/" });
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="glass w-full p-6">
        <h1 className="text-2xl font-semibold">Inloggen</h1>
        <p className="mt-2 text-sm text-muted-foreground">Log in met je accountgegevens om verder te gaan.</p>

        {registered ? (
          <p className="mt-4 rounded-xl bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Account aangemaakt. Je kunt nu inloggen.
          </p>
        ) : null}

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            E-mail
            <input
              className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-black/20"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Wachtwoord
            <input
              className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-black/20"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-600">Onjuist e-mailadres of wachtwoord.</p> : null}

          <button className="pressable w-full rounded-xl bg-primary px-3 py-2 text-primary-foreground" disabled={loading} type="submit">
            {loading ? "Bezig met inloggen..." : "Inloggen"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Nog geen account?{" "}
          <Link className="underline" href="/register">
            Registreer
          </Link>
        </p>
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
