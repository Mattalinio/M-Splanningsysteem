import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dhl: "var(--dhl)",
        dragonfly: "var(--dragonfly)",
      },
    },
  },
};

export default config;
