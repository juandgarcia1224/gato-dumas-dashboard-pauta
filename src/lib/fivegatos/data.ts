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
  ADSET_FIELDS,
  fetchAdsetInsightsLifetime,
  fetchAdsetInsightsRange,
  fetchAdsetsMeta,
  withRateLimitRetry,
  type AdsetInsight,
  type AdsetMeta,
} from "../meta/adsets";
import {
  creativeBody,
  creativeCta,
  creativeImage,
  creativeTitle,
  fetchAdInsightsRange,
  fetchAdsOfAdset,
  type AdInsight,
  type AdMeta,
} from "../meta/ads";
import {
  dedupeCursosVigentes,
  mejorMatchCurso,
} from "../dashboard/programacion-cross";
import { fetchCampaignsMeta, type CampaignMeta } from "../meta/campaigns";
import {
  budgetOrNull,
  buildPresupuesto,
  diasInclusivos,
  fechaCreible,
  planeadoDe,
  rangoMes,
  rangoVida,
  sumarPlaneados,
  type PresupuestoModos,
} from "./presupuesto";
import {
  readProgramacion,
  type Curso,
  type EstadoCurso,
} from "../sheets/programacion-gato-bga";
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
  /** Personas únicas alcanzadas en el mes. */
  reach: number;
  /**
   * Frecuencia del mes (impresiones ÷ alcance): promedio de veces que cada
   * persona vio la pauta. null si el adset no tuvo entrega en el período.
   */
  frequency: number | null;
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

/**
 * Frecuencia de una entidad: preferimos la `frequency` que reporta Meta;
 * si no viene, la calculamos como impresiones ÷ alcance. null si no hubo
 * entrega (sin alcance) en el período.
 */
