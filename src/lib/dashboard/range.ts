/**
 * Helpers de rangos de fecha para el histórico diario.
 * Todo en strings YYYY-MM-DD (zona América/Bogotá para "hoy").
 */

const TZ = "America/Bogota";

export function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parse(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function fmt(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}
export function addDays(ymd: string, n: number): string {
  const dt = parse(ymd);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmt(dt);
}
export function monthStart(ym: string): string {
  return `${ym.slice(0, 7)}-01`;
}
export function monthEnd(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return fmt(new Date(Date.UTC(y, m, 0)));
}
export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_ES[m - 1]} ${y}`;
}

export type RangeKind = "month" | "preset" | "custom";

export interface ResolvedRange {
  key: string;
  label: string;
  start: string;
  stop: string;
  kind: RangeKind;
  month?: string; // si kind === 'month'
}

const PRESET_LABELS: Record<string, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  last_7d: "Últimos 7 días",
  this_month: "Mes actual",
};

/** Convierte un key de rango (+fechas custom) en fechas concretas. */
export function resolveRange(
  key: string,
  dateStart: string | undefined,
  dateStop: string | undefined,
  today: string,
): ResolvedRange | null {
  if (key === "today") {
    return { key, label: "Hoy", start: today, stop: today, kind: "preset" };
  }
  if (key === "yesterday") {
    const y = addDays(today, -1);
    return { key, label: "Ayer", start: y, stop: y, kind: "preset" };
  }
  if (key === "last_7d") {
    return { key, label: "Últimos 7 días", start: addDays(today, -6), stop: today, kind: "preset" };
  }
  if (key === "this_month") {
    const ym = today.slice(0, 7);
    return { key, label: "Mes actual", start: monthStart(ym), stop: today, kind: "month", month: ym };
  }
  if (/^\d{4}-\d{2}$/.test(key)) {
    const start = monthStart(key);
    const isCurrent = key === today.slice(0, 7);
    const stop = isCurrent ? today : monthEnd(key);
    return { key, label: monthLabel(key), start, stop, kind: "month", month: key };
  }
  if (key === "custom") {
    if (!dateStart || !dateStop || dateStart > dateStop) return null;
    return { key, label: `${dateStart} – ${dateStop}`, start: dateStart, stop: dateStop, kind: "custom" };
  }
  void PRESET_LABELS;
  return null;
}

/** ¿El rango resuelto es un mes calendario completo (apto para pacing mensual)? */
export function isMonthRange(r: ResolvedRange): boolean {
  return r.kind === "month";
}
