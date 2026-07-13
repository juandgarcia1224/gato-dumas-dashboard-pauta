/**
 * Lectura de ADSETS de Meta para el dashboard 5 Gatos (SOLO GET, solo lectura).
 *
 * Modelo de Juan: 1 adset = 1 curso/programa. Este módulo trae:
 *   - Metadatos de adsets (edge /adsets): nombre, campaña padre, fechas,
 *     presupuestos y effective_status (una campaña PAUSED también pausa sus
 *     adsets vía effective_status, aunque el `status` propio diga ACTIVE).
 *   - Insights lifetime por adset (date_preset=maximum ≡ desde inicio real).
 *   - Insights de un rango/mes por adset.
 *
 * Round-trips mínimos: 1 llamada al edge (paginada) + 1 llamada de insights
 * por rango (la Graph API agrega por adset con level=adset, no hace falta
 * ?ids= por entidad). Rate limit: reintento con backoff exponencial si Meta
 * responde code 17 (User request limit reached) o afines (4, 32, 613).
 */

import { MetaApiError, type MetaClient } from "./client";
import type { MetaAction } from "./types";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Metadatos de un adset tal como llegan del edge /adsets. */
export interface AdsetMeta {
  id: string;
  name: string;
  campaign_id: string;
  campaign?: { id: string; name: string };
  effective_status: string;
  status?: string;
  start_time?: string; // ISO con offset, ej. 2026-06-23T14:54:29-0500
  end_time?: string | null; // null/ausente = "hasta que se pause"
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
}

/** Fila de insights agregada por adset (un rango: mes o lifetime). */
export interface AdsetInsight {
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  date_start?: string;
  date_stop?: string;
}

const ADSET_FIELDS = [
  "id",
  "name",
  "campaign_id",
  "campaign{id,name}",
  "effective_status",
  "status",
  "start_time",
  "end_time",
  "daily_budget",
  "lifetime_budget",
  "created_time",
].join(",");

const ADSET_INSIGHT_FIELDS = [
  "adset_id",
  "adset_name",
  "campaign_id",
  "campaign_name",
  "spend",
  "impressions",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "cost_per_action_type",
  "date_start",
  "date_stop",
].join(",");

// ---------------------------------------------------------------------------
// Rate limit: backoff exponencial (máx. 3 intentos)
// ---------------------------------------------------------------------------

/** Códigos de Meta que indican throttling transitorio (reintentables). */
const RATE_LIMIT_CODES = new Set([4, 17, 32, 613]);

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Ejecuta `fn` reintentando con backoff exponencial (2s, 4s) si Meta
 * responde rate limit (code 17 y afines). Máximo 3 intentos en total.
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  label = "meta",
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRateLimit =
        err instanceof MetaApiError &&
        err.fbCode !== undefined &&
        RATE_LIMIT_CODES.has(err.fbCode);
      if (!isRateLimit || attempt === MAX_ATTEMPTS) throw err;
      const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[${label}] Rate limit de Meta (code ${(err as MetaApiError).fbCode}); ` +
          `reintento ${attempt}/${MAX_ATTEMPTS - 1} en ${delay} ms…`,
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Fetchers (SOLO lectura)
// ---------------------------------------------------------------------------

/**
 * Trae TODOS los adsets de la cuenta con sus metadatos (paginado).
 * El filtrado por effective_status=ACTIVE se hace en memoria: así una sola
 * llamada sirve para las cards de activos y para enriquecer el histórico.
 */
export async function fetchAdsetsMeta(
  client: MetaClient,
  adAccountId: string,
): Promise<Map<string, AdsetMeta>> {
  const rows = await withRateLimitRetry(
    () => client.getAll<AdsetMeta>(`${adAccountId}/adsets`, { fields: ADSET_FIELDS }),
    "adsets",
  );
  const map = new Map<string, AdsetMeta>();
  for (const r of rows) {
    if (r.id) map.set(r.id, r);
  }
  return map;
}

/** Solo los adsets ACTIVOS hoy (por effective_status, no por status). */
export function activeAdsets(meta: Map<string, AdsetMeta>): AdsetMeta[] {
  return [...meta.values()].filter((a) => a.effective_status === "ACTIVE");
}

/**
 * Insights lifetime por adset: date_preset=maximum ≡ gasto acumulado desde
 * el inicio real de cada adset. Una sola llamada agregada (level=adset).
 */
export async function fetchAdsetInsightsLifetime(
  client: MetaClient,
  adAccountId: string,
): Promise<Map<string, AdsetInsight>> {
  const rows = await withRateLimitRetry(
    () =>
      client.getAll<AdsetInsight>(`${adAccountId}/insights`, {
        level: "adset",
        date_preset: "maximum",
        fields: ADSET_INSIGHT_FIELDS,
      }),
    "insights-lifetime",
  );
  return byAdsetId(rows);
}

/**
 * Insights de un rango (ej. mes en curso) por adset, agregados (sin
 * time_increment). `since`/`until` en YYYY-MM-DD.
 */
export async function fetchAdsetInsightsRange(
  client: MetaClient,
  adAccountId: string,
  since: string,
  until: string,
): Promise<Map<string, AdsetInsight>> {
  const rows = await withRateLimitRetry(
    () =>
      client.getAll<AdsetInsight>(`${adAccountId}/insights`, {
        level: "adset",
        time_range: JSON.stringify({ since, until }),
        fields: ADSET_INSIGHT_FIELDS,
      }),
    "insights-range",
  );
  return byAdsetId(rows);
}

/** Insights del mes en curso (date_preset=this_month) por adset. */
export async function fetchAdsetInsightsThisMonth(
  client: MetaClient,
  adAccountId: string,
): Promise<Map<string, AdsetInsight>> {
  const rows = await withRateLimitRetry(
    () =>
      client.getAll<AdsetInsight>(`${adAccountId}/insights`, {
        level: "adset",
        date_preset: "this_month",
        fields: ADSET_INSIGHT_FIELDS,
      }),
    "insights-this-month",
  );
  return byAdsetId(rows);
}

function byAdsetId(rows: AdsetInsight[]): Map<string, AdsetInsight> {
  const map = new Map<string, AdsetInsight>();
  for (const r of rows) {
    if (r.adset_id) map.set(r.adset_id, r);
  }
  return map;
}
