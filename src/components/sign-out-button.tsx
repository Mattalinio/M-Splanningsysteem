"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="pressable glass inline-flex items-center gap-1 px-3 py-1 text-sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
