"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, Copy, Check, Plus, Loader2 } from "lucide-react";
import {
  buildWeekExport,
  dayAbbrev,
  decimalHours,
  formatHours,
  formatRangeLabel,
  getISOWeek,
  getWeekDays,
  getWeekRange,
  isoDateKey,
  nextWeek,
  prevWeek,
  weekParam,
  type IsoWeek,
} from "@/lib/hours";
import {
  DRIVER_SHIFT_TYPES,
  SHIFT_TYPE_LABEL,
  isDHLType,
  type DriverShiftType as ShiftType,
} from "@/lib/driver-shift-types";

type Shift = {
  id: string;
  date: string;
  type: ShiftType;
  startTime: string | null;
  endTime: string | null;
  packages: number | null;
  stops: number | null;
};

function localTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function WeekHoursClient({ initialWeek }: { initialWeek: IsoWeek }) {
  const [current, setCurrent] = useState<IsoWeek>(initialWeek);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const range = useMemo(() => getWeekRange(current.year, current.week), [current]);
  const weekDays = useMemo(() => getWeekDays(current.year, current.week), [current]);
  const todayKey = useMemo(() => localTodayKey(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/shifts?week=${weekParam(current)}`);
    setShifts(res.ok ? await res.json() : []);
    setLoading(false);
  }, [current]);

  useEffect(() => {
    load();
  }, [load]);

  function shiftFor(dayKey: string, type: ShiftType) {
    return shifts.find((s) => isoDateKey(new Date(s.date)) === dayKey && s.type === type) ?? null;
  }

  async function addShift(date: Date, type: ShiftType) {
    setError(null);
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: isoDateKey(date), type }),
    });
    if (res.ok) {
      const created: Shift = await res.json();
      setShifts((prev) => [...prev, created]);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Toevoegen mislukt.");
    }
  }

  async function deleteShift(id: string) {
    if (!confirm("Deze dienst verwijderen?")) return;
    const res = await fetch(`/api/shifts/${id}`, { method: "DELETE" });
    if (res.ok) setShifts((prev) => prev.filter((s) => s.id !== id));
    else setError("Verwijderen mislukt.");
  }

  function handleSaved(updated: Shift) {
    setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  // Dragonfly-uitdraai: alleen diensten met ingevulde start- én eindtijd.
  const dragonflyComplete = shifts
    .filter((s) => s.type === "DRAGONFLY_MIDDAG" && s.startTime && s.endTime)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, startTime: s.startTime!, endTime: s.endTime! }));

  const exportText = useMemo(
    () => buildWeekExport(current.week, dragonflyComplete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current.week, JSON.stringify(dragonflyComplete)],
  );

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopiëren naar klembord mislukt.");
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Mijn uren</h1>

      {/* Week-navigatie */}
      <div className="glass flex items-center justify-between p-3">
        <button className="pressable glass flex items-center gap-1 px-3 py-1.5 text-sm" onClick={() => setCurrent(prevWeek(current))} type="button">
          <ChevronLeft className="h-4 w-4" />
          Vorige
        </button>
        <div className="text-center">
          <div className="text-sm font-medium">Week {current.week}</div>
          <div className="text-xs text-muted-foreground">{formatRangeLabel(range.start, range.end)}</div>
        </div>
        <button className="pressable glass px-3 py-1.5 text-sm" onClick={() => setCurrent(getISOWeek(new Date()))} type="button">
          Vandaag
        </button>
        <button className="pressable glass flex items-center gap-1 px-3 py-1.5 text-sm" onClick={() => setCurrent(nextWeek(current))} type="button">
          Volgende
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Tik op een dag om een dienst te plannen. Vul de uren of aantallen later in — opslaan gaat automatisch.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {/* Dag-editor */}
      {loading ? (
        <div className="glass p-6 text-center text-sm text-muted-foreground">Laden…</div>
      ) : (
        <div className="space-y-2">
          {weekDays.map((day) => {
            const key = isoDateKey(day);
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`glass flex flex-col gap-3 p-4 sm:flex-row sm:items-start ${isToday ? "ring-1 ring-sky-400" : ""}`}
              >
                <div className="flex w-24 shrink-0 items-baseline gap-2 sm:flex-col sm:gap-0">
                  <span className="text-sm font-semibold capitalize">{dayAbbrev(day)}</span>
                  <span className="text-2xl font-semibold tabular-nums leading-none">{day.getUTCDate()}</span>
                  {isToday ? <span className="text-xs text-sky-500">vandaag</span> : null}
                </div>

                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  {DRIVER_SHIFT_TYPES.map((t) => (
                    <Slot
                      key={t}
                      type={t}
                      shift={shiftFor(key, t)}
                      onAdd={() => addShift(day, t)}
                      onSaved={handleSaved}
                      onDelete={deleteShift}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dragonfly-uitdraai */}
      <div className="glass space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold">Dragonfly-uitdraai</h2>
          </div>
          <button
            className="pressable flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
            onClick={copyExport}
            type="button"
            disabled={dragonflyComplete.length === 0}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Gekopieerd" : "Kopieer"}
          </button>
        </div>
        <textarea
          className="h-40 w-full resize-none rounded border bg-white/60 p-3 font-mono text-xs text-foreground dark:bg-black/20"
          readOnly
          value={exportText}
        />
      </div>
    </section>
  );
}

const DHL_META = {
  chip: "bg-amber-400 text-black",
  addBorder: "border-amber-400/50 hover:border-amber-400",
  addText: "text-amber-600 dark:text-amber-400",
};

const TYPE_META: Record<ShiftType, { label: string; chip: string; addBorder: string; addText: string }> = {
  DHL_OCHTEND: { label: SHIFT_TYPE_LABEL.DHL_OCHTEND, ...DHL_META },
  DHL_OCHTEND_MIDDAG: { label: SHIFT_TYPE_LABEL.DHL_OCHTEND_MIDDAG, ...DHL_META },
  DHL_AVOND: { label: SHIFT_TYPE_LABEL.DHL_AVOND, ...DHL_META },
  DRAGONFLY_MIDDAG: {
    label: SHIFT_TYPE_LABEL.DRAGONFLY_MIDDAG,
    chip: "bg-blue-500 text-white",
    addBorder: "border-blue-500/40 hover:border-blue-500",
    addText: "text-blue-600 dark:text-blue-400",
  },
};

function Slot({
  type,
  shift,
  onAdd,
  onSaved,
  onDelete,
}: {
  type: ShiftType;
  shift: Shift | null;
  onAdd: () => void;
  onSaved: (s: Shift) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[type];

  if (!shift) {
    return (
      <button
        className={`pressable flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2.5 text-sm font-medium ${meta.addBorder} ${meta.addText}`}
        onClick={onAdd}
        type="button"
      >
        <Plus className="h-4 w-4" />
        {meta.label}
      </button>
    );
  }

  return <ShiftEditor shift={shift} onSaved={onSaved} onDelete={onDelete} />;
}

function ShiftEditor({
  shift,
  onSaved,
  onDelete,
}: {
  shift: Shift;
  onSaved: (s: Shift) => void;
  onDelete: (id: string) => void;
}) {
  const isDF = !isDHLType(shift.type);
  const meta = TYPE_META[shift.type];

  const [start, setStart] = useState(shift.startTime ?? "");
  const [end, setEnd] = useState(shift.endTime ?? "");
  const [packages, setPackages] = useState(shift.packages?.toString() ?? "");
  const [stops, setStops] = useState(shift.stops?.toString() ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const liveHours = isDF && start && end ? decimalHours(start, end) : null;

  async function save() {
    setStatus("saving");
    const payload = {
      date: isoDateKey(new Date(shift.date)),
      type: shift.type,
      startTime: isDF ? start || null : null,
      endTime: isDF ? end || null : null,
      packages: !isDF && packages !== "" ? Number(packages) : null,
      stops: !isDF && stops !== "" ? Number(stops) : null,
    };
    const res = await fetch(`/api/shifts/${shift.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      onSaved(await res.json());
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-border/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.chip}`}>{meta.label}</span>
        <div className="flex items-center gap-1.5">
          {status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
          {status === "saved" ? <Check className="h-3.5 w-3.5 text-green-600" /> : null}
          {status === "error" ? <span className="text-xs text-red-600">fout</span> : null}
          <button
            className="pressable rounded p-1 text-muted-foreground hover:text-red-600"
            onClick={() => onDelete(shift.id)}
            type="button"
            aria-label="Verwijderen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isDF ? (
        <div className="flex items-center gap-2 text-sm">
          <input
            className="w-24 rounded border bg-white/70 px-2 py-1 text-foreground dark:bg-black/20"
            onBlur={save}
            onChange={(e) => setStart(e.target.value)}
            type="time"
            value={start}
            aria-label="Starttijd"
          />
          <span className="text-muted-foreground">–</span>
          <input
            className="w-24 rounded border bg-white/70 px-2 py-1 text-foreground dark:bg-black/20"
            onBlur={save}
            onChange={(e) => setEnd(e.target.value)}
            type="time"
            value={end}
            aria-label="Eindtijd"
          />
          <span className="ml-auto text-sm font-semibold tabular-nums">
            {liveHours !== null ? `${formatHours(liveHours)} uur` : "—"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Pakketten
            <input
              className="rounded border bg-white/70 px-2 py-1 text-foreground dark:bg-black/20"
              inputMode="numeric"
              min={0}
              onBlur={save}
              onChange={(e) => setPackages(e.target.value)}
              type="number"
              value={packages}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Stops
            <input
              className="rounded border bg-white/70 px-2 py-1 text-foreground dark:bg-black/20"
              inputMode="numeric"
              min={0}
              onBlur={save}
              onChange={(e) => setStops(e.target.value)}
              type="number"
              value={stops}
            />
          </label>
        </div>
      )}
    </div>
  );
}
