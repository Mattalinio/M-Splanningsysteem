"use client";

import { useState } from "react";
import { assignShiftAction } from "@/app/actions";
import { ShiftBlock } from "@/components/shift-block";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { hourLabel } from "@/lib/planning";
import { ShiftStatus, WhereNeeded } from "@prisma/client";

type EligibleDriver = {
  id: string;
  name: string;
};

export function ManagerAssignSheet({
  shift,
  eligibleDrivers,
  returnTo,
}: {
  shift: {
    id: string;
    date: string;
    startHour: number;
    endHour: number;
    whereNeeded: WhereNeeded;
    status: ShiftStatus;
    blockType: string;
  };
  eligibleDrivers: EligibleDriver[];
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="pressable rounded bg-black px-3 py-1 text-xs text-white dark:bg-white dark:text-black" type="button">
          Assign
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Assign shift</SheetTitle>
          <SheetDescription>
            {shift.date} | {hourLabel(shift.startHour)}-{hourLabel(shift.endHour)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3">
          <ShiftBlock
            status={shift.status}
            subtitle={shift.blockType}
            timeRange={`${hourLabel(shift.startHour)}-${hourLabel(shift.endHour)}`}
            whereNeeded={shift.whereNeeded}
          />

          <form
            action={async (formData) => {
              await assignShiftAction(formData);
              setOpen(false);
            }}
            className="space-y-3"
          >
            <input name="shiftId" type="hidden" value={shift.id} />
            <input name="returnTo" type="hidden" value={returnTo} />

            <label className="block space-y-1 text-sm">
              <span>Eligible driver</span>
              <select
                className="w-full rounded border bg-white/70 px-2 py-2 text-sm dark:bg-slate-900/50"
                disabled={eligibleDrivers.length === 0}
                name="userId"
                required
              >
                <option value="">Select eligible driver</option>
                {eligibleDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </label>

            {eligibleDrivers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No eligible drivers yet. Availability must fully cover this shift.</p>
            ) : null}

            <button
              className="pressable w-full rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
              disabled={eligibleDrivers.length === 0}
              type="submit"
            >
              Assign ✅
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
