/**
 * CONTRATO DE DATOS del dashboard (Bloque 11: histórico diario).
 *
 * Modelo: las hojas RAW guardan filas DIARIAS (date_start===date_stop) por
 * upsert. El dashboard agrega por el rango seleccionado, calcula KPIs, alertas
 * y pacing EN VIVO. Filas de snapshot agregado (date_start≠date_stop) se ignoran
 * para filtrar por fecha. NUNCA datos inventados.
 */

import type { AppEnv, EnvStatus } from "../config/env";
import { ACCOUNT_GROUPS, getAccountGroup, type AccountGroupKey } from "../config/clients";
import {
  buildAccountSummaries,
  computeKpis,
  parseCampaignRows,
  type AccountSummary,
  type CampaignRecord,
  type Kpis,
} from "./metrics";
import { inferSede, isViewKey, rowMatchesView, VIEWS, viewLabel, type Sede, type ViewKey } from "./sede";
import {
  aggregateDailyByEntity,
  availableMonthsFrom,
  spendByAccountInRange,
} from "./aggregate";
import { resolveRange, todayBogota, monthLabel, monthStart, monthEnd, daysInMonth } from "./range";
import { buildCampaignAlerts, DEFAULT_ALERT_THRESHOLDS } from "./alerts";
import { plannedBudgetByAccount } from "./pacing";

export type NoticeLevel = "info" | "warning" | "critical";

export interface Notice {
  level: NoticeLevel;
  code:
    | "token_missing"
    | "account_missing"
    | "sheet_missing"
    | "no_data"
    | "no_last_update"
    | "read_error"
    | "range_unavailable"
    | "snapshot_only"
    | "unclassified";
  message: string;
}

