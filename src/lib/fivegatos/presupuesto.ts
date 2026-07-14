/**
 * Presupuesto planeado vs consumido — 5 Gatos · Bucaramanga.
 *
 * Módulo PURO y client-safe (sin googleapis, sin llamadas de red): lo
 * importan tanto la capa de datos del servidor como los componentes
 * "use client" del acordeón. Todos los montos en COP enteros (la cuenta
 * de 5 Gatos reporta budgets y spend sin offset de centavos; verificado
 * contra datos reales: daily_budget 35500 ≈ gasto de $35.500/día).
 *
 * Reglas (feedback del cliente):
 *   planeado   = lifetime_budget si existe; si no, daily_budget × días del
 *                rango (de la vida de la campaña o del mes activo).
 *   consumido  = spend del mes o spend lifetime según el modo.
 *   porcentaje = consumido / planeado × 100.
 *   restante   = planeado − consumido.
 *   ritmo      = consumido / días transcurridos.
 *   semáforo   : <70% verde · 70–90% ámbar · >90% rojo (>100% "Excedido").
 *   Sin budget en Meta (null/0 en ambos) → fuente "n/a" y la UI muestra
 *   "Presupuesto no configurado" sin barra.
 */

export type PresupuestoFuente = "lifetime_budget" | "daily_budget" | "n/a";

export type PresupuestoSemaforo = "verde" | "ambar" | "rojo" | "na";

export interface PresupuestoInfo {
  /** COP planeados para el rango, o null si Meta no reporta budget. */
  planeado: number | null;
  /** COP consumidos en el rango (spend de Meta). */
  consumido: number;
  /** planeado − consumido (puede ser negativo = excedido), o null. */
  restante: number | null;
  /** consumido / planeado × 100, o null sin plan. */
  porcentaje: number | null;
  /** consumido / días transcurridos del rango, o null. */
  ritmoDiario: number | null;
  semaforo: PresupuestoSemaforo;
  fuente: PresupuestoFuente;
}

/** Presupuesto en ambos modos, calculado una vez en el servidor. */
export interface PresupuestoModos {
  /** Base: mes seleccionado. */
  mes: PresupuestoInfo;
  /** Base: toda la vida de la campaña/adset. */
  vida: PresupuestoInfo;
}

export type ModoPresupuesto = keyof PresupuestoModos;

const DAY_MS = 86_400_000;

/** Meta manda "0" como placeholder cuando el budget no aplica. */
export function budgetOrNull(v: number | null | undefined): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Fecha ISO válida y creíble, o null. Meta reporta epoch (1969) como
 * start_time en algunas campañas CBO: se descarta como "sin fecha".
 */
export function fechaCreible(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getUTCFullYear() < 2000) return null;
  return d;
}

/** Días calendario inclusivos entre dos fechas (mínimo 0 si b < a). */
export function diasInclusivos(a: Date, b: Date): number {
  const diff = Math.floor((b.getTime() - a.getTime()) / DAY_MS);
  return diff < 0 ? 0 : diff + 1;
}

export interface RangoPlan {
  /** Días que cubre el plan (para daily_budget × días). */
  diasPlan: number | null;
  /** Días ya transcurridos del rango (para el ritmo diario). */
  diasTranscurridos: number | null;
}

/**
 * Rango del plan en modo VIDA: del inicio real hasta el fin programado
 * (si hay end) o hasta hoy (si corre "hasta que se pause").
 */
export function rangoVida(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  hoy: Date = new Date(),
): RangoPlan {
  const start = fechaCreible(startIso);
  if (!start) return { diasPlan: null, diasTranscurridos: null };
  const end = fechaCreible(endIso);
  const finPlan = end ?? hoy;
  const finTranscurrido = end && end < hoy ? end : hoy;
  return {
    diasPlan: Math.max(1, diasInclusivos(start, finPlan)),
    diasTranscurridos: Math.max(1, diasInclusivos(start, finTranscurrido)),
  };
}

