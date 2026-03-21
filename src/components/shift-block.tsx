import { ShiftStatus, WhereNeeded } from "@prisma/client";

type ShiftBlockProps = {
  whereNeeded: WhereNeeded;
  timeRange: string;
  status: ShiftStatus;
  title?: string;
  subtitle?: string;
};

export function ShiftBlock({ whereNeeded, timeRange, status, title, subtitle }: ShiftBlockProps) {
  const base =
    whereNeeded === "DHL"
      ? "bg-dhl text-[#111111]"
      : "bg-dragonfly text-white";

  return (
    <article
      className={`pressable rounded-2xl border p-3 text-xs shadow-sm ${base} ${status === "OPEN" ? "border-dashed opacity-85" : "border-transparent"}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-semibold">{timeRange}</p>
        <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-current">
          {whereNeeded === "DHL" ? "DHL" : "Dragonfly"}
        </span>
      </div>
      {title ? <p className="font-medium">{title}</p> : null}
      {subtitle ? <p className="opacity-90">{subtitle}</p> : null}
      <p className="mt-1 text-[10px] uppercase tracking-wide">{status}</p>
    </article>
  );
}
