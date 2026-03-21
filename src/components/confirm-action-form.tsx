"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ConfirmActionForm({
  action,
  title,
  confirmLabel,
  className,
  hidden,
}: {
  action: (formData: FormData) => Promise<void>;
  title: string;
  confirmLabel: string;
  className?: string;
  hidden: Array<{ name: string; value: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={className} type="button">
          {confirmLabel}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Weet je het zeker?</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <form
            action={async (formData) => {
              await action(formData);
              setOpen(false);
            }}
          >
            {hidden.map((item) => (
              <input key={item.name} name={item.name} type="hidden" value={item.value} />
            ))}
            <button className="rounded bg-red-600 px-3 py-1 text-sm text-white" type="submit">
              Ja
            </button>
          </form>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => setOpen(false)} type="button">
            Nee
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