export interface AdsetView {
  account_group: AccountGroupKey | string;
  sede: Sede;
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
  sede: Sede;
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

export interface RangeInfo {
  requested: { key: string; label: string };
  available: boolean;
  monthlyPacing: boolean;
  suggestedCommand: string;
}

export interface UnclassifiedCampaign {
  campaign_name: string;
  campaign_id: string;
  spend: number;
  results: number | null;
  reason: string;
}

export interface DashboardPayload {
  generatedAt: string;
  client: { name: string; timezone: string };
  appliedView: string;
  availableViews: { key: string; label: string }[];
  availableMonths: { key: string; label: string }[];
  range: RangeInfo;
  snapshotOnly: boolean;
  pacingNote: string | null;
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
  unclassified: { count: number; campaigns: UnclassifiedCampaign[] };
}

export interface RawTabs {
  campaigns: Record<string, string>[];
  adsets: Record<string, string>[];
  ads: Record<string, string>[];
  updateLog: Record<string, string>[];
  mapping: Record<string, string>[];
  mediaPlan: Record<string, string>[];
}

export function emptyTabs(): RawTabs {
  return { campaigns: [], adsets: [], ads: [], updateLog: [], mapping: [], mediaPlan: [] };
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
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function makeSedeResolver(mapping: Record<string, string>[]) {
  const byId = new Map<string, Sede>();
  for (const m of mapping) {
    const id = (m.campaign_id || "").trim();
    const sede = (m.sede || "").trim().toLowerCase() as Sede;
    if (id && sede) byId.set(id, sede);
  }
  return (accountGroup: string, names: (string | undefined)[], campaignId?: string): Sede =>
    inferSede({ accountGroup, names, mappingSede: campaignId ? byId.get(campaignId) : undefined });
}

function suggestedCommand(key: string): string {
  const base = 'META_ACCESS_TOKEN="<TOKEN>" npm run meta:update --';
  if (/^\d{4}-\d{2}$/.test(key)) {
    const today = todayBogota();
    const stop = key === today.slice(0, 7) ? today : monthEnd(key);
    return `${base} --dateStart ${monthStart(key)} --dateStop ${stop} --updatedBy Juan`;
  }
  return `${base} --range ${key} --updatedBy Juan`;
}

function buildLivePacing(
  view: ViewKey,
  month: string | undefined,
  kind: string,
  dailyCampaignRows: Record<string, string>[],
  start: string,
  stop: string,
  mediaPlan: Record<string, string>[],
  today: string,
): { rows: PacingView[]; note: string | null } {
  if (kind !== "month" || !month) {
    return { rows: [], note: "Pacing mensual no disponible para este rango. Selecciona un mes." };
  }
  if (view === "bogota" || view === "barranquilla") {
    return { rows: [], note: "El presupuesto está cargado a nivel Gato Colombia, no por sede." };
  }
  const planned = plannedBudgetByAccount(mediaPlan, month);
  const actual = spendByAccountInRange(dailyCampaignRows, start, stop);
  const dim = daysInMonth(month);
  const isCurrent = month === today.slice(0, 7);
  const dom = isCurrent ? Math.min(Number(today.slice(8, 10)), dim) : dim;
  const fraction = dom / dim;

  const accounts: AccountGroupKey[] =
    view === "gato_colombia"
      ? ["gato_colombia"]
      : view === "gato_bucaramanga"
        ? ["gato_bucaramanga"]
        : ["gato_colombia", "gato_bucaramanga"];

  const rows: PacingView[] = [];
  const sinPlan: string[] = [];
  for (const acc of accounts) {
    const p = planned[acc] ?? null;
    const a = actual[acc] ?? 0;
    if (!p || p <= 0) {
      sinPlan.push(getAccountGroup(acc)?.label ?? acc);
      rows.push({ month, account_group: acc, planned_monthly_budget: null, expected_spend_to_date: null, actual_spend_to_date: round(a), spend_delta: null, spend_delta_pct: null, pacing_status: "no_plan" });
      continue;
    }
    const expected = p * fraction;
    const delta = a - expected;
    const deltaPct = expected > 0 ? (delta / expected) * 100 : null;
    let status = "on_track";
    if (deltaPct !== null && deltaPct > 15) status = "overpacing";
    else if (deltaPct !== null && deltaPct < -20) status = "underpacing";
    rows.push({
      month,
      account_group: acc,
      planned_monthly_budget: p,
      expected_spend_to_date: round(expected),
      actual_spend_to_date: round(a),
      spend_delta: round(delta),
      spend_delta_pct: deltaPct === null ? null : round(deltaPct),
      pacing_status: status,
    });
  }
  const note = sinPlan.length ? `${sinPlan.join(", ")} sin plan mensual: excluida(s).` : null;
  return { rows, note };
}

export function buildDashboardPayload(input: {
  appEnv: AppEnv;
  envStatus: EnvStatus;
  tabs: RawTabs;
  view: string;
  range?: string;
  dateStart?: string;
  dateStop?: string;
  readError?: string;
}): DashboardPayload {
  const { appEnv, envStatus, tabs } = input;
  const view: ViewKey = isViewKey(input.view) ? input.view : "consolidado";
  const resolveSede = makeSedeResolver(tabs.mapping);
  const today = todayBogota();
  const lastUpdate = buildLastUpdate(tabs.updateLog);

  const notices: Notice[] = [];
  if (input.readError) notices.push({ level: "critical", code: "read_error", message: `Error al leer Google Sheets: ${input.readError}` });
  if (!envStatus.metaToken) notices.push({ level: "info", code: "token_missing", message: "Meta se actualiza manualmente con token temporal (no se guarda)." });
  for (const g of ACCOUNT_GROUPS) {
    if (!envStatus.metaAccounts[g.key]) notices.push({ level: "warning", code: "account_missing", message: `Cuenta publicitaria no configurada: ${g.label} (${g.envVar}).` });
  }
  if (!envStatus.sheetsReady) notices.push({ level: "critical", code: "sheet_missing", message: "Google Sheet no configurado." });
  if (!lastUpdate) notices.push({ level: "info", code: "no_last_update", message: "Última actualización no disponible." });

  // --- Histórico diario disponible ---
  const months = availableMonthsFrom(tabs.campaigns);
  const hasDaily = months.length > 0;
  const hasSnapshot = tabs.campaigns.some((r) => r.date_start && r.date_start !== r.date_stop);

  // Rango pedido (default: último mes con datos, o mes actual)
  const defaultKey = months.length ? months[months.length - 1] : "this_month";
  const reqKey = input.range && input.range.trim() ? input.range.trim() : defaultKey;
  const resolved = resolveRange(reqKey, input.dateStart, input.dateStop, today);
  const reqLabel = resolved?.label ?? reqKey;

  // ¿Hay datos diarios para el rango?
  const aggCampaignsRaw = resolved
    ? aggregateDailyByEntity(tabs.campaigns, "campaign_id", resolved.start, resolved.stop)
    : [];
  const available = aggCampaignsRaw.length > 0;
  const snapshotOnly = !hasDaily && hasSnapshot;

  if (snapshotOnly) {
    notices.push({
      level: "warning",
      code: "snapshot_only",
      message: "Hay un snapshot agregado pero NO histórico diario. Carga histórico diario para filtrar por mes/fecha.",
    });
  } else if (envStatus.sheetsReady && !hasDaily && !hasSnapshot && !input.readError) {
    notices.push({ level: "info", code: "no_data", message: "Sin datos cargados. Ejecuta `npm run meta:update`." });
  } else if (hasDaily && resolved && !available) {
    notices.push({ level: "info", code: "range_unavailable", message: `No hay datos diarios cargados para "${reqLabel}".` });
  }

  // --- Agregados por rango (una fila por entidad) ---
  const allRecords: CampaignRecord[] = available ? parseCampaignRows(aggCampaignsRaw) : [];
  for (const c of allRecords) c.sede = resolveSede(c.account_group, [c.campaign_name], c.campaign_id);

  const viewRecords = allRecords.filter((c) => rowMatchesView(c.account_group, c.sede ?? "unclassified", view));

  const aggAdsetsRaw = available && resolved ? aggregateDailyByEntity(tabs.adsets, "adset_id", resolved.start, resolved.stop) : [];
  const adsets: AdsetView[] = aggAdsetsRaw
    .map((r) => {
      const sede = resolveSede(r.account_group, [r.adset_name, r.campaign_name], r.campaign_id);
      return {
        account_group: r.account_group, sede,
        campaign_name: r.campaign_name ?? "", adset_id: r.adset_id ?? "", adset_name: r.adset_name ?? "",
        effective_status: r.effective_status ?? "", daily_budget: numOrNull(r.daily_budget),
        spend: num(r.spend), impressions: num(r.impressions), frequency: num(r.frequency), ctr: num(r.ctr),
        results_type: r.results_type ?? "", results: numOrNull(r.results), cost_per_result: numOrNull(r.cost_per_result),
      };
    })
    .filter((r) => rowMatchesView(String(r.account_group), r.sede, view));

  const aggAdsRaw = available && resolved ? aggregateDailyByEntity(tabs.ads, "ad_id", resolved.start, resolved.stop) : [];
  const ads: AdView[] = aggAdsRaw
    .map((r) => {
      const sede = resolveSede(r.account_group, [r.ad_name, r.campaign_name], r.campaign_id);
      return {
        account_group: r.account_group, sede,
        campaign_name: r.campaign_name ?? "", adset_name: r.adset_name ?? "", ad_id: r.ad_id ?? "", ad_name: r.ad_name ?? "",
        effective_status: r.effective_status ?? "",
        spend: num(r.spend), impressions: num(r.impressions), frequency: num(r.frequency), ctr: num(r.ctr),
        results_type: r.results_type ?? "", results: numOrNull(r.results), cost_per_result: numOrNull(r.cost_per_result),
      };
    })
    .filter((r) => rowMatchesView(String(r.account_group), r.sede, view));

  // --- Alertas EN VIVO sobre los agregados del rango, filtradas por vista ---
  const generatedAt = new Date().toISOString();
  const allAlerts = available ? buildCampaignAlerts(allRecords, generatedAt, DEFAULT_ALERT_THRESHOLDS) : [];
  const alerts: AlertView[] = allAlerts
    .filter((a) => {
      const sede = resolveSede(a.account_group, [a.entity_name], a.entity_id);
      return rowMatchesView(a.account_group, sede, view);
    })
    .map((a) => ({
      account_group: a.account_group, level: a.level, entity_type: a.entity_type,
      entity_name: a.entity_name, metric: a.metric, value: String(a.value), threshold: String(a.threshold),
      message: a.message, recommended_action: a.recommended_action,
    }));
  const criticalForView = alerts.filter((a) => a.level === "critical").length;

  // --- KPIs ---
  const total = computeKpis(viewRecords, criticalForView);

  // --- Resumen por cuenta (siempre ambas, sobre el rango) ---
  const criticalByAccount: Record<string, number> = {};
  for (const a of allAlerts) {
    if (a.level === "critical") criticalByAccount[a.account_group] = (criticalByAccount[a.account_group] ?? 0) + 1;
  }
  const accounts = buildAccountSummaries(allRecords, envStatus.metaAccounts, criticalByAccount);

  // --- Pacing EN VIVO (mensual) ---
  const { rows: pacing, note: pacingNote } = available && resolved
    ? buildLivePacing(view, resolved.month, resolved.kind, tabs.campaigns, resolved.start, resolved.stop, tabs.mediaPlan, today)
    : { rows: [], note: null };

  // --- Sin clasificar (Gato Colombia) ---
  const unclassifiedList: UnclassifiedCampaign[] = allRecords
    .filter((c) => c.account_group === "gato_colombia" && (c.sede === "unclassified" || c.sede === "ambiguous"))
    .map((c) => ({
      campaign_name: c.campaign_name, campaign_id: c.campaign_id, spend: c.spend, results: c.results,
      reason: c.sede === "ambiguous" ? "Nombre con términos de ambas sedes" : "No se detectó BOG/Bogotá ni BAQ/Barranquilla",
    }));
  if (unclassifiedList.length > 0 && (view === "consolidado" || view === "gato_colombia")) {
    notices.push({ level: "info", code: "unclassified", message: `Hay ${unclassifiedList.length} campaña(s) de Gato Colombia sin sede clasificada.` });
  }

  return {
    generatedAt,
    client: { name: appEnv.clientName, timezone: appEnv.timezone },
    appliedView: view,
    availableViews: VIEWS.map((v) => ({ key: v.key, label: v.label })),
    availableMonths: months.map((m) => ({ key: m, label: monthLabel(m) })),
    range: {
      requested: { key: reqKey, label: reqLabel },
      available,
      monthlyPacing: resolved?.kind === "month",
      suggestedCommand: suggestedCommand(reqKey),
    },
    snapshotOnly,
    pacingNote,
    status: {
      metaReady: envStatus.metaReady,
      sheetsReady: envStatus.sheetsReady,
      accounts: ACCOUNT_GROUPS.map((g) => ({ key: g.key, label: g.label, configured: Boolean(envStatus.metaAccounts[g.key]) })),
      notices,
    },
    lastUpdate,
    total,
    accounts,
    campaigns: viewRecords,
    adsets,
    ads,
    alerts,
    pacing,
    unclassified: { count: unclassifiedList.length, campaigns: unclassifiedList },
  };
}

function buildLastUpdate(log: Record<string, string>[]): LastUpdate | null {
  if (log.length === 0) return null;
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

export { viewLabel };
