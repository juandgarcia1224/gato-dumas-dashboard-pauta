/**
 * Transformación de insights crudos → filas tipadas para Sheets.
 * Incluye la interpretación de "resultado principal" desde `actions`.
 */

import type { AccountGroupKey } from "../config/clients";
import type {
  AdRow,
  AdsetRow,
  CampaignRow,
  EntityMeta,
  MetaAction,
  RawInsight,
  ResultInterpretation,
} from "./types";

/**
 * Orden de prioridad para decidir cuál acción es el "resultado" del aviso.
 * Si ninguna aparece, results_type = "" y results/cpa = null.
 */
export const RESULT_PRIORITY: string[] = [
  "messaging_conversation_started_7d",
  "onsite_conversion.messaging_conversation_started_7d",
  "lead",
  "offsite_conversion.fb_pixel_lead",
  "complete_registration",
  "link_click",
  "landing_page_view",
  "post_engagement",
];

function num(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function numOrNull(v: string | number | undefined | null): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function findAction(
  actions: MetaAction[] | undefined,
  type: string,
): number | null {
  if (!actions) return null;
  const hit = actions.find((a) => a.action_type === type);
  return hit ? num(hit.value) : null;
}

/**
 * Interpreta el resultado principal a partir de actions + cost_per_action_type.
 * `spend` se usa como respaldo para calcular cost_per_result si Meta no lo da.
 */
export function interpretResult(
  actions: MetaAction[] | undefined,
  costPerAction: MetaAction[] | undefined,
  spend: number,
): ResultInterpretation {
  for (const type of RESULT_PRIORITY) {
    const value = findAction(actions, type);
    if (value !== null && value > 0) {
      let cpr = findAction(costPerAction, type);
      if (cpr === null && value > 0) cpr = spend / value;
      return {
        results_type: type,
        results: value,
        cost_per_result: cpr,
      };
    }
  }
  return { results_type: "", results: null, cost_per_result: null };
}

function baseFields(
  insight: RawInsight,
  accountGroup: AccountGroupKey,
  adAccountId: string,
  pulledAt: string,
) {
  const spend = num(insight.spend);
  const result = interpretResult(
    insight.actions,
    insight.cost_per_action_type,
    spend,
  );
  return {
    pulled_at: pulledAt,
    date_start: insight.date_start ?? "",
    date_stop: insight.date_stop ?? "",
    platform: "meta" as const,
    account_group: accountGroup,
    ad_account_id: adAccountId,
    spend,
    impressions: num(insight.impressions),
    reach: num(insight.reach),
    frequency: num(insight.frequency),
    clicks: num(insight.clicks),
    inline_link_clicks: num(insight.inline_link_clicks),
    ctr: num(insight.ctr),
    cpc: num(insight.cpc),
    cpm: num(insight.cpm),
    results_type: result.results_type,
    results: result.results,
    cost_per_result: result.cost_per_result,
    actions_json: insight.actions ? JSON.stringify(insight.actions) : "[]",
    raw_json: JSON.stringify(insight),
  };
}

export function toCampaignRow(
  insight: RawInsight,
  accountGroup: AccountGroupKey,
  adAccountId: string,
  adAccountName: string,
  meta: Map<string, EntityMeta>,
  pulledAt: string,
): CampaignRow {
  const m = insight.campaign_id ? meta.get(insight.campaign_id) : undefined;
  return {
    ...baseFields(insight, accountGroup, adAccountId, pulledAt),
    ad_account_name: insight.account_name ?? adAccountName,
    campaign_id: insight.campaign_id ?? "",
    campaign_name: insight.campaign_name ?? "",
    buying_type: insight.buying_type ?? "",
    objective: insight.objective ?? "",
    status: m?.status ?? "",
    effective_status: m?.effective_status ?? "",
  };
}

export function toAdsetRow(
  insight: RawInsight,
  accountGroup: AccountGroupKey,
  adAccountId: string,
  meta: Map<string, EntityMeta>,
  pulledAt: string,
): AdsetRow {
  const m = insight.adset_id ? meta.get(insight.adset_id) : undefined;
  return {
    ...baseFields(insight, accountGroup, adAccountId, pulledAt),
    campaign_id: insight.campaign_id ?? "",
    campaign_name: insight.campaign_name ?? "",
    adset_id: insight.adset_id ?? "",
    adset_name: insight.adset_name ?? "",
    status: m?.status ?? "",
    effective_status: m?.effective_status ?? "",
    daily_budget: m ? numOrNull(m.daily_budget) : null,
    lifetime_budget: m ? numOrNull(m.lifetime_budget) : null,
  };
}

export function toAdRow(
  insight: RawInsight,
  accountGroup: AccountGroupKey,
  adAccountId: string,
  meta: Map<string, EntityMeta>,
  pulledAt: string,
): AdRow {
  const m = insight.ad_id ? meta.get(insight.ad_id) : undefined;
  return {
    ...baseFields(insight, accountGroup, adAccountId, pulledAt),
    campaign_id: insight.campaign_id ?? "",
    campaign_name: insight.campaign_name ?? "",
    adset_id: insight.adset_id ?? "",
    adset_name: insight.adset_name ?? "",
    ad_id: insight.ad_id ?? "",
    ad_name: insight.ad_name ?? "",
    status: m?.status ?? "",
    effective_status: m?.effective_status ?? "",
  };
}