export function frecuenciaDe(
  metaFrequency: number | null,
  impressions: number,
  reach: number,
): number | null {
  if (metaFrequency !== null && metaFrequency > 0) return metaFrequency;
  if (reach > 0 && impressions > 0) return impressions / reach;
  return null;
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
    reach: toNum(monthRow?.reach),
    frequency: frecuenciaDe(
      toNumOrNull(monthRow?.frequency),
      toNum(monthRow?.impressions),
      toNum(monthRow?.reach),
    ),
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
function buildMetaClient(): { client: MetaClient; accountId: string } {
  const token = getFiveGatosToken();
  if (!token) {
    throw new Error(
      "META_ACCESS_TOKEN_5GATOS / META_ACCESS_TOKEN no configurado.",
    );
  }
  return {
    client: new MetaClient({
      token,
      apiVersion: process.env.META_API_VERSION?.trim() || "v22.0",
    }),
    accountId: getFiveGatosAccountId(),
  };
}

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

// ---------------------------------------------------------------------------
// NIVEL CAMPAÑA — agrupación de adsets por campaña padre (drill-down nivel 1)
// ---------------------------------------------------------------------------

export interface CampaignStats {
  campaign_id: string;
  campaign_name: string;
  /** ACTIVE si al menos un adset de la campaña está activo hoy. */
  effective_status: "ACTIVE" | "PAUSED";
  adsetsTotal: number;
  adsetsActivos: number;
  // Métricas del mes seleccionado (suma de sus adsets)
  spend: number;
  spend_lifetime: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number | null;
  semaforo: Semaforo;
}

/**
 * Agrupa AdsetStats por campaña padre y suma métricas del mes.
 * Pura: no llama red. Ordena por inversión del mes desc.
 */
export function agruparPorCampana(adsets: AdsetStats[]): CampaignStats[] {
  const map = new Map<string, CampaignStats>();
  for (const a of adsets) {
    const id = a.campaign_id || "sin-campana";
    const g = map.get(id) ?? {
      campaign_id: id,
      campaign_name: a.campaign_name || "(Sin nombre de campaña)",
      effective_status: "PAUSED" as const,
      adsetsTotal: 0,
      adsetsActivos: 0,
      spend: 0,
      spend_lifetime: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      cpl: null,
      semaforo: "sin_datos" as Semaforo,
    };
    g.adsetsTotal += 1;
    if (a.effective_status === "ACTIVE") g.adsetsActivos += 1;
    g.spend += a.spend;
    g.spend_lifetime += a.spend_lifetime;
    g.impressions += a.impressions;
    g.clicks += a.clicks;
    g.leads += a.leads;
    if (a.campaign_name && g.campaign_name === "(Sin nombre de campaña)") {
      g.campaign_name = a.campaign_name;
    }
    map.set(id, g);
  }
  const rows = [...map.values()].map((g) => {
    const cpl = g.leads > 0 ? g.spend / g.leads : null;
    return {
      ...g,
      effective_status: (g.adsetsActivos > 0 ? "ACTIVE" : "PAUSED") as
        | "ACTIVE"
        | "PAUSED",
      cpl,
      semaforo: semaforoCpl(cpl),
    };
  });
  rows.sort((a, b) => b.spend - a.spend);
  return rows;
}

export interface CampanasMonthData {
  month: string;
  dateStart: string;
  dateStop: string;
  updatedAt: string;
  kpis: KpiBlock;
  kpisPrev: KpiBlock | null;
  campanas: CampaignStats[];
  sinClasificar: AdsetStats[];
}

export type CampanasResult =
  | { ok: true; data: CampanasMonthData }
  | { ok: false; error: string };

/**
 * Listado de CAMPAÑAS del mes con métricas agregadas de sus adsets.
 * Reusa el viewmodel cacheado de getFiveGatosMonth (no agrega llamadas a Meta).
 */
export async function getCampanas(month: string): Promise<CampanasResult> {
  const result = await getFiveGatosMonth(month);
  if (!result.ok) return result;
  const d = result.data;
  return {
    ok: true,
    data: {
      month: d.month,
      dateStart: d.dateStart,
      dateStop: d.dateStop,
      updatedAt: d.updatedAt,
      kpis: d.kpis,
      kpisPrev: d.kpisPrev,
      campanas: agruparPorCampana(d.adsets),
      sinClasificar: d.sinClasificar,
    },
  };
}

// ---------------------------------------------------------------------------
// CAMPAÑAS ACTIVAS (vista acordeón v2) — cada campaña con presupuesto
// planeado vs consumido (modo mes / vida) y sus adsets con curso del Excel.
// Todo se resuelve en UNA pasada: viewmodel cacheado + 1 llamada a
// /campaigns (cacheada) + 1 lectura del Sheet de programación. Sin N+1.
// ---------------------------------------------------------------------------

/** Etiquetas ES de los objetivos de Meta (ODAX y legacy más comunes). */
const OBJETIVO_LABEL: Record<string, string> = {
  OUTCOME_LEADS: "Leads",
  OUTCOME_SALES: "Ventas",
  OUTCOME_ENGAGEMENT: "Interacción",
  OUTCOME_TRAFFIC: "Tráfico",
  OUTCOME_AWARENESS: "Reconocimiento",
  OUTCOME_APP_PROMOTION: "Promoción de app",
  LEAD_GENERATION: "Leads",
  CONVERSIONS: "Conversiones",
  MESSAGES: "Mensajes",
  LINK_CLICKS: "Tráfico",
};

function objetivoLabel(objective: string | undefined): string | null {
  if (!objective) return null;
  const known = OBJETIVO_LABEL[objective];
  if (known) return known;
  const plano = objective
    .replace(/^OUTCOME_/, "")
    .replace(/_/g, " ")
    .toLowerCase();
  return plano.charAt(0).toUpperCase() + plano.slice(1);
}

async function fetchCampaignsMetaUncached(): Promise<CampaignMeta[]> {
  const { client, accountId } = buildMetaClient();
  const map = await fetchCampaignsMeta(client, accountId);
  return [...map.values()];
}

/**
 * Metadatos de campañas (objective + CBO + fechas), cacheados 10 min.
 * Nunca lanza: si Meta falla, la vista degrada (sin objetivo ni CBO).
 */
async function getCampaignsMetaSafe(): Promise<Map<string, CampaignMeta>> {
  try {
    let rows: CampaignMeta[];
    try {
      const cached = unstable_cache(
        fetchCampaignsMetaUncached,
        ["5gatos-campaigns-meta"],
        { revalidate: REVALIDATE_SECONDS, tags: ["5gatos-data"] },
      );
      rows = await cached();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("incrementalCache")) throw err;
      rows = await fetchCampaignsMetaUncached();
    }
    return new Map(rows.map((r) => [r.id, r]));
  } catch (err) {
    console.error(
      "[5gatos] Metadatos de campañas no disponibles:",
      err instanceof Error ? err.message : err,
    );
    return new Map();
  }
}

