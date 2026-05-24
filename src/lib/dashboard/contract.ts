/**
 * CONTRATO DE DATOS del dashboard.
 *
 * `DashboardPayload` es la forma exacta que devuelve GET /api/dashboard y que
 * consumen los componentes. Cloud Design debe diseñar SOBRE esta estructura
 * (ver docs/DESIGN_CONTRACT.md). No cambiar campos sin actualizar ambos.
 *
 * Principio: NUNCA datos inventados. Si falta algo, se refleja en
 * `status.notices` y los datos vienen vacíos/null, nunca con mock.
 */

import type { AccountGroupKey } from "../config/clients";
import type { AppEnv, EnvStatus } from "../config/env";
import {
  ACCOUNT_GROUPS,
  getAccountGroup,
} from "../config/clients";
import {
  buildAccountSummaries,
  computeKpis,
  filterByAccount,
  parseCampaignRows,
  type AccountSummary,
  type CampaignRecord,
  type Kpis,
} from "./metrics";

export type NoticeLevel = "info" | "warning" | "critical";

export interface Notice {
  level: NoticeLevel;
  code:
    | "token_missing"
    | "account_missing"
    | "sheet_missing"
    | "no_data"
    | "no_last_update"
    | "read_error";
  message: string;
}

export interface AdsetView {
  account_group: AccountGroupKey | string;
  campaign_name: string;
  adset_id: string;
  adset_name: string;
  effective_status: string;
  daily_budget: number | null;
  spend: number;
  impressions: number;
  frequency: number;
  ctr: number;
  results_type: string;
  results: number | null;
  cost_per_result: number | null;
}

export interface AdView {
  account_group: AccountGroupKey | string;
  campaign_name: string;
  adset_name: string;
  ad_id: string;
  ad_name: string;
  effective_status: string;
  spend: number;
  impressions: number;
  frequency: number;
  ctr: number;
  results_type: string;
  results: number | null;
  cost_per_result: number | null;
}

export interface AlertView {
  account_group: AccountGroupKey | string;
  level: string;
  entity_type: string;
  entity_name: string;
  metric: string;
  value: string;
  threshold: string;
  message: string;
  recommended_action: string;
}

export interface PacingView {
  month: string;
  account_group: AccountGroupKey | string;
  planned_monthly_budget: number | null;
  expected_spend_to_date: number | null;
  actual_spend_to_date: number;
  spend_delta: number | null;
  spend_delta_pct: number | null;
  pacing_status: string;
}

export interface LastUpdate {
  finished_at: string;
  updated_by: string;
  date_preset_or_range: string;
  perAccount: {
    account_group: string;
    label: string;
    status: string;
    campaigns_count: number;
    error_message: string;
  }[];
}

export interface DashboardPayload {
  generatedAt: string;
  client: { name: string; timezone: string };
  appliedAccountFilter: string;
  status: {
    metaReady: boolean;
    sheetsReady: boolean;
    accounts: { key: AccountGroupKey; label: string; configured: boolean }[];
    notices: Notice[];
  };
  lastUpdate: LastUpdate | null;
  total: Kpis;
  accounts: AccountSummary[];
  campaigns: CampaignRecord[];
  adsets: AdsetView[];
  ads: AdView[];
  alerts: AlertView[];
  pacing: PacingView[];
}

export interface RawTabs {
  campaigns: Record<string, string>[];
  adsets: Record<string, string>[];
  ads: Record<string, string>[];
  alerts: Record<string, string>[];
  pacing: Record<string, string>[];
  updateLog: Record<string, string>[];
}

export function emptyTabs(): RawTabs {
  return {
    campaigns: [],
    adsets: [],
    ads: [],
    alerts: [],
    pacing: [],
    updateLog: [],
  };
}

