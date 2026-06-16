"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (name.trim().length < 2) return "Vul je naam in.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Vul een geldig e-mailadres in.";
    if (password.length < 8) return "Wachtwoord moet minimaal 8 tekens zijn.";
    if (password !== confirm) return "Wachtwoorden komen niet overeen.";
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/login?registered=1");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Registreren mislukt. Probeer het opnieuw.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <section className="glass w-full p-6">
        <h1 className="text-2xl font-semibold">Account aanmaken</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Maak een driver-account aan om je uren te registreren.
        </p>

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Naam
            <input
              className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-black/20"
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

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
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="block text-sm">
            Wachtwoord bevestigen
            <input
              className="mt-1 w-full rounded-xl border bg-white/70 px-3 py-2 text-sm dark:bg-black/20"
              required
              minLength={8}
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            className="pressable w-full rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
            disabled={loading}
            type="submit"
          >
            {loading ? "Bezig..." : "Registreren"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Al een account?{" "}
          <Link className="underline" href="/login">
            Inloggen
          </Link>
        </p>
      </section>
    </main>
  );
}
