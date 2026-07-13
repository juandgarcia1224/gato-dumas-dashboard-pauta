/**
 * Capa de datos del dashboard cliente 5 Gatos · Bucaramanga — NIVEL ADSET.
 *
 * Modelo de Juan (agencia): 1 adset = 1 curso o programa. Las campañas son
 * contenedores; el dashboard clasifica y agrupa ADSETS.
 *
 * Lee Meta (SOLO lectura):
 *   - edge /adsets → metadatos (campaña padre, fechas, presupuestos, estado)
 *   - insights level=adset del mes seleccionado (y del mes anterior)
 *   - insights level=adset date_preset=maximum → gasto LIFETIME desde el
 *     inicio real de cada adset
 * Aplica el mapeo curso↔adset y produce el viewmodel de /5gatos y del
 * export XLSX. Cachea 10 min por mes (unstable_cache).
 */

import { unstable_cache } from "next/cache";
import { MetaClient } from "../meta/client";
import {
  activeAdsets,
  fetchAdsetInsightsLifetime,
  fetchAdsetInsightsRange,
  fetchAdsetsMeta,
  type AdsetInsight,
  type AdsetMeta,
} from "../meta/adsets";
import { interpretResult } from "../meta/transform";
import {
  loadMapping,
  matchAdsetAgainstRules,
  recordUnclassified,
} from "../mapping/courses";
import type { MappingRule, MappingTipo } from "../mapping/types";
import { getFiveGatosAccountId, getFiveGatosToken, semaforoCpl, type Semaforo } from "./constants";

// ---------------------------------------------------------------------------
// Tipos del viewmodel
// ---------------------------------------------------------------------------

export interface AdsetStats {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  tipo: MappingTipo | null;
  nombre_normalizado: string | null;
  status: string;
  effective_status: string;
  /** ISO de Meta (con offset) o null si Meta no lo reporta. */
  start_time: string | null;
  /** null = sin fecha fin ("hasta que se pause"). */
  end_time: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  // ── Métricas del MES seleccionado ──
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  leads: number;
  cpl: number | null;
  results_type: string;
  semaforo: Semaforo;
  // ── Métricas LIFETIME (desde el inicio real del adset) ──
  spend_lifetime: number;
  leads_lifetime: number;
  cpl_lifetime: number | null;
}

export interface GroupSummaryRow {
  nombre: string;
  tipo: MappingTipo;
  /** Inversión del mes seleccionado. */
  inversion: number;
  /** Inversión acumulada desde el inicio de los adsets del grupo. */
  inversionLifetime: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number | null;
  /** Total de adsets del grupo con actividad en el mes. */
  adsets: number;
  /** Adsets del grupo activos hoy (effective_status=ACTIVE). */
  adsetsActivos: number;
}

export interface KpiBlock {
  inversion: number;
  leads: number;
  cpl: number | null;
  adsetsActivos: number;
  /** Gasto lifetime acumulado de los adsets activos hoy. */
  inversionLifetimeActivos: number;
}

export interface FiveGatosMonthData {
  month: string; // YYYY-MM
  dateStart: string;
  dateStop: string;
  updatedAt: string;
  kpis: KpiBlock;
  kpisPrev: KpiBlock | null;
  cursos: GroupSummaryRow[];
  programas: GroupSummaryRow[];
  /** Adsets activos AHORA (effective_status=ACTIVE), con lifetime. */
  activos: AdsetStats[];
  sinClasificar: AdsetStats[];
  /** Todos los adsets con actividad en el mes (para el XLSX). */
  adsets: AdsetStats[];
}

export type FiveGatosResult =
  | { ok: true; data: FiveGatosMonthData }
  | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Fechas (zona America/Bogota)
// ---------------------------------------------------------------------------

export function currentMonthBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export function isValidMonth(m: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
}