/** Adset del acordeón: stats + curso del Excel + presupuesto en ambos modos. */
export interface AdsetConCurso extends AdsetStats {
  curso: CursoInfo | null;
  presupuesto: PresupuestoModos;
}

export interface CampanaActiva {
  campaign_id: string;
  campaign_name: string;
  /** ACTIVE si al menos un adset está activo hoy. */
  effective_status: "ACTIVE" | "PAUSED";
  /** Objetivo de la campaña en español ("Leads", "Ventas"…), o null. */
  objetivo: string | null;
  /**
   * Inicio real de la pauta (ISO): start_time creíble de Meta o, si la
   * campaña reporta epoch 1969, el menor start_time de sus adsets.
   */
  start_time: string | null;
  /**
   * Frecuencia del mes: Σ impresiones ÷ Σ alcance de sus adsets (Meta no se
   * consulta con insights level=campaign en esta vista; el alcance sumado
   * puede sobreestimar levemente los únicos si hay solape entre adsets).
   * null si la campaña no tuvo entrega en el período.
   */
  frequency: number | null;
  adsetsTotal: number;
  adsetsActivos: number;
  // Métricas del mes seleccionado (suma de sus adsets)
  spend: number;
  spend_lifetime: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  cpc: number | null;
  leads: number;
  cpl: number | null;
  semaforo: Semaforo;
  presupuesto: PresupuestoModos;
  /** Adsets ordenados por inversión del mes desc. */
  adsets: AdsetConCurso[];
}

export interface CampanasActivasData {
  month: string;
  dateStart: string;
  dateStop: string;
  updatedAt: string;
  kpis: KpiBlock;
  kpisPrev: KpiBlock | null;
  /** Campañas con ≥1 adset ACTIVE, por inversión del mes desc. */
  activas: CampanaActiva[];
  /** Resto (100% pausadas), solo se muestran opt-in. */
  pausadas: CampanaActiva[];
  /**
   * Total planeado/consumido/restante del MES de las campañas activas
   * (para el KPI global). null si ninguna reporta presupuesto.
   */
  presupuestoMes: {
    planeado: number | null;
    consumido: number;
    restante: number | null;
  };
  sinClasificar: AdsetStats[];
}

export type CampanasActivasResult =
  | { ok: true; data: CampanasActivasData }
  | { ok: false; error: string };

/** Presupuesto de UN adset en ambos modos (mes seleccionado y vida). */
function presupuestoAdset(
  a: AdsetStats,
  monthSince: string,
  monthUntil: string,
  hoy: Date,
): PresupuestoModos {
  const rVida = rangoVida(a.start_time, a.end_time, hoy);
  const planVida = planeadoDe({
    lifetimeBudget: a.lifetime_budget,
    dailyBudget: a.daily_budget,
    diasPlan: rVida.diasPlan,
  });
  const rMes = rangoMes(a.start_time, a.end_time, monthSince, monthUntil);
  const planMes = planeadoDe({
    lifetimeBudget: a.lifetime_budget,
    dailyBudget: a.daily_budget,
    diasPlan: rMes.diasPlan,
  });
  return {
    mes: buildPresupuesto(planMes.planeado, planMes.fuente, a.spend, rMes.diasTranscurridos),
    vida: buildPresupuesto(planVida.planeado, planVida.fuente, a.spend_lifetime, rVida.diasTranscurridos),
  };
}

/**
 * Presupuesto de una campaña: si tiene CBO (budget a nivel campaña) manda
 * el CBO; si no, suma los presupuestos de sus adsets.
 */
