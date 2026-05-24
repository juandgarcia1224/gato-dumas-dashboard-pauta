import type { Config } from "tailwindcss";

/**
 * Configuración base de Tailwind.
 *
 * NOTA PARA CLOUD DESIGN:
 * Los tokens de color/tipografía aquí son provisionales (neutros).
 * El sistema visual final se define en el handoff. Reemplazar `colors.brand`
 * y extender `theme` sin tocar la estructura de componentes.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Placeholder neutral — sustituir con tokens de Cloud Design.
        brand: {
          DEFAULT: "#1f2937",
          muted: "#6b7280",
          surface: "#f9fafb",
        },
        status: {
          ok: "#16a34a",
          warning: "#d97706",
          critical: "#dc2626",
          neutral: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