/** Rango de un mes YYYY-MM, recortado a hoy si es el mes en curso. */
export function monthRange(month: string): { since: string; until: string } {
  const [y, m] = month.split("-").map(Number);
  const since = `${month}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const todayIso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
  }).format(new Date());
  let until = `${month}-${String(lastDay).padStart(2, "0")}`;
  if (until > todayIso) until = todayIso;
  return { since, until };
}

export function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Lista de meses seleccionables (mes en curso hacia atrás). */
export function monthOptions(count = 12): string[] {
  const out: string[] = [];
  let m = currentMonthBogota();
  for (let i = 0; i < count; i++) {
    out.push(m);
    m = previousMonth(m);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Construcción de stats por adset
// ---------------------------------------------------------------------------

function toNum(v: string | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function toNumOrNull(v: string | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface LifetimeAgg {
  spend: number;
  leads: number;
  cpl: number | null;
}

function lifetimeOf(row: AdsetInsight | undefined): LifetimeAgg {
  if (!row) return { spend: 0, leads: 0, cpl: null };
  const spend = toNum(row.spend);
  const result = interpretResult(row.actions, row.cost_per_action_type, spend);
  const leads = result.results ?? 0;
  return { spend, leads, cpl: leads > 0 ? spend / leads : null };
}

function buildAdsetStats(
  adsetId: string,
  monthRow: AdsetInsight | undefined,
  lifetimeRow: AdsetInsight | undefined,
  meta: AdsetMeta | undefined,
  rules: MappingRule[],
): AdsetStats {
  const name =
    meta?.name ?? monthRow?.adset_name ?? lifetimeRow?.adset_name ?? "";
  const spend = toNum(monthRow?.spend);
  const result = interpretResult(
    monthRow?.actions,
    monthRow?.cost_per_action_type,
    spend,
  );
  const leads = result.results ?? 0;
  const cpl = leads > 0 ? spend / leads : null;
  const life = lifetimeOf(lifetimeRow);
  const match = matchAdsetAgainstRules(rules, name, adsetId);

  return {
    adset_id: adsetId,
    adset_name: name,
    campaign_id:
      meta?.campaign?.id ??
      meta?.campaign_id ??
      monthRow?.campaign_id ??
      lifetimeRow?.campaign_id ??
      "",
    campaign_name:
      meta?.campaign?.name ??
      monthRow?.campaign_name ??
      lifetimeRow?.campaign_name ??
      "",
    tipo: match?.tipo ?? null,
    nombre_normalizado: match?.nombre_normalizado ?? null,
    status: meta?.status ?? "",
    effective_status: meta?.effective_status ?? "",
    start_time: meta?.start_time ?? null,
    end_time: meta?.end_time ?? null,
    daily_budget: toNumOrNull(meta?.daily_budget),
    lifetime_budget: toNumOrNull(meta?.lifetime_budget),
    spend,
    impressions: toNum(monthRow?.impressions),
    clicks: toNum(monthRow?.clicks),
    ctr: toNum(monthRow?.ctr),
    cpc: monthRow?.cpc ? toNum(monthRow.cpc) : null,
    cpm: monthRow?.cpm ? toNum(monthRow.cpm) : null,
    leads,
    cpl,
    results_type: result.results_type,
    semaforo: semaforoCpl(cpl),
    spend_lifetime: life.spend,
    leads_lifetime: life.leads,
    cpl_lifetime: life.cpl,
  };
}

function groupByNombre(
  adsets: AdsetStats[],
  tipo: MappingTipo,
): GroupSummaryRow[] {
  const map = new Map<string, GroupSummaryRow>();
  for (const a of adsets) {
    if (a.tipo !== tipo || !a.nombre_normalizado) continue;
    const g = map.get(a.nombre_normalizado) ?? {
      nombre: a.nombre_normalizado,
      tipo,
      inversion: 0,
      inversionLifetime: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      cpl: null,
      adsets: 0,
      adsetsActivos: 0,
    };
    g.inversion += a.spend;
    g.inversionLifetime += a.spend_lifetime;
    g.impressions += a.impressions;
    g.clicks += a.clicks;
    g.leads += a.leads;
    g.adsets += 1;
    if (a.effective_status === "ACTIVE") g.adsetsActivos += 1;
    map.set(a.nombre_normalizado, g);
  }
  const rows = [...map.values()].map((g) => ({
    ...g,
    cpl: g.leads > 0 ? g.inversion / g.leads : null,
  }));
  rows.sort((a, b) => b.inversion - a.inversion);
  return rows;
}

function kpisOf(adsets: AdsetStats[]): KpiBlock {
  const inversion = adsets.reduce((s, a) => s + a.spend, 0);
  const leads = adsets.reduce((s, a) => s + a.leads, 0);
  const activos = adsets.filter((a) => a.effective_status === "ACTIVE");
  return {
    inversion,
    leads,
    cpl: leads > 0 ? inversion / leads : null,
    adsetsActivos: activos.length,
    inversionLifetimeActivos: activos.reduce((s, a) => s + a.spend_lifetime, 0),
  };
}

/** Versión sin caché (scripts/diagnóstico). En la app usa getFiveGatosMonth. */
export async function fetchFiveGatosMonthUncached(
  month: string,
): Promise<FiveGatosMonthData> {
  const token = getFiveGatosToken();
  if (!token) {
    throw new Error(
      "META_ACCESS_TOKEN_5GATOS / META_ACCESS_TOKEN no configurado.",
    );
  }
  const accountId = getFiveGatosAccountId();
  const client = new MetaClient({
    token,
    apiVersion: process.env.META_API_VERSION?.trim() || "v22.0",
  });

  const { since, until } = monthRange(month);
  const prev = monthRange(previousMonth(month));

  // 4 llamadas a Meta (todas SOLO lectura, con retry por rate limit):
  const [rules, adsetsMeta, monthMap, prevMap, lifetimeMap] = await Promise.all([
    loadMapping(),
    fetchAdsetsMeta(client, accountId),
    fetchAdsetInsightsRange(client, accountId, since, until),
    fetchAdsetInsightsRange(client, accountId, prev.since, prev.until).catch(
      () => null,
    ),
    fetchAdsetInsightsLifetime(client, accountId),
  ]);

  // Universo del mes: adsets con actividad en el mes ∪ adsets activos hoy
  // (un adset recién lanzado sin gasto también debe aparecer en las cards).
  const ids = new Set<string>(monthMap.keys());
  for (const a of activeAdsets(adsetsMeta)) ids.add(a.id);

  const adsets = [...ids].map((id) =>
    buildAdsetStats(id, monthMap.get(id), lifetimeMap.get(id), adsetsMeta.get(id), rules),
  );

  // KPIs del mes anterior (para los deltas).
  let kpisPrev: KpiBlock | null = null;
  if (prevMap) {
    const prevStats = [...prevMap.keys()].map((id) =>
      buildAdsetStats(id, prevMap.get(id), lifetimeMap.get(id), adsetsMeta.get(id), rules),
    );
    kpisPrev = kpisOf(prevStats);
  }

  const sinClasificar = adsets.filter(
    (a) => a.tipo === null && (a.spend > 0 || a.effective_status === "ACTIVE"),
  );

  // Registrar sin-clasificar en el Sheet (fire-and-forget, con throttle).
  void Promise.allSettled(
    sinClasificar.map((a) =>
      recordUnclassified({
        adset_id: a.adset_id,
        adset_name: a.adset_name,
        campaign_id: a.campaign_id,
        campaign_name: a.campaign_name,
        account_id: accountId,
        status: a.effective_status || a.status,
      }),
    ),
  );

  const activos = adsets
    .filter((a) => a.effective_status === "ACTIVE")
    .sort((a, b) => b.spend_lifetime - a.spend_lifetime);

  return {
    month,
    dateStart: since,
    dateStop: until,
    updatedAt: new Date().toISOString(),
    kpis: kpisOf(adsets),
    kpisPrev,
    cursos: groupByNombre(adsets, "Curso"),
    programas: groupByNombre(adsets, "Programa"),
    activos,
    sinClasificar,
    adsets,
  };
}

const REVALIDATE_SECONDS = 10 * 60;

/**
 * Datos del mes con caché de 10 min. Nunca lanza hacia la UI:
 * devuelve { ok:false } con mensaje interno (la página muestra un
 * mensaje amable, jamás el stack trace).
 */
export async function getFiveGatosMonth(month: string): Promise<FiveGatosResult> {
  const safeMonth = isValidMonth(month) ? month : currentMonthBogota();
  try {
    let data: FiveGatosMonthData;
    try {
      const cached = unstable_cache(
        () => fetchFiveGatosMonthUncached(safeMonth),
        ["5gatos-month-adsets", safeMonth],
        { revalidate: REVALIDATE_SECONDS, tags: ["5gatos-data"] },
      );
      data = await cached();
    } catch (err) {
      // Fuera del runtime de Next (scripts/tests) unstable_cache no tiene
      // incrementalCache: caemos a la lectura directa. Cualquier otro error
      // (Meta, token) NO se reintenta: sube al catch externo.
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("incrementalCache")) throw err;
      data = await fetchFiveGatosMonthUncached(safeMonth);
    }
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[5gatos] Error trayendo datos de ${safeMonth}:`, msg);
    return { ok: false, error: msg };
  }
}
