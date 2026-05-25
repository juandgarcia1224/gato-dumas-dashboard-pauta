/**
 * FUENTE ÚNICA DE VERDAD de las hojas y columnas del Google Sheet.
 * setup-sheets, writer y reader dependen de esto. Si cambias una columna,
 * cámbiala aquí y actualiza docs/DATA_SCHEMA.md.
 */

export const SHEET_TABS = {
  config: "00_Config",
  mediaPlan: "01_MediaPlan",
  campaigns: "02_Meta_Campaigns_Raw",
  adsets: "03_Meta_Adsets_Raw",
  ads: "04_Meta_Ads_Raw",
  pacing: "05_Daily_Pacing",
  alerts: "06_Alerts",
  updateLog: "07_Update_Log",
  mapping: "08_Campaign_Mapping",
  rangeSummaries: "10_Meta_Range_Summaries",
} as const;

export type SheetTab = (typeof SHEET_TABS)[keyof typeof SHEET_TABS];

export const HEADERS: Record<SheetTab, string[]> = {
  [SHEET_TABS.config]: [
    "client_id",
    "client_name",
    "account_group",
    "platform",
    "ad_account_id",
    "ad_account_name",
    "sede",
    "active",
    "notes",
  ],
  [SHEET_TABS.mediaPlan]: [
    "month",
    "platform",
    "account_group",
    "campaign_name",
    "sede",
    "objective",
    "start_date",
    "end_date",
    "planned_budget",
    "planned_result_type",
    "planned_results",
    "planned_cpa",
    "notes",
  ],
  [SHEET_TABS.campaigns]: [
    "pulled_at",
    "date_start",
    "date_stop",
    "platform",
    "account_group",
    "ad_account_id",
    "ad_account_name",
    "campaign_id",
    "campaign_name",
    "buying_type",
    "objective",
    "status",
    "effective_status",
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "inline_link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "results_type",
    "results",
    "cost_per_result",
    "actions_json",
    "raw_json",
  ],
  [SHEET_TABS.adsets]: [
    "pulled_at",
    "date_start",
    "date_stop",
    "platform",
    "account_group",
    "ad_account_id",
    "campaign_id",
    "campaign_name",
    "adset_id",
    "adset_name",
    "status",
    "effective_status",
    "daily_budget",
    "lifetime_budget",
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "inline_link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "results_type",
    "results",
    "cost_per_result",
    "actions_json",
    "raw_json",
  ],
  [SHEET_TABS.ads]: [
    "pulled_at",
    "date_start",
    "date_stop",
    "platform",
    "account_group",
    "ad_account_id",
    "campaign_id",
    "campaign_name",
    "adset_id",
    "adset_name",
    "ad_id",
    "ad_name",
    "status",
    "effective_status",
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "inline_link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "results_type",
    "results",
    "cost_per_result",
    "actions_json",
    "raw_json",
  ],
  [SHEET_TABS.pacing]: [
    "date",
    "month",
    "platform",
    "account_group",
    "planned_monthly_budget",
    "expected_spend_to_date",
    "actual_spend_to_date",
    "spend_delta",
    "spend_delta_pct",
    "pacing_status",
  ],
  [SHEET_TABS.alerts]: [
    "pulled_at",
    "platform",
    "account_group",
    "level",
    "entity_type",
    "entity_id",
    "entity_name",
    "metric",
    "value",
    "threshold",
    "message",
    "recommended_action",
  ],
  [SHEET_TABS.updateLog]: [
    "run_id",
    "started_at",
    "finished_at",
    "updated_by",
    "platform",
    "account_group",
    "status",
    "date_preset_or_range",
    "campaigns_count",
    "adsets_count",
    "ads_count",
    "error_message",
  ],
  [SHEET_TABS.mapping]: [
    "platform",
    "account_group",
    "campaign_id",
    "campaign_name",
    "sede",
    "program_type",
    "notes",
  ],
  [SHEET_TABS.rangeSummaries]: [
    "range_key",
    "pulled_at",
    "date_start",
    "date_stop",
    "platform",
    "account_group",
    "ad_account_id",
    "entity_level",
    "entity_id",
    "campaign_id",
    "campaign_name",
    "adset_id",
    "adset_name",
    "ad_id",
    "ad_name",
    "status",
    "effective_status",
    "daily_budget",
    "lifetime_budget",
    "spend",
    "impressions",
    "reach",
    "frequency",
    "clicks",
    "inline_link_clicks",
    "ctr",
    "cpc",
    "cpm",
    "results_type",
    "results",
    "cost_per_result",
    "actions_json",
  ],
};

/** Convierte un objeto fila a array ordenado según los headers de la hoja. */
export function rowToArray(
  tab: SheetTab,
  row: Record<string, unknown>,
): (string | number)[] {
  return HEADERS[tab].map((col) => {
    const v = row[col];
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    return String(v);
  });
}

/** Convierte filas de Sheets (array de arrays con header) a objetos. */
export function arrayToObjects(
  values: unknown[][],
): Record<string, string>[] {
  if (!values || values.length < 2) return [];
  const [header, ...rows] = values;
  return rows.map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      const v = r[i];
      // Normaliza a string: con UNFORMATTED_VALUE los números llegan como
      // number; String() usa punto decimal (locale-independiente).
      obj[String(h)] = v === null || v === undefined ? "" : String(v);
    });
    return obj;
  });
}
