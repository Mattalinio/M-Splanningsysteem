"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useThemeMode, type ThemeMode } from "@/components/theme-provider";

export function DriverVanNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useThemeMode();

  function isActive(href: string): boolean {
    if (href === "/driver") return pathname === "/driver";
    if (href === "/driver/hours/week") return pathname.startsWith("/driver/hours");
    return pathname.startsWith(href);
  }

  function go(href: string) {
    router.push(href);
  }

  function navProps(href: string, label: string) {
    return {
      className: `van-item${isActive(href) ? " active" : ""}`,
      role: "link",
      tabIndex: 0,
      "aria-label": label,
      onClick: () => go(href),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go(href);
        }
      },
    } as const;
  }

  // x-positie van het selectie-pilletje van de thema-toggle.
  const themeHi: Record<ThemeMode, number> = { light: 847, dark: 869, system: 891 };

  return (
    <svg viewBox="0 0 1200 440" role="navigation" aria-label="Driver Planning navigatie" className="block h-auto w-full">
      <defs>
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="van-stop-1" />
          <stop offset="1" className="van-stop-2" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D4DCE0" />
          <stop offset="1" stopColor="#BDC8CE" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="600" cy="382" rx="500" ry="18" fill="#000" opacity="0.08" filter="url(#soft)" />

      {/* van body */}
      <path
        d="M74,300 Q70,300 70,296 L70,214 Q70,210 73,206 L150,120 Q152,118 156,118 L1112,118 Q1120,118 1120,126 L1120,296 Q1120,300 1116,300 L74,300 Z"
        fill="url(#bodyGrad)"
        strokeWidth="1"
        style={{ stroke: "var(--van-edge)" }}
      />
      <line x1="162" y1="127" x2="1106" y2="127" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />

      {/* mirror */}
      <path d="M73,150 L64,146" strokeWidth="2.4" strokeLinecap="round" style={{ stroke: "var(--van-edge)" }} />
      <rect x="54" y="139" width="11" height="13" rx="2.5" strokeWidth="1" style={{ fill: "var(--van-body-1)", stroke: "var(--van-edge)" }} />

      {/* windshield + door window */}
      <path d="M152,126 L110,168 L175,168 L175,126 Z" fill="url(#glassGrad)" opacity="0.9" />
      <rect x="185" y="128" width="82" height="40" rx="6" fill="url(#glassGrad)" opacity="0.9" />
      <line x1="120" y1="160" x2="150" y2="132" stroke="#ffffff" strokeWidth="2" opacity="0.5" strokeLinecap="round" />

      {/* dividers */}
      <line x1="300" y1="124" x2="300" y2="296" strokeWidth="1" opacity="0.7" style={{ stroke: "var(--van-edge)" }} />
      <line x1="185" y1="172" x2="185" y2="296" strokeWidth="1" opacity="0.5" style={{ stroke: "var(--van-edge)" }} />
      <line x1="968" y1="158" x2="968" y2="226" strokeWidth="1" opacity="0.55" style={{ stroke: "var(--van-edge)" }} />

      {/* driver naam + rol op de cabinedeur */}
      <text className="van-name" x="243" y="232">
        {name}
      </text>
      <text className="van-role" x="243" y="248">
        Chauffeur
      </text>

      {/* 1 Dashboard */}
      <g {...navProps("/driver", "Dashboard")}>
        <rect x="336" y="148" width="92" height="86" fill="transparent" />
        <g className="van-icon" transform="translate(368,156)">
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
        </g>
        <text className="van-lbl" x="380" y="214">
          Dashboard
        </text>
        {isActive("/driver") ? <rect className="van-accent" x="358" y="224" width="44" height="2.6" rx="1.3" /> : null}
      </g>

      {/* 2 Mijn uren */}
      <g {...navProps("/driver/hours/week", "Mijn uren")}>
        <rect x="500" y="148" width="92" height="86" fill="transparent" />
        <g className="van-icon" transform="translate(533,156)">
          <circle cx="12" cy="13" r="8.2" />
          <line x1="12" y1="13" x2="12" y2="8" />
          <line x1="12" y1="13" x2="15.6" y2="14.6" />
        </g>
        <text className="van-lbl" x="545" y="214">
          Mijn uren
        </text>
        {isActive("/driver/hours/week") ? (
          <rect className="van-accent" x="523" y="224" width="44" height="2.6" rx="1.3" />
        ) : null}
      </g>

      {/* 3 Account */}
      <g {...navProps("/account", "Account")}>
        <rect x="666" y="148" width="88" height="86" fill="transparent" />
        <g className="van-icon" transform="translate(698,156)">
          <circle cx="12" cy="8.4" r="3.6" />
          <path d="M5,20 a7 7 0 0 1 14 0" />
        </g>
        <text className="van-lbl" x="710" y="214">
          Account
        </text>
        {isActive("/account") ? <rect className="van-accent" x="688" y="224" width="44" height="2.6" rx="1.3" /> : null}
      </g>

      {/* thema-toggle (segmented control) */}
      <g aria-label="Thema">
        <rect x="834" y="156" width="92" height="28" rx="14" strokeWidth="1" style={{ fill: "var(--van-toggle-bg)", stroke: "var(--van-toggle-border)" }} />
        <rect x={themeHi[theme]} y="159" width="22" height="22" rx="9" fill="#c18a4b" opacity="0.18" />
        {/* klikvlakken voor de thema-iconen */}
        <rect x="846" y="158" width="22" height="24" fill="transparent" style={{ cursor: "pointer" }} onClick={() => setTheme("light")} role="button" aria-label="Licht thema" />
        <rect x="868" y="158" width="22" height="24" fill="transparent" style={{ cursor: "pointer" }} onClick={() => setTheme("dark")} role="button" aria-label="Donker thema" />
        <rect x="890" y="158" width="22" height="24" fill="transparent" style={{ cursor: "pointer" }} onClick={() => setTheme("system")} role="button" aria-label="Systeem thema" />
        {/* zon (light) */}
        <g
          className={`van-ticon${theme === "light" ? " sel" : ""}`}
          transform="translate(850,162)"
          onClick={() => setTheme("light")}
          role="button"
          aria-label="Licht thema"
        >
          <circle cx="8" cy="8" r="3" />
          <line x1="8" y1="1" x2="8" y2="2.6" />
          <line x1="8" y1="13.4" x2="8" y2="15" />
          <line x1="1" y1="8" x2="2.6" y2="8" />
          <line x1="13.4" y1="8" x2="15" y2="8" />
          <line x1="3" y1="3" x2="4.1" y2="4.1" />
          <line x1="11.9" y1="11.9" x2="13" y2="13" />
          <line x1="13" y1="3" x2="11.9" y2="4.1" />
          <line x1="4.1" y1="11.9" x2="3" y2="13" />
        </g>
        {/* maan (dark) */}
        <g
          className={`van-ticon${theme === "dark" ? " sel" : ""}`}
          transform="translate(872,162)"
          onClick={() => setTheme("dark")}
          role="button"
          aria-label="Donker thema"
        >
          <path d="M13,9.5 a5.2 5.2 0 1 1 -5.6 -7 a4 4 0 0 0 5.6 7 z" />
        </g>
        {/* monitor (system) */}
        <g
          className={`van-ticon${theme === "system" ? " sel" : ""}`}
          transform="translate(894,162)"
          onClick={() => setTheme("system")}
          role="button"
          aria-label="Systeem thema"
        >
          <rect x="2" y="3" width="12" height="8.5" rx="1.4" />
          <line x1="8" y1="11.5" x2="8" y2="14" />
          <line x1="5" y1="14" x2="11" y2="14" />
        </g>
        <text className="van-lbl" x="880" y="214">
          Thema
        </text>
      </g>

      {/* 4 Logout */}
      <g
        className="van-item"
        role="button"
        tabIndex={0}
        aria-label="Uitloggen"
        onClick={() => signOut({ callbackUrl: "/login" })}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            signOut({ callbackUrl: "/login" });
          }
        }}
      >
        <rect x="986" y="148" width="88" height="86" fill="transparent" />
        <g className="van-icon" transform="translate(1018,156)">
          <path d="M13,4 H6 a2 2 0 0 0 -2,2 v12 a2 2 0 0 0 2,2 h7" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <path d="M17.5,8.5 L21,12 L17.5,15.5" />
        </g>
        <text className="van-lbl" x="1030" y="214">
          Logout
        </text>
      </g>

      {/* pakketten achter de van */}
      <ellipse cx="1150" cy="360" rx="36" ry="6" fill="#000" opacity="0.07" filter="url(#soft)" />
      <rect x="1126" y="320" width="52" height="38" rx="2" fill="#E2CDA8" stroke="#BFA478" strokeWidth="1.4" />
      <line x1="1152" y1="320" x2="1152" y2="328" stroke="#BFA478" strokeWidth="1.1" />
      <line x1="1126" y1="335" x2="1178" y2="335" stroke="#C9B488" strokeWidth="1.1" />
      <rect x="1134" y="294" width="38" height="26" rx="2" fill="#E7D4B4" stroke="#BFA478" strokeWidth="1.4" />
      <line x1="1153" y1="294" x2="1153" y2="300" stroke="#BFA478" strokeWidth="1.1" />

      {/* wielen */}
      <circle cx="180" cy="300" r="56" style={{ fill: "var(--background)" }} />
      <circle cx="975" cy="300" r="56" style={{ fill: "var(--background)" }} />
      <circle cx="180" cy="312" r="46" fill="#2b2823" />
      <circle cx="180" cy="312" r="29" fill="none" stroke="#4a463d" strokeWidth="3" />
      <circle cx="180" cy="312" r="8" fill="#1c1a16" />
      <circle cx="975" cy="312" r="46" fill="#2b2823" />
      <circle cx="975" cy="312" r="29" fill="none" stroke="#4a463d" strokeWidth="3" />
      <circle cx="975" cy="312" r="8" fill="#1c1a16" />
    </svg>
  );
}
