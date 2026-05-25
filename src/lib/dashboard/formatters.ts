/**
 * Formateadores de presentación. La moneda de ambas cuentas Gato Dumas es COP.
 * Estos helpers son neutrales de diseño; Cloud Design puede reusarlos.
 */

const TZ = process.env.NEXT_PUBLIC_TIMEZONE || "America/Bogota";

export function formatCOP(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(
    value,
  );
}

export function formatDecimal(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Meta entrega ctr/percentajes ya en formato porcentaje (ej 1.23 = 1.23%). */
export function formatPercent(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${formatDecimal(value, digits)}%`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  }).format(d);
}

/** Premium: "lun, 25 may · 7:48 a. m." (hora Colombia). */
export function formatUpdatePremium(iso: string | null | undefined): string {
  if (!iso) return "Pendiente de sincronizar";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const fecha = new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(d);
  const hora = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  }).format(d);
  return `${fecha} · ${hora}`;
}

/** ¿El timestamp cae en el mismo día (zona Bogotá) que ahora? */
export function isSameBogotaDay(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(d) === fmt.format(new Date());
}

/** Fecha corta legible "25 may 2026" desde YYYY-MM-DD (sin hora). */
export function formatShortDate(ymd: string | null | undefined): string {
  if (!ymd) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(d);
}
