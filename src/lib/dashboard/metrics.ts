/**
 * Cálculo de métricas agregadas para el dashboard a partir de las filas
 * crudas leídas de Sheets. El nivel CAMPAIGN es la base de los KPIs;
 * adsets/ads se exponen tal cual para sus tablas.
 *
 * Este módulo también define el CONTRATO DE DATOS (`DashboardPayload`) que
 * consume el frontend y que Cloud Design usará como referencia.
 */

import {
  ACCOUNT_GROUPS,
  getAccountGroup,
  type AccountGroupKey,
} from "../config/clients";
import type { Sede } from "./sede";

/** Registro normalizado (números parseados) de una fila de campaña. */
export interface CampaignRecord {
  account_group: AccountGroupKey;
  ad_account_id: string;
  ad_account_name: string;
  campaign_id: string;
  campaign_name: string;
  objective: string;
  buying_type: string;
  status: string;
  effective_status: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  results_type: string;
  results: number | null;
  cost_per_result: number | null;
  date_start: string;
  date_stop: string;
  /** Sede inferida (se asigna en contract.ts; no viene de Sheets). */
  sede?: Sede;
}

export interface Kpis {
  spend: number;
  results: number | null;
  costPerResult: number | null;
  avgFrequency: number | null;
  avgCtr: number | null;
  activeCampaigns: number;
  criticalAlerts: number;
}

export interface AccountSummary {
  accountGroup: AccountGroupKey;
  label: string;
  sede: string;
  configured: boolean;
  hasData: boolean;
  kpis: Kpis;
}

function n(v: string | undefined): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function nOrNull(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

export function parseCampaignRows(
  raw: Record<string, string>[],
): CampaignRecord[] {
  return raw
    .filter((r) => r.campaign_id)
    .map((r) => ({
      account_group: r.account_group as AccountGroupKey,
      ad_account_id: r.ad_account_id ?? "",
      ad_account_name: r.ad_account_name ?? "",
      campaign_id: r.campaign_id ?? "",
      campaign_name: r.campaign_name ?? "",
      objective: r.objective ?? "",
      buying_type: r.buying_type ?? "",
      status: r.status ?? "",
      effective_status: r.effective_status ?? "",
      spend: n(r.spend),
      impressions: n(r.impressions),
      reach: n(r.reach),
      frequency: n(r.frequency),
      clicks: n(r.clicks),
      ctr: n(r.ctr),
      cpc: n(r.cpc),
      cpm: n(r.cpm),
      results_type: r.results_type ?? "",
      results: nOrNull(r.results),
      cost_per_result: nOrNull(r.cost_per_result),
      date_start: r.date_start ?? "",
      date_stop: r.date_stop ?? "",
    }));
}

/**
 * Calcula KPIs de un conjunto de campañas.
 * - CTR y frecuencia se promedian ponderando por impresiones (aproximación
 *   estándar; reach no es aditivo entre campañas).
 * - costPerResult = spend total / resultados totales.
 */
export function computeKpis(
  rows: CampaignRecord[],
  criticalAlerts = 0,
): Kpis {
  const spend = sum(rows.map((r) => r.spend));
  const impressions = sum(rows.map((r) => r.impressions));

  const resultRows = rows.filter((r) => r.results !== null);
  const totalResults = resultRows.length
    ? sum(resultRows.map((r) => r.results as number))
    : null;

  const ctrWeighted =
    impressions > 0
      ? sum(rows.map((r) => r.ctr * r.impressions)) / impressions
      : null;

  const freqWeighted =
    impressions > 0
      ? sum(rows.map((r) => r.frequency * r.impressions)) / impressions
      : null;

  const activeCampaigns = rows.filter(
    (r) => r.effective_status.toUpperCase() === "ACTIVE",
  ).length;

  return {
    spend,
    results: totalResults,
    costPerResult:
      totalResults && totalResults > 0 ? spend / totalResults : null,
    avgFrequency: freqWeighted,
    avgCtr: ctrWeighted,
    activeCampaigns,
    criticalAlerts,
  };
}

/** Resumen por cada grupo de cuenta + estado de configuración. */
export function buildAccountSummaries(
  rows: CampaignRecord[],
  configuredAccounts: Record<AccountGroupKey, boolean>,
  criticalByAccount: Record<string, number>,
): AccountSummary[] {
  return ACCOUNT_GROUPS.map((g) => {
    const groupRows = rows.filter((r) => r.account_group === g.key);
    return {
      accountGroup: g.key,
      label: g.label,
      sede: g.sede,
      configured: Boolean(configuredAccounts[g.key]),
      hasData: groupRows.length > 0,
      kpis: computeKpis(groupRows, criticalByAccount[g.key] ?? 0),
    };
  });
}

export function filterByAccount(
  rows: CampaignRecord[],
  account: string | null,
): CampaignRecord[] {
  if (!account || account === "all") return rows;
  if (!getAccountGroup(account)) return rows;
  return rows.filter((r) => r.account_group === account);
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
