"use client";

import { useState } from "react";

export function UrenForm() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [berekend, setBerekend] = useState<number | null>(null);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState<{ type: "succes" | "fout"; tekst: string } | null>(null);

  function berekenUren(start: string, eind: string) {
    if (!start || !eind) { setBerekend(null); return; }
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = eind.split(":").map(Number);
    const verschil = (eh * 60 + em) - (sh * 60 + sm);
    setBerekend(verschil > 0 ? verschil / 60 : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBezig(true);
    setMelding(null);

    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, endTime }),
    });

    setBezig(false);

    if (res.ok) {
      setMelding({ type: "succes", tekst: "Uren succesvol opgeslagen!" });
      setDate(today);
      setStartTime("");
      setEndTime("");
      setBerekend(null);
    } else {
      const data = await res.json();
      setMelding({ type: "fout", tekst: data.error ?? "Er ging iets mis." });
    }
  }

  return (
    <div className="glass p-4">
      <h2 className="mb-4 text-lg font-semibold">Uren invoeren</h2>

      {melding && (
        <div className={`mb-4 rounded px-3 py-2 text-sm ${melding.type === "succes" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
          {melding.tekst}
        </div>
      )}

      <form className="grid gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Datum</label>
          <input
            className="rounded border bg-white/70 px-2 py-1 dark:bg-slate-900/50"
            onChange={(e) => setDate(e.target.value)}
            required
            type="date"
            value={date}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Starttijd</label>
          <input
            className="rounded border bg-white/70 px-2 py-1 dark:bg-slate-900/50"
            onChange={(e) => { setStartTime(e.target.value); berekenUren(e.target.value, endTime); }}
            required
            type="time"
            value={startTime}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Eindtijd</label>
          <input
            className="rounded border bg-white/70 px-2 py-1 dark:bg-slate-900/50"
            onChange={(e) => { setEndTime(e.target.value); berekenUren(startTime, e.target.value); }}
            required
            type="time"
            value={endTime}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Totaal uren</label>
          <div className="rounded border bg-white/40 px-2 py-1 text-sm dark:bg-slate-900/30">
            {berekend !== null ? `${berekend.toFixed(2)} uur` : "—"}
          </div>
        </div>

        <div className="md:col-span-4">
          <button
            className="pressable rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
            disabled={bezig}
            type="submit"
          >
            {bezig ? "Opslaan..." : "Opslaan"}
          </button>
        </div>
      </form>
    </div>
  );
}
