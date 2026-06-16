"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/driver", label: "Dashboard" },
  { href: "/driver/hours/week", label: "Mijn uren" },
  { href: "/account", label: "Account" },
];

export function DriverNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/driver"
            ? pathname === "/driver"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`pressable rounded-full px-3 py-1.5 text-sm transition ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
