/**
 * Lectura de CAMPAÑAS de Meta para el dashboard 5 Gatos (SOLO GET).
 *
 * Aporta lo que el nivel adset no trae:
 *   - objective de la campaña (para el header de cada bloque)
 *   - presupuesto CBO (daily_budget / lifetime_budget a nivel campaña:
 *     cuando la campaña usa Advantage Campaign Budget los adsets NO
 *     reportan presupuesto propio)
 *   - start_time / stop_time de la campaña (rango del plan)
 *
 * Una sola llamada paginada por cuenta, con el mismo retry por rate limit
 * que adsets.ts.
 */

import { withRateLimitRetry } from "./adsets";
import type { MetaClient } from "./client";

/** Metadatos de una campaña tal como llegan del edge /campaigns. */
export interface CampaignMeta {
  id: string;
  name: string;
  objective?: string;
  effective_status?: string;
  status?: string;
  /** COP enteros (cuenta 5 Gatos, offset 1). "0" o ausente = sin CBO. */
  daily_budget?: string;
  lifetime_budget?: string;
  /** Ojo: Meta a veces reporta epoch (1969) en campañas CBO sin fecha real. */
  start_time?: string;
  stop_time?: string | null;
  created_time?: string;
}

const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "objective",
  "effective_status",
  "status",
  "daily_budget",
  "lifetime_budget",
  "start_time",
  "stop_time",
  "created_time",
].join(",");

/** Todas las campañas de la cuenta con metadatos (paginado). */
export async function fetchCampaignsMeta(
  client: MetaClient,
  adAccountId: string,
): Promise<Map<string, CampaignMeta>> {
  const rows = await withRateLimitRetry(
    () =>
      client.getAll<CampaignMeta>(`${adAccountId}/campaigns`, {
        fields: CAMPAIGN_FIELDS,
      }),
    "campaigns",
  );
  const map = new Map<string, CampaignMeta>();
  for (const r of rows) {
    if (r.id) map.set(r.id, r);
  }
  return map;
}
