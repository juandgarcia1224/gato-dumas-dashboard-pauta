import type { Config } from "tailwindcss";

/**
 * Tailwind extendido con los tokens canónicos de Cloud Design
 * (handoff/DESIGN_TOKENS.json). Los valores reales viven como CSS custom
 * properties en globals.css (:root / [data-theme="dark"]); aquí los exponemos
 * a Tailwind vía var() para poder usar utilidades cuando convenga.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-deep": "var(--bg-deep)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        primary: "var(--brand-teal)",
        "primary-700": "var(--brand-teal-700)",
        secondary: "var(--brand-gray)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        crit: "var(--crit)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["var(--font-raleway)", "Raleway", "system-ui", "sans-serif"],
        display: ["var(--font-oswald)", "Oswald", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px",
        pill: "100px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(21, 24, 27, 0.04), 0 1px 2px rgba(21, 24, 27, 0.04)",
        raised: "0 4px 12px rgba(21, 24, 27, 0.08)",
        panel: "0 18px 50px rgba(21, 24, 27, 0.14)",
      },
      screens: {
        sm: "480px",
        md: "760px",
        lg: "1180px",
        xl: "1480px",
      },
    },
  },
  plugins: [],
};

export default config;
