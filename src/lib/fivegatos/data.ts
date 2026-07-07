/**
 * Capa de datos del dashboard cliente 5 Gatos · Bucaramanga.
 *
 * Lee Meta Insights (SOLO lectura) a nivel campaña para un mes dado,
 * aplica el mapeo curso↔campaña y produce el viewmodel de la página
 * /5gatos y del export XLSX. Cachea 10 min por mes (unstable_cache).
 */

import { unstable_cache } from "next/cache";
import { MetaClient } from "../meta/client";
import { fetchEntityMeta, fetchInsights } from "../meta/insights";
import { interpretResult } from "../meta/transform";
import type { RawInsight } from "../meta/types";
import {
  loadMapping,
  matchCampaignAgainstRules,
  recordUnclassified,
} from "../mapping/courses";
import type { MappingTipo } from "../mapping/types";
import { getFiveGatosAccountId, getFiveGatosToken, semaforoCpl, type Semaforo } from "./constants";

// ---------------------------------------------------------------------------
// Tipos del viewmodel
// ---------------------------------------------------------------------------

export interface CampaignMonthStats {
  campaign_id: string;
  campaign_name: string;
  tipo: MappingTipo | null;
  nombre_normalizado: string | null;
  status: string;
  effective_status: string;
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
}

export interface GroupSummaryRow {
  nombre: string;
  tipo: MappingTipo;
  inversion: number;
  impressions: number;
  clicks: number;
  leads: number;
  cpl: number | null;
  campaigns: number;
}

export interface KpiBlock {
  inversion: number;
  leads: number;
  cpl: number | null;
  campanasActivas: number;
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
  activas: CampaignMonthStats[];
  sinClasificar: CampaignMonthStats[];
  campaigns: CampaignMonthStats[];
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
// Fetch + agregación
// ---------------------------------------------------------------------------

function toNum(v: string | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function buildMonthStats(
  client: MetaClient,
  accountId: string,
  month: string,
  statusMap: Map<string, { status?: string; effective_status?: string }>,
  rules: Awaited<ReturnType<typeof loadMapping>>,
): Promise<CampaignMonthStats[]> {
  const { since, until } = monthRange(month);
  const insights = await fetchInsights(
    client,
    accountId,
    "campaign",
    { dateStart: since, dateStop: until },
    false, // agregado del rango, no diario
  );

  return insights.map((row: RawInsight) => {
    const spend = toNum(row.spend);
    const result = interpretResult(row.actions, row.cost_per_action_type, spend);
    const leads = result.results ?? 0;
    const cpl = leads > 0 ? spend / leads : null;
    const meta = row.campaign_id ? statusMap.get(row.campaign_id) : undefined;
    const match = matchCampaignAgainstRules(
      rules,
      row.campaign_name ?? "",
      row.campaign_id ?? "",
    );
    return {
      campaign_id: row.campaign_id ?? "",
      campaign_name: row.campaign_name ?? "",
      tipo: match?.tipo ?? null,
      nombre_normalizado: match?.nombre_normalizado ?? null,
      status: meta?.status ?? "",
      effective_status: meta?.effective_status ?? "",
      spend,
      impressions: toNum(row.impressions),
      clicks: toNum(row.clicks),
      ctr: toNum(row.ctr),
      cpc: row.cpc ? toNum(row.cpc) : null,
      cpm: row.cpm ? toNum(row.cpm) : null,
      leads,
      cpl,
      results_type: result.results_type,
      semaforo: semaforoCpl(cpl),
    };
  });
}

function groupByNombre(
  campaigns: CampaignMonthStats[],
  tipo: MappingTipo,
): GroupSummaryRow[] {
  const map = new Map<string, GroupSummaryRow>();
  for (const c of campaigns) {
    if (c.tipo !== tipo || !c.nombre_normalizado) continue;
    const g = map.get(c.nombre_normalizado) ?? {
      nombre: c.nombre_normalizado,
      tipo,
      inversion: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      cpl: null,
      campaigns: 0,
    };
    g.inversion += c.spend;
    g.impressions += c.impressions;
    g.clicks += c.clicks;
    g.leads += c.leads;
    g.campaigns += 1;
    map.set(c.nombre_normalizado, g);
  }
  const rows = [...map.values()].map((g) => ({
    ...g,
    cpl: g.leads > 0 ? g.inversion / g.leads : null,
  }));
  rows.sort((a, b) => b.inversion - a.inversion);
  return rows;
}

function kpisOf(campaigns: CampaignMonthStats[]): KpiBlock {
  const inversion = campaigns.reduce((s, c) => s + c.spend, 0);
  const leads = campaigns.reduce((s, c) => s + c.leads, 0);
  return {
    inversion,
    leads,
    cpl: leads > 0 ? inversion / leads : null,
    campanasActivas: campaigns.filter((c) => c.effective_status === "ACTIVE").length,
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

  const [rules, statusMap] = await Promise.all([
    loadMapping(),
    fetchEntityMeta(client, accountId, "campaign"),
  ]);

  const prevMonth = previousMonth(month);
  const [campaigns, prevCampaigns] = await Promise.all([
    buildMonthStats(client, accountId, month, statusMap, rules),
    buildMonthStats(client, accountId, prevMonth, statusMap, rules).catch(
      () => null,
    ),
  ]);

  const sinClasificar = campaigns.filter((c) => c.tipo === null && c.spend > 0);

  // Registrar sin-clasificar en el Sheet (fire-and-forget, con throttle).
  void Promise.allSettled(
    sinClasificar.map((c) =>
      recordUnclassified({
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        account_id: accountId,
        status: c.effective_status || c.status,
      }),
    ),
  );

  const activas = campaigns
    .filter((c) => c.effective_status === "ACTIVE")
    .sort((a, b) => b.spend - a.spend);

  const { since, until } = monthRange(month);
  return {
    month,
    dateStart: since,
    dateStop: until,
    updatedAt: new Date().toISOString(),
    kpis: kpisOf(campaigns),
    kpisPrev: prevCampaigns ? kpisOf(prevCampaigns) : null,
    cursos: groupByNombre(campaigns, "Curso"),
    programas: groupByNombre(campaigns, "Programa"),
    activas,
    sinClasificar,
    campaigns,
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
    const cached = unstable_cache(
      () => fetchFiveGatosMonthUncached(safeMonth),
      ["5gatos-month", safeMonth],
      { revalidate: REVALIDATE_SECONDS, tags: ["5gatos-data"] },
    );
    const data = await cached();
    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[5gatos] Error trayendo datos de ${safeMonth}:`, msg);
    return { ok: false, error: msg };
  }
}