function num(v: string | undefined): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}
function numOrNull(v: string | undefined): number | null {
  if (v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function matchesFilter(group: string, filter: string): boolean {
  return filter === "all" || group === filter;
}

export function buildDashboardPayload(input: {
  appEnv: AppEnv;
  envStatus: EnvStatus;
  tabs: RawTabs;
  accountFilter: string;
  readError?: string;
}): DashboardPayload {
  const { appEnv, envStatus, tabs } = input;
  const filter =
    input.accountFilter && getAccountGroup(input.accountFilter)
      ? input.accountFilter
      : "all";

  // --- Notices (estados claros, nunca mock) ---
  const notices: Notice[] = [];
  if (input.readError) {
    notices.push({
      level: "critical",
      code: "read_error",
      message: `Error al leer Google Sheets: ${input.readError}`,
    });
  }
  if (!envStatus.metaToken) {
    notices.push({
      level: "warning",
      code: "token_missing",
      message: "Token de Meta no configurado (META_ACCESS_TOKEN).",
    });
  }
  for (const g of ACCOUNT_GROUPS) {
    if (!envStatus.metaAccounts[g.key]) {
      notices.push({
        level: "warning",
        code: "account_missing",
        message: `Cuenta publicitaria no configurada: ${g.label} (${g.envVar}).`,
      });
    }
  }
  if (!envStatus.sheetsReady) {
    notices.push({
      level: "critical",
      code: "sheet_missing",
      message:
        "Google Sheet no configurado. Define GOOGLE_SHEET_ID y credenciales del service account.",
    });
  }

  // --- Campañas (base de KPIs) ---
  const allCampaigns = parseCampaignRows(tabs.campaigns);
  const campaigns = filterByAccount(allCampaigns, filter);

  if (envStatus.sheetsReady && allCampaigns.length === 0 && !input.readError) {
    notices.push({
      level: "info",
      code: "no_data",
      message:
        "Sin datos para este rango. Ejecuta `npm run meta:update` para poblar las hojas.",
    });
  }

  // --- Alertas (filtradas) ---
  const alerts: AlertView[] = tabs.alerts
    .filter((r) => matchesFilter(r.account_group, filter))
    .map((r) => ({
      account_group: r.account_group,
      level: r.level ?? "info",
      entity_type: r.entity_type ?? "",
      entity_name: r.entity_name ?? "",
      metric: r.metric ?? "",
      value: r.value ?? "",
      threshold: r.threshold ?? "",
      message: r.message ?? "",
      recommended_action: r.recommended_action ?? "",
    }));

  const criticalByAccount: Record<string, number> = {};
  for (const a of tabs.alerts) {
    if (a.level === "critical") {
      criticalByAccount[a.account_group] =
        (criticalByAccount[a.account_group] ?? 0) + 1;
    }
  }
  const totalCritical = filter === "all"
    ? Object.values(criticalByAccount).reduce((a, b) => a + b, 0)
    : criticalByAccount[filter] ?? 0;

  // --- KPIs ---
  const total = computeKpis(campaigns, totalCritical);
  const accounts = buildAccountSummaries(
    allCampaigns,
    envStatus.metaAccounts,
    criticalByAccount,
  );

  // --- Adsets / Ads (vistas filtradas) ---
  const adsets: AdsetView[] = tabs.adsets
    .filter((r) => r.adset_id && matchesFilter(r.account_group, filter))
    .map((r) => ({
      account_group: r.account_group,
      campaign_name: r.campaign_name ?? "",
      adset_id: r.adset_id ?? "",
      adset_name: r.adset_name ?? "",
      effective_status: r.effective_status ?? "",
      daily_budget: numOrNull(r.daily_budget),
      spend: num(r.spend),
      impressions: num(r.impressions),
      frequency: num(r.frequency),
      ctr: num(r.ctr),
      results_type: r.results_type ?? "",
      results: numOrNull(r.results),
      cost_per_result: numOrNull(r.cost_per_result),
    }));

  const ads: AdView[] = tabs.ads
    .filter((r) => r.ad_id && matchesFilter(r.account_group, filter))
    .map((r) => ({
      account_group: r.account_group,
      campaign_name: r.campaign_name ?? "",
      adset_name: r.adset_name ?? "",
      ad_id: r.ad_id ?? "",
      ad_name: r.ad_name ?? "",
      effective_status: r.effective_status ?? "",
      spend: num(r.spend),
      impressions: num(r.impressions),
      frequency: num(r.frequency),
      ctr: num(r.ctr),
      results_type: r.results_type ?? "",
      results: numOrNull(r.results),
      cost_per_result: numOrNull(r.cost_per_result),
    }));

  // --- Pacing (filtrado) ---
  const pacing: PacingView[] = tabs.pacing
    .filter((r) => matchesFilter(r.account_group, filter))
    .map((r) => ({
      month: r.month ?? "",
      account_group: r.account_group,
      planned_monthly_budget: numOrNull(r.planned_monthly_budget),
      expected_spend_to_date: numOrNull(r.expected_spend_to_date),
      actual_spend_to_date: num(r.actual_spend_to_date),
      spend_delta: numOrNull(r.spend_delta),
      spend_delta_pct: numOrNull(r.spend_delta_pct),
      pacing_status: r.pacing_status ?? "no_plan",
    }));

  // --- Última actualización (último run del log) ---
  const lastUpdate = buildLastUpdate(tabs.updateLog);
  if (!lastUpdate) {
    notices.push({
      level: "info",
      code: "no_last_update",
      message: "Última actualización no disponible.",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    client: { name: appEnv.clientName, timezone: appEnv.timezone },
    appliedAccountFilter: filter,
    status: {
      metaReady: envStatus.metaReady,
      sheetsReady: envStatus.sheetsReady,
      accounts: ACCOUNT_GROUPS.map((g) => ({
        key: g.key,
        label: g.label,
        configured: Boolean(envStatus.metaAccounts[g.key]),
      })),
      notices,
    },
    lastUpdate,
    total,
    accounts,
    campaigns,
    adsets,
    ads,
    alerts,
    pacing,
  };
}

function buildLastUpdate(
  log: Record<string, string>[],
): LastUpdate | null {
  if (log.length === 0) return null;
  // El último run_id por orden de aparición (append cronológico).
  const lastRunId = log[log.length - 1].run_id;
  const rows = log.filter((r) => r.run_id === lastRunId);
  if (rows.length === 0) return null;
  return {
    finished_at: rows[0].finished_at ?? "",
    updated_by: rows[0].updated_by ?? "",
    date_preset_or_range: rows[0].date_preset_or_range ?? "",
    perAccount: rows.map((r) => ({
      account_group: r.account_group,
      label: getAccountGroup(r.account_group)?.label ?? r.account_group,
      status: r.status ?? "",
      campaigns_count: num(r.campaigns_count),
      error_message: r.error_message ?? "",
    })),
  };
}
