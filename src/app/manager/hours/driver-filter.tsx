"use client";

import { useRouter } from "next/navigation";

export function DriverFilter({
  drivers,
  huidigDriverId,
  huidigWeek,
}: {
  drivers: { id: string; name: string }[];
  huidigDriverId: string;
  huidigWeek: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (e.target.value) params.set("driverId", e.target.value);
    if (huidigWeek) params.set("week", huidigWeek);
    router.push(`/manager/hours?${params.toString()}`);
  }

  return (
    <select
      className="rounded border bg-white/70 px-2 py-1 text-sm dark:bg-slate-900/50"
      onChange={handleChange}
      value={huidigDriverId}
    >
      <option value="">Alle drivers</option>
      {drivers.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
