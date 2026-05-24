/**
 * Consultas a Meta Insights + metadatos de estado por entidad.
 *
 * Insights no siempre trae status/effective_status fiables, así que los
 * obtenemos por separado desde los edges de campaigns/adsets/ads y los
 * cruzamos por id en la capa de transformación.
 */

import { MetaClient } from "./client";
import type {
  DateRange,
  EntityMeta,
  InsightLevel,
  RawInsight,
} from "./types";

/** Campos mínimos solicitados a Insights (ver prompt FASE 1). */
export const INSIGHT_FIELDS = [
  "account_id",
  "account_name",
  "campaign_id",
  "campaign_name",
  "adset_id",
  "adset_name",
  "ad_id",
  "ad_name",
  "objective",
  "buying_type",
  "spend",
  "impressions",
  "reach",
  "frequency",
  "clicks",
  "inline_link_clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "cost_per_action_type",
  "date_start",
  "date_stop",
].join(",");

/** Traduce un DateRange a parámetros de la Graph API. */
export function buildDateParams(range: DateRange): Record<string, string> {
  if (range.dateStart && range.dateStop) {
    return {
      time_range: JSON.stringify({
        since: range.dateStart,
        until: range.dateStop,
      }),
    };
  }
  return { date_preset: range.preset ?? "this_month" };
}

/** Descarga insights de una cuenta a un nivel dado. */
export async function fetchInsights(
  client: MetaClient,
  adAccountId: string,
  level: InsightLevel,
  range: DateRange,
): Promise<RawInsight[]> {
  return client.getAll<RawInsight>(`${adAccountId}/insights`, {
    level,
    fields: INSIGHT_FIELDS,
    ...buildDateParams(range),
  });
}

const EDGE_BY_LEVEL: Record<InsightLevel, string> = {
  campaign: "campaigns",
  adset: "adsets",
  ad: "ads",
};

/**
 * Trae status/effective_status (y presupuestos en adsets) por entidad.
 * Devuelve un mapa id -> EntityMeta. Si falla, devuelve mapa vacío
 * (los insights se escriben igual, sin status).
 */
export async function fetchEntityMeta(
  client: MetaClient,
  adAccountId: string,
  level: InsightLevel,
): Promise<Map<string, EntityMeta>> {
  const fields =
    level === "adset"
      ? "id,status,effective_status,daily_budget,lifetime_budget"
      : "id,status,effective_status";
  const map = new Map<string, EntityMeta>();
  try {
    const rows = await client.getAll<EntityMeta>(
      `${adAccountId}/${EDGE_BY_LEVEL[level]}`,
      { fields },
    );
    for (const r of rows) {
      if (r.id) map.set(r.id, r);
    }
  } catch {
    // Silencioso: el pull de insights no debe caerse por falta de metadatos.
  }
  return map;
}