function presupuestoCampana(
  meta: CampaignMeta | undefined,
  adsets: AdsetConCurso[],
  monthSince: string,
  monthUntil: string,
  hoy: Date,
): PresupuestoModos {
  const spendMes = adsets.reduce((s, a) => s + a.spend, 0);
  const spendVida = adsets.reduce((s, a) => s + a.spend_lifetime, 0);

  // Rango de la campaña: start_time creíble de Meta o el menor start de
  // sus adsets (algunas campañas CBO reportan epoch 1969).
  const startsAdsets = adsets
    .map((a) => fechaCreible(a.start_time))
    .filter((d): d is Date => d !== null);
  const startCamp =
    fechaCreible(meta?.start_time) ??
    (startsAdsets.length > 0
      ? new Date(Math.min(...startsAdsets.map((d) => d.getTime())))
      : null);
  const endCamp = fechaCreible(meta?.stop_time);

  const rVida = rangoVida(
    startCamp ? startCamp.toISOString() : null,
    endCamp ? endCamp.toISOString() : null,
    hoy,
  );
  const rMes = rangoMes(
    startCamp ? startCamp.toISOString() : null,
    endCamp ? endCamp.toISOString() : null,
    monthSince,
    monthUntil,
  );
  // Ritmo del mes: días del mes con la campaña al aire (fallback: días del rango).
  const diasMes =
    rMes.diasTranscurridos && rMes.diasTranscurridos > 0
      ? rMes.diasTranscurridos
      : diasInclusivos(
          new Date(`${monthSince}T00:00:00Z`),
          new Date(`${monthUntil}T00:00:00Z`),
        );

  const cboLifetime = budgetOrNull(toNumOrNull(meta?.lifetime_budget));
  const cboDaily = budgetOrNull(toNumOrNull(meta?.daily_budget));

  if (cboLifetime !== null || cboDaily !== null) {
    const planVida = planeadoDe({
      lifetimeBudget: cboLifetime,
      dailyBudget: cboDaily,
      diasPlan: rVida.diasPlan,
    });
    const planMes = planeadoDe({
      lifetimeBudget: cboLifetime,
      dailyBudget: cboDaily,
      diasPlan: rMes.diasPlan,
    });
    return {
      mes: buildPresupuesto(planMes.planeado, planMes.fuente, spendMes, diasMes),
      vida: buildPresupuesto(planVida.planeado, planVida.fuente, spendVida, rVida.diasTranscurridos),
    };
  }

  const planMes = sumarPlaneados(adsets.map((a) => a.presupuesto.mes));
  const planVida = sumarPlaneados(adsets.map((a) => a.presupuesto.vida));
  return {
    mes: buildPresupuesto(planMes.planeado, planMes.fuente, spendMes, diasMes),
    vida: buildPresupuesto(planVida.planeado, planVida.fuente, spendVida, rVida.diasTranscurridos),
  };
}

/**
 * Campañas del mes con presupuesto y adsets anidados, separadas en
 * activas (≥1 adset ACTIVE) y pausadas. UNA sola pasada:
 * viewmodel cacheado + metadatos de campañas + programación del cliente.
 */
