import type { Metadata } from "next";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastFromQuery } from "@/components/toast-from-query";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driver Planning System",
  description: "MVP planning app for manager and drivers",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme') || 'system';
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored === 'dark' || (stored === 'system' && systemDark);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Suspense fallback={null}>
            <ToastFromQuery />
          </Suspense>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
