/**
 * Tipos del dominio Meta Ads y de las filas que se escriben en Sheets.
 * Los nombres de campo de las filas coinciden 1:1 con los headers definidos
 * en `../sheets/schema.ts` (fuente única de verdad de columnas).
 */

import type { AccountGroupKey } from "../config/clients";

export type InsightLevel = "campaign" | "adset" | "ad";

export type DatePreset = "today" | "yesterday" | "last_7d" | "this_month";

export interface DateRange {
  /** Si se usa preset, `preset` toma prioridad sobre start/stop. */
  preset?: DatePreset;
  dateStart?: string; // YYYY-MM-DD
  dateStop?: string; // YYYY-MM-DD
}

/** Acción cruda de Meta (actions / cost_per_action_type). */
export interface MetaAction {
  action_type: string;
  value: string;
}

/** Fila cruda de Insights tal como llega de la Graph API. */
export interface RawInsight {
  account_id?: string;
  account_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  objective?: string;
  buying_type?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  frequency?: string;
  clicks?: string;
  inline_link_clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  date_start?: string;
  date_stop?: string;
}

/** Metadatos de estado por entidad (campaign/adset/ad). */
export interface EntityMeta {
  id: string;
  status?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

/** Resultado interpretado a partir de actions. */
export interface ResultInterpretation {
  results_type: string;
  results: number | null;
  cost_per_result: number | null;
}

/** Campos comunes a todos los niveles de fila. */
interface BaseRow {
  pulled_at: string;
  date_start: string;
  date_stop: string;
  platform: "meta";
  account_group: AccountGroupKey;
  ad_account_id: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  inline_link_clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  results_type: string;
  results: number | null;
  cost_per_result: number | null;
  actions_json: string;
  raw_json: string;
}

export interface CampaignRow extends BaseRow {
  ad_account_name: string;
  campaign_id: string;
  campaign_name: string;
  buying_type: string;
  objective: string;
  status: string;
  effective_status: string;
}

export interface AdsetRow extends BaseRow {
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  status: string;
  effective_status: string;
  daily_budget: number | null;
  lifetime_budget: number | null;
}

export interface AdRow extends BaseRow {
  campaign_id: string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  ad_id: string;
  ad_name: string;
  status: string;
  effective_status: string;
}

export interface AccountPullResult {
  accountGroup: AccountGroupKey;
  adAccountId: string;
  adAccountName: string;
  ok: boolean;
  error?: string;
  campaigns: CampaignRow[];
  adsets: AdsetRow[];
  ads: AdRow[];
}