export async function getCampanasActivas(
  month: string,
): Promise<CampanasActivasResult> {
  const result = await getFiveGatosMonth(month);
  if (!result.ok) return result;
  const d = result.data;

  const [campMeta, vigentes] = await Promise.all([
    getCampaignsMetaSafe(),
    cursosVigentesSafe(),
  ]);
  const hoy = new Date();

  // Agrupar adsets por campaña padre.
  const grupos = new Map<string, AdsetStats[]>();
  for (const a of d.adsets) {
    const id = a.campaign_id || "sin-campana";
    const list = grupos.get(id) ?? [];
    list.push(a);
    grupos.set(id, list);
  }

  const campanas: CampanaActiva[] = [];
  for (const [id, list] of grupos) {
    const adsets: AdsetConCurso[] = list
      .map((a) => ({
        ...a,
        curso: cursoParaAdset(a.adset_name, vigentes),
        presupuesto: presupuestoAdset(a, d.dateStart, d.dateStop, hoy),
      }))
      .sort((a, b) => b.spend - a.spend);

    const meta = campMeta.get(id);
    const spend = adsets.reduce((s, a) => s + a.spend, 0);
    const impressions = adsets.reduce((s, a) => s + a.impressions, 0);
    const reach = adsets.reduce((s, a) => s + a.reach, 0);
    const clicks = adsets.reduce((s, a) => s + a.clicks, 0);
    const leads = adsets.reduce((s, a) => s + a.leads, 0);
    const cpl = leads > 0 ? spend / leads : null;
    const adsetsActivos = adsets.filter(
      (a) => a.effective_status === "ACTIVE",
    ).length;

    // Inicio real de la pauta: start_time creíble de Meta o el menor start
    // de sus adsets (algunas campañas CBO reportan epoch 1969).
    const startsAdsets = adsets
      .map((a) => fechaCreible(a.start_time))
      .filter((d): d is Date => d !== null);
    const startCamp =
      fechaCreible(meta?.start_time) ??
      (startsAdsets.length > 0
        ? new Date(Math.min(...startsAdsets.map((d) => d.getTime())))
        : null);

    campanas.push({
      campaign_id: id,
      campaign_name:
        adsets.find((a) => a.campaign_name)?.campaign_name ??
        meta?.name ??
        "(Sin nombre de campaña)",
      effective_status: adsetsActivos > 0 ? "ACTIVE" : "PAUSED",
      objetivo: objetivoLabel(meta?.objective),
      start_time: startCamp ? startCamp.toISOString() : null,
      frequency: frecuenciaDe(null, impressions, reach),
      adsetsTotal: adsets.length,
      adsetsActivos,
      spend,
      spend_lifetime: adsets.reduce((s, a) => s + a.spend_lifetime, 0),
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
      cpc: clicks > 0 ? spend / clicks : null,
      leads,
      cpl,
      semaforo: semaforoCpl(cpl),
      presupuesto: presupuestoCampana(meta, adsets, d.dateStart, d.dateStop, hoy),
      adsets,
    });
  }
  campanas.sort((a, b) => b.spend - a.spend);

  const activas = campanas.filter((c) => c.adsetsActivos > 0);
  const pausadas = campanas.filter((c) => c.adsetsActivos === 0);

  // Totales de presupuesto del MES de las campañas activas (KPI global).
  let planeadoTotal = 0;
  let consumidoTotal = 0;
  let hayPlan = false;
  for (const c of activas) {
    consumidoTotal += c.presupuesto.mes.consumido;
    if (c.presupuesto.mes.planeado !== null) {
      hayPlan = true;
      planeadoTotal += c.presupuesto.mes.planeado;
    }
  }

  return {
    ok: true,
    data: {
      month: d.month,
      dateStart: d.dateStart,
      dateStop: d.dateStop,
      updatedAt: d.updatedAt,
      kpis: d.kpis,
      kpisPrev: d.kpisPrev,
      activas,
      pausadas,
      presupuestoMes: {
        planeado: hayPlan ? planeadoTotal : null,
        consumido: consumidoTotal,
        restante: hayPlan ? planeadoTotal - consumidoTotal : null,
      },
      sinClasificar: d.sinClasificar,
    },
  };
}

// ---------------------------------------------------------------------------
// Cruce con la programación del cliente (curso ↔ adset) — info serializable
// ---------------------------------------------------------------------------

/** Info del curso del Excel del cliente, lista para UI (fechas en ISO). */
export interface CursoInfo {
  nombre: string;
  /** Texto crudo de la columna FECHA del Excel (respaldo). */
  fecha_texto: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estado: EstadoCurso;
  inscritos: number;
}

function toCursoInfo(c: Curso): CursoInfo {
  return {
    nombre: c.nombre_canonico,
    fecha_texto: c.fecha_texto,
    fecha_inicio: c.fecha_inicio ? c.fecha_inicio.toISOString() : null,
    fecha_fin: c.fecha_fin ? c.fecha_fin.toISOString() : null,
    estado: c.estado,
    inscritos: c.inscritos,
  };
}

