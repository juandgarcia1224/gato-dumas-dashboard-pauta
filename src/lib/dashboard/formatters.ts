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
