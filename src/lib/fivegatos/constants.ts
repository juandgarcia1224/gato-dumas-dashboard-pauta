/**
 * Constantes del dashboard cliente 5 Gatos · Bucaramanga.
 */

/**
 * Benchmark de CPL en COP para el semáforo de campañas activas.
 * Verde  ≤ benchmark
 * Ámbar  ≤ benchmark × 1.5
 * Rojo   > benchmark × 1.5
 * Configurable vía env NEXT_PUBLIC_BENCHMARK_CPL_5GATOS (COP).
 */
export const BENCHMARK_CPL = Number(
  process.env.NEXT_PUBLIC_BENCHMARK_CPL_5GATOS ?? 25000,
);

export const BENCHMARK_CPL_WARN_FACTOR = 1.5;

export type Semaforo = "verde" | "amarillo" | "rojo" | "sin_datos";

export function semaforoCpl(cpl: number | null): Semaforo {
  if (cpl === null || !Number.isFinite(cpl) || cpl <= 0) return "sin_datos";
  if (cpl <= BENCHMARK_CPL) return "verde";
  if (cpl <= BENCHMARK_CPL * BENCHMARK_CPL_WARN_FACTOR) return "amarillo";
  return "rojo";
}

/** Cuenta publicitaria de 5 Gatos (Bucaramanga). */
export function getFiveGatosAccountId(): string {
  return (
    process.env.META_AD_ACCOUNT_GATO_BUCARAMANGA?.trim() || "act_248616958293893"
  );
}

/**
 * Token de Meta para la vista 5 Gatos.
 * Vercel: META_ACCESS_TOKEN_5GATOS (token permanente del System User).
 * Local:  META_ACCESS_TOKEN (token temporal de desarrollo).
 */
export function getFiveGatosToken(): string | null {
  const v =
    process.env.META_ACCESS_TOKEN_5GATOS?.trim() ||
    process.env.META_ACCESS_TOKEN?.trim();
  return v && v.length > 0 ? v : null;
}

export const COP_FORMAT = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export const INT_FORMAT = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

export function fmtCop(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return COP_FORMAT.format(v);
}

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return INT_FORMAT.format(v);
}

export function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${v.toLocaleString("es-CO", { maximumFractionDigits: 2 })}%`;
}

export const FECHA_FORMAT = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

/** Formatea una fecha ISO de Meta (ej. 2026-06-23T14:54:29-0500). */
export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return FECHA_FORMAT.format(d);
}

/** Días corridos desde `startIso` hasta ahora (mínimo 0), o null si no hay fecha. */
export function diasCorridos(startIso: string | null | undefined): number | null {
  if (!startIso) return null;
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return null;
  const diff = Date.now() - start;
  return Math.max(0, Math.floor(diff / 86_400_000));
}