/**
 * Cursos vigentes del Excel del cliente. Nunca lanza: si el Sheet no está
 * accesible devuelve [] (la UI simplemente no muestra chips de curso).
 */
async function cursosVigentesSafe(): Promise<Curso[]> {
  try {
    const programacion = await readProgramacion();
    return dedupeCursosVigentes(programacion);
  } catch (err) {
    console.error(
      "[5gatos] Programación no disponible para chips de curso:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

/** Mejor curso del Excel para un adset (fuzzy match), o null. */
export function cursoParaAdset(
  adsetName: string,
  cursosVigentes: Curso[],
): CursoInfo | null {
  const match = mejorMatchCurso(adsetName, cursosVigentes);
  return match ? toCursoInfo(match.curso) : null;
}

// ---------------------------------------------------------------------------
// NIVEL 2 — detalle de una campaña (sus adsets + curso mapeado)
// ---------------------------------------------------------------------------

export interface CampanaDetalle {
  month: string;
  dateStart: string;
  dateStop: string;
  updatedAt: string;
  campana: CampaignStats;
  /** Adsets de la campaña ordenados por inversión del mes desc. */
  adsets: AdsetStats[];
  /** Curso del Excel por adset_id (null si no matchea). */
  cursos: Record<string, CursoInfo | null>;
}

export type CampanaDetalleResult =
  | { ok: true; data: CampanaDetalle }
  | { ok: false; error: string; notFound?: boolean };

export async function getCampanaDetalle(
  campaignId: string,
  month: string,
): Promise<CampanaDetalleResult> {
  const result = await getFiveGatosMonth(month);
  if (!result.ok) return result;

  const adsets = result.data.adsets
    .filter((a) => a.campaign_id === campaignId)
    .sort((a, b) => b.spend - a.spend);
  if (adsets.length === 0) {
    return {
      ok: false,
      error: `Campaña ${campaignId} sin adsets en ${month}.`,
      notFound: true,
    };
  }

  const campana = agruparPorCampana(adsets)[0];
  const vigentes = await cursosVigentesSafe();
  const cursos: Record<string, CursoInfo | null> = {};
  for (const a of adsets) {
    cursos[a.adset_id] = cursoParaAdset(a.adset_name, vigentes);
  }

  return {
    ok: true,
    data: {
      month: result.data.month,
      dateStart: result.data.dateStart,
      dateStop: result.data.dateStop,
      updatedAt: result.data.updatedAt,
      campana,
      adsets,
      cursos,
    },
  };
}

// ---------------------------------------------------------------------------
// NIVEL 3 — detalle de un adset (sus ads con creative + insights del mes)
// ---------------------------------------------------------------------------

export interface AdStats {
  ad_id: string;
  ad_name: string;
  status: string;
  effective_status: string;
  /**
   * Fecha de lanzamiento del creative (created_time del ad; Meta no reporta
   * start_time a nivel ad). ISO con offset o null.
   */
  created_time: string | null;
  creative_title: string | null;
  creative_body: string | null;
  creative_image: string | null;
  /** Tipo de CTA de Meta (ej. WHATSAPP_MESSAGE) o null. */
  cta: string | null;
  // Métricas del mes seleccionado
  spend: number;
  impressions: number;
  /** Personas únicas alcanzadas en el mes. */
  reach: number;
  /** Frecuencia del mes (impresiones ÷ alcance) o null sin entrega. */
  frequency: number | null;
  clicks: number;
  ctr: number;
  cpc: number | null;
  cpm: number | null;
  leads: number;
  cpl: number | null;
  semaforo: Semaforo;
}

function buildAdStats(meta: AdMeta, row: AdInsight | undefined): AdStats {
  const spend = toNum(row?.spend);
  const result = interpretResult(row?.actions, row?.cost_per_action_type, spend);
  const leads = result.results ?? 0;
  const cpl = leads > 0 ? spend / leads : null;
  return {
    ad_id: meta.id,
    ad_name: meta.name,
    status: meta.status ?? "",
    effective_status: meta.effective_status ?? "",
    created_time: meta.created_time ?? null,
    creative_title: creativeTitle(meta.creative),
    creative_body: creativeBody(meta.creative),
    creative_image: creativeImage(meta.creative),
    cta: creativeCta(meta.creative),
    spend,
    impressions: toNum(row?.impressions),
    reach: toNum(row?.reach),
    frequency: frecuenciaDe(
      toNumOrNull(row?.frequency),
      toNum(row?.impressions),
      toNum(row?.reach),
    ),
    clicks: toNum(row?.clicks),
    ctr: toNum(row?.ctr),
    cpc: row?.cpc ? toNum(row.cpc) : null,
    cpm: row?.cpm ? toNum(row.cpm) : null,
    leads,
    cpl,
    semaforo: semaforoCpl(cpl),
  };
}

/** Trae ads + insights del rango y los mergea por ad_id (2 llamadas a Meta). */
async function fetchAdsDeAdsetUncached(
  adsetId: string,
  month: string,
): Promise<AdStats[]> {
  const { client } = buildMetaClient();
  const { since, until } = monthRange(month);
  const [ads, insights] = await Promise.all([
    fetchAdsOfAdset(client, adsetId),
    fetchAdInsightsRange(client, adsetId, since, until),
  ]);
  const stats = ads.map((meta) => buildAdStats(meta, insights.get(meta.id)));
  stats.sort((a, b) => b.spend - a.spend);
  return stats;
}

export async function getAdsDeAdset(adsetId: string, month: string): Promise<AdStats[]> {
  try {
    const cached = unstable_cache(
      () => fetchAdsDeAdsetUncached(adsetId, month),
      ["5gatos-ads", adsetId, month],
      { revalidate: REVALIDATE_SECONDS, tags: ["5gatos-data"] },
    );
    return await cached();
  } catch (err) {
    // Fuera del runtime de Next (scripts/tests) no hay incrementalCache.
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("incrementalCache")) throw err;
    return fetchAdsDeAdsetUncached(adsetId, month);
  }
}

export interface AdsetDetalle {
  month: string;
  dateStart: string;
  dateStop: string;
  updatedAt: string;
  adset: AdsetStats;
  curso: CursoInfo | null;
  /** Ads del adset ordenados por inversión del mes desc. */
  ads: AdStats[];
}

export type AdsetDetalleResult =
  | { ok: true; data: AdsetDetalle }
  | { ok: false; error: string; notFound?: boolean };

export async function getAdsetDetalle(
  adsetId: string,
  month: string,
): Promise<AdsetDetalleResult> {
  const result = await getFiveGatosMonth(month);
  if (!result.ok) return result;

  // Metadata + métricas del mes del adset: normalmente ya está en el
  // viewmodel cacheado; si no (adset viejo sin actividad este mes), se trae
  // su metadata directo de Meta y queda con métricas del mes en cero.
  let adset = result.data.adsets.find((a) => a.adset_id === adsetId) ?? null;
  if (!adset) {
    try {
      const { client } = buildMetaClient();
      const [meta, rules] = await Promise.all([
        withRateLimitRetry(
          () =>
            client.getOne<AdsetMeta>(adsetId, { fields: ADSET_FIELDS }),
          "adset-meta",
        ),
        loadMapping(),
      ]);
      adset = buildAdsetStats(adsetId, undefined, undefined, meta, rules);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[5gatos] Adset ${adsetId} no encontrado:`, msg);
      return { ok: false, error: msg, notFound: true };
    }
  }

  try {
    const [ads, vigentes] = await Promise.all([
      getAdsDeAdset(adsetId, month),
      cursosVigentesSafe(),
    ]);
    return {
      ok: true,
      data: {
        month: result.data.month,
        dateStart: result.data.dateStart,
        dateStop: result.data.dateStop,
        updatedAt: result.data.updatedAt,
        adset,
        curso: cursoParaAdset(adset.adset_name, vigentes),
        ads,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[5gatos] Error trayendo ads del adset ${adsetId}:`, msg);
    return { ok: false, error: msg };
  }
}
