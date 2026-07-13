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
        /**
         * The Lab · 5 Gatos (Brand House 2026). Los valores viven como
         * custom properties --lab-* en globals.css, scoped a la clase .lab
         * (light + prefers-color-scheme: dark). Solo para /5gatos y /login.
         */
        lab: {
          bg: "var(--lab-bg)",
          surface: "var(--lab-surface)",
          coconut: "var(--lab-coconut)",
          "coconut-deep": "var(--lab-coconut-deep)",
          ink: "var(--lab-ink)",
          "ink-strong": "var(--lab-ink-strong)",
          muted: "var(--lab-muted)",
          faint: "var(--lab-faint)",
          rule: "var(--lab-rule)",
          "rule-strong": "var(--lab-rule-strong)",
          petroleo: "var(--lab-petroleo)",
          accent: "var(--lab-accent)",
          teal: "var(--lab-teal)",
          "teal-soft": "var(--lab-teal-soft)",
          menta: "var(--lab-menta)",
          "menta-soft": "var(--lab-menta-soft)",
          salvia: "var(--lab-salvia)",
          ambar: "var(--lab-ambar)",
          terracota: "var(--lab-terracota)",
          "salvia-soft": "var(--lab-salvia-soft)",
          "ambar-soft": "var(--lab-ambar-soft)",
          "terracota-soft": "var(--lab-terracota-soft)",
        },
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
