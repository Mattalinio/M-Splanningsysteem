"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { ThemeMode, useThemeMode } from "@/components/theme-provider";

const ITEMS: { label: string; value: ThemeMode; icon: React.ReactNode }[] = [
  { label: "Light", value: "light", icon: <Sun className="h-4 w-4" /> },
  { label: "Dark", value: "dark", icon: <Moon className="h-4 w-4" /> },
  { label: "System", value: "system", icon: <Laptop className="h-4 w-4" /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeMode();

  return (
    <div className="glass flex items-center gap-1 p-1 text-xs">
      {ITEMS.map((item) => (
        <button
          className={`pressable flex items-center gap-1 rounded-full px-2 py-1 ${theme === item.value ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
          key={item.value}
          onClick={() => setTheme(item.value)}
          type="button"
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