/**
 * Rango del plan en modo MES: solapamiento del schedule del adset/campaña
 * con el mes seleccionado. `monthSince`/`monthUntil` en YYYY-MM-DD
 * (monthUntil ya viene recortado a hoy si es el mes en curso).
 */
export function rangoMes(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  monthSince: string,
  monthUntil: string,
): RangoPlan {
  const mIni = new Date(`${monthSince}T00:00:00Z`);
  const mFin = new Date(`${monthUntil}T00:00:00Z`);
  const start = fechaCreible(startIso);
  const end = fechaCreible(endIso);
  // Normaliza a fecha (sin hora) en UTC para contar días calendario.
  const dia = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const desde = start && dia(start) > mIni ? dia(start) : mIni;
  const hasta = end && dia(end) < mFin ? dia(end) : mFin;
  const dias = diasInclusivos(desde, hasta);
  if (dias === 0) return { diasPlan: 0, diasTranscurridos: 0 };
  return { diasPlan: dias, diasTranscurridos: dias };
}

export interface PlanInput {
  lifetimeBudget: number | null;
  dailyBudget: number | null;
  /** Días del rango para daily_budget × días (null = no calculable). */
  diasPlan: number | null;
}

/** COP planeados + fuente, según la regla lifetime > daily × días. */
export function planeadoDe(input: PlanInput): {
  planeado: number | null;
  fuente: PresupuestoFuente;
} {
  const lifetime = budgetOrNull(input.lifetimeBudget);
  if (lifetime !== null) return { planeado: lifetime, fuente: "lifetime_budget" };
  const daily = budgetOrNull(input.dailyBudget);
  if (daily !== null && input.diasPlan !== null && input.diasPlan > 0) {
    return { planeado: daily * input.diasPlan, fuente: "daily_budget" };
  }
  return { planeado: null, fuente: "n/a" };
}

export function semaforoPresupuesto(
  porcentaje: number | null,
): PresupuestoSemaforo {
  if (porcentaje === null || !Number.isFinite(porcentaje)) return "na";
  if (porcentaje < 70) return "verde";
  if (porcentaje <= 90) return "ambar";
  return "rojo";
}

/** Arma el PresupuestoInfo final a partir de plan + consumo + días. */
export function buildPresupuesto(
  planeado: number | null,
  fuente: PresupuestoFuente,
  consumido: number,
  diasTranscurridos: number | null,
): PresupuestoInfo {
  const gasto = Number.isFinite(consumido) && consumido > 0 ? consumido : 0;
  const ritmoDiario =
    diasTranscurridos !== null && diasTranscurridos > 0
      ? gasto / diasTranscurridos
      : null;
  if (planeado === null || planeado <= 0) {
    return {
      planeado: null,
      consumido: gasto,
      restante: null,
      porcentaje: null,
      ritmoDiario,
      semaforo: "na",
      fuente: "n/a",
    };
  }
  const porcentaje = (gasto / planeado) * 100;
  return {
    planeado,
    consumido: gasto,
    restante: planeado - gasto,
    porcentaje,
    ritmoDiario,
    semaforo: semaforoPresupuesto(porcentaje),
    fuente,
  };
}

/**
 * Suma presupuestos de adsets para el total de una campaña SIN CBO.
 * La fuente agregada es la de mayor aporte al planeado (el type solo
 * admite una); si ningún adset tiene budget → n/a.
 */
export function sumarPlaneados(
  partes: { planeado: number | null; fuente: PresupuestoFuente }[],
): { planeado: number | null; fuente: PresupuestoFuente } {
  let total = 0;
  let deLifetime = 0;
  let deDaily = 0;
  let hayPlan = false;
  for (const p of partes) {
    if (p.planeado === null || p.planeado <= 0) continue;
    hayPlan = true;
    total += p.planeado;
    if (p.fuente === "lifetime_budget") deLifetime += p.planeado;
    if (p.fuente === "daily_budget") deDaily += p.planeado;
  }
  if (!hayPlan) return { planeado: null, fuente: "n/a" };
  return {
    planeado: total,
    fuente: deLifetime >= deDaily ? "lifetime_budget" : "daily_budget",
  };
}
