"use client";

import { ReactNode, useMemo, useState } from "react";
import { ShiftBlockType } from "@prisma/client";
import { createShiftsFromBlocksAction } from "@/app/actions";
import { SHIFT_BLOCKS, dateLabel } from "@/lib/planning";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function ManagerAddShiftsSheet({
  date,
  triggerLabel,
  triggerClassName,
  returnTo,
  triggerContent,
}: {
  date: string;
  triggerLabel?: string;
  triggerClassName?: string;
  returnTo: string;
  triggerContent?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const blockEntries = useMemo(
    () => Object.entries(SHIFT_BLOCKS) as Array<[ShiftBlockType, (typeof SHIFT_BLOCKS)[ShiftBlockType]]>,
    [],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className={triggerClassName ?? "pressable glass px-3 py-1 text-sm"} type="button">
          {triggerContent ?? triggerLabel ?? `Add shifts (${dateLabel(date)})`}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add shifts for this date</SheetTitle>
          <SheetDescription>Select one or more locked shift blocks.</SheetDescription>
        </SheetHeader>

        <form
          action={async (formData) => {
            await createShiftsFromBlocksAction(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input name="date" type="hidden" value={date} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <div className="grid gap-2 md:grid-cols-2">
            {blockEntries.map(([key, block]) => (
              <label className="flex items-center gap-2 rounded border p-2 text-sm" key={key}>
                <input name="blockTypes" type="checkbox" value={key} />
                <span>
                  {block.label} ({String(block.startHour).padStart(2, "0")}:00-{String(block.endHour).padStart(2, "0")}:00)
                </span>
              </label>
            ))}
          </div>
          <button className="pressable rounded bg-black px-3 py-1 text-sm text-white dark:bg-white dark:text-black" type="submit">
            Save shifts
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
