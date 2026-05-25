/**
 * CONTRATO DE DATOS del dashboard.
 *
 * `DashboardPayload` es la forma exacta que devuelve GET /api/dashboard y que
 * consumen los componentes. NUNCA datos inventados: si falta algo, se refleja
 * en `status.notices` y los datos vienen vacíos, nunca mock.
 *
 * Bloque 10: soporta `view` (consolidado/gato_colombia/bogota/barranquilla/
 * gato_bucaramanga) y disponibilidad por `range`. Si el rango pedido no está
 * cargado, se devuelve vacío + comando sugerido (no se reusa otro rango).
 */

import type { AccountGroupKey } from "../config/clients";
import type { AppEnv, EnvStatus } from "../config/env";
import { ACCOUNT_GROUPS, getAccountGroup } from "../config/clients";
import {
  buildAccountSummaries,
  computeKpis,
  parseCampaignRows,
  type AccountSummary,
  type CampaignRecord,
  type Kpis,
} from "./metrics";
import {
  inferSede,
  isViewKey,
  rowMatchesView,
  VIEWS,
  viewLabel,
  type Sede,
  type ViewKey,
} from "./sede";

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
  requested: { key: string; label: string; dateStart?: string; dateStop?: string };
  loaded: { key: string; label: string; dateStart: string; dateStop: string } | null;
  available: boolean;
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
  range: RangeInfo;
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
  alerts: Record<string, string>[];
  pacing: Record<string, string>[];
  updateLog: Record<string, string>[];
  mapping: Record<string, string>[];
}

export function emptyTabs(): RawTabs {
  return { campaigns: [], adsets: [], ads: [], alerts: [], pacing: [], updateLog: [], mapping: [] };
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

// ---------- Rango ----------
const PRESET_LABELS: Record<string, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  last_7d: "Últimos 7 días",
  this_month: "Mes actual",
  custom: "Personalizado",
};

function rangeLabel(key: string, dateStart?: string, dateStop?: string): string {
  if (key === "custom" && dateStart && dateStop) {
    return `${dateStart} – ${dateStop}`;
  }
  return PRESET_LABELS[key] ?? key;
}

function suggestedCommand(req: RangeInfo["requested"]): string {
  const base = 'META_ACCESS_TOKEN="<TOKEN>" npm run meta:update --';
  if (req.key === "custom" && req.dateStart && req.dateStop) {
    return `${base} --dateStart ${req.dateStart} --dateStop ${req.dateStop} --updatedBy Juan`;
  }
  return `${base} --range ${req.key} --updatedBy Juan`;
}

// ---------- Sede resolver ----------
function makeSedeResolver(mapping: Record<string, string>[]) {
  const byId = new Map<string, Sede>();
  for (const m of mapping) {
    const id = (m.campaign_id || "").trim();
    const sede = (m.sede || "").trim().toLowerCase() as Sede;
    if (id && sede) byId.set(id, sede);
  }
  return (accountGroup: string, names: (string | undefined)[], campaignId?: string): Sede => {
    const mappingSede = campaignId ? byId.get(campaignId) : undefined;
    return inferSede({ accountGroup, names, mappingSede });
  };
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

  const notices: Notice[] = [];
  if (input.readError) {
    notices.push({ level: "critical", code: "read_error", message: `Error al leer Google Sheets: ${input.readError}` });
  }
  if (!envStatus.metaToken) {
    notices.push({ level: "info", code: "token_missing", message: "Meta se actualiza manualmente con token temporal (no se guarda)." });
  }
  for (const g of ACCOUNT_GROUPS) {
    if (!envStatus.metaAccounts[g.key]) {
      notices.push({ level: "warning", code: "account_missing", message: `Cuenta publicitaria no configurada: ${g.label} (${g.envVar}).` });
    }
  }
  if (!envStatus.sheetsReady) {
    notices.push({ level: "critical", code: "sheet_missing", message: "Google Sheet no configurado. Define GOOGLE_SHEET_ID y credenciales del service account." });
  }

  const lastUpdate = buildLastUpdate(tabs.updateLog);

  // --- Campañas con sede inferida ---
  const allCampaigns = parseCampaignRows(tabs.campaigns);
  for (const c of allCampaigns) {
    c.sede = resolveSede(c.account_group, [c.campaign_name], c.campaign_id);
  }

  // --- Rango: ¿el rango pedido coincide con el cargado? ---
  const loadedDates =
    allCampaigns.length > 0
      ? { dateStart: allCampaigns[0].date_start, dateStop: allCampaigns[0].date_stop }
      : null;
  const loadedKeyRaw = lastUpdate?.date_preset_or_range ?? "";
  const loadedKey = loadedKeyRaw.includes("..") ? "custom" : loadedKeyRaw || "this_month";
  const loaded =
    loadedDates && loadedKeyRaw
      ? {
          key: loadedKey,
          label: rangeLabel(loadedKey, loadedDates.dateStart, loadedDates.dateStop),
          dateStart: loadedDates.dateStart,
          dateStop: loadedDates.dateStop,
        }
      : loadedDates
        ? { key: loadedKey, label: rangeLabel(loadedKey, loadedDates.dateStart, loadedDates.dateStop), dateStart: loadedDates.dateStart, dateStop: loadedDates.dateStop }
        : null;

  // Si no se pide rango, se asume el cargado (mostrar lo que hay).
  const reqKey = input.range && input.range.trim() ? input.range.trim() : loadedKey;
  const requested = {
    key: reqKey,
    label: rangeLabel(reqKey, input.dateStart, input.dateStop),
    ...(reqKey === "custom" ? { dateStart: input.dateStart, dateStop: input.dateStop } : {}),
  };

  let available: boolean;
  if (!loaded || allCampaigns.length === 0) {
    available = false;
  } else if (!input.range || !input.range.trim()) {
    available = true; // sin pedir rango → mostrar lo cargado
  } else if (reqKey === "custom") {
    available = Boolean(
      input.dateStart && input.dateStop &&
      input.dateStart === loaded.dateStart && input.dateStop === loaded.dateStop,
    );
  } else {
    available = reqKey === loaded.key;
  }

  const range: RangeInfo = { requested, loaded, available, suggestedCommand: suggestedCommand(requested) };

  // --- Si el rango no está disponible: vacío + aviso (no inventar) ---
  if (envStatus.sheetsReady && loaded && !available) {
    notices.push({
      level: "info",
      code: "range_unavailable",
      message: `No hay datos cargados para "${requested.label}". Sincroniza ese rango y recarga.`,
    });
  }
  if (envStatus.sheetsReady && allCampaigns.length === 0 && !input.readError) {
    notices.push({ level: "info", code: "no_data", message: "Sin datos cargados. Ejecuta `npm run meta:update` para poblar las hojas." });
  }
  if (!lastUpdate) {
    notices.push({ level: "info", code: "no_last_update", message: "Última actualización no disponible." });
  }

  // --- Filtrado por vista (solo si el rango está disponible) ---
  const usableCampaigns = available ? allCampaigns : [];
  const viewCampaigns = usableCampaigns.filter((c) =>
    rowMatchesView(c.account_group, c.sede ?? "unclassified", view),
  );

  const adsets: AdsetView[] = (available ? tabs.adsets : [])
    .filter((r) => r.adset_id)
    .map((r) => {
      const sede = resolveSede(r.account_group, [r.adset_name, r.campaign_name], r.campaign_id);
      return {
        account_group: r.account_group,
        sede,
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
      };
    })
    .filter((r) => rowMatchesView(String(r.account_group), r.sede, view));

  const ads: AdView[] = (available ? tabs.ads : [])
    .filter((r) => r.ad_id)
    .map((r) => {
      const sede = resolveSede(r.account_group, [r.ad_name, r.campaign_name], r.campaign_id);
      return {
        account_group: r.account_group,
        sede,
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
      };
    })
    .filter((r) => rowMatchesView(String(r.account_group), r.sede, view));

  // --- Alertas (filtradas por vista, con sede inferida del entity) ---
  const alerts: AlertView[] = (available ? tabs.alerts : [])
    .filter((r) => {
      const sede = resolveSede(r.account_group, [r.entity_name], r.entity_id);
      return rowMatchesView(r.account_group, sede, view);
    })
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
  const criticalForView = alerts.filter((a) => a.level === "critical").length;

  // --- KPIs de la vista ---
  const total = computeKpis(viewCampaigns, criticalForView);

  // --- Resumen por cuenta (siempre ambas cuentas, sobre el rango disponible) ---
  const criticalByAccount: Record<string, number> = {};
  for (const a of available ? tabs.alerts : []) {
    if (a.level === "critical") criticalByAccount[a.account_group] = (criticalByAccount[a.account_group] ?? 0) + 1;
  }
  const accounts = buildAccountSummaries(usableCampaigns, envStatus.metaAccounts, criticalByAccount);

  // --- Pacing por vista (plan es por cuenta; sedes no tienen plan propio) ---
  const pacingAll: PacingView[] = (available ? tabs.pacing : []).map((r) => ({
    month: r.month ?? "",
    account_group: r.account_group,
    planned_monthly_budget: numOrNull(r.planned_monthly_budget),
    expected_spend_to_date: numOrNull(r.expected_spend_to_date),
    actual_spend_to_date: num(r.actual_spend_to_date),
    spend_delta: numOrNull(r.spend_delta),
    spend_delta_pct: numOrNull(r.spend_delta_pct),
    pacing_status: r.pacing_status ?? "no_plan",
  }));
  const pacing =
    view === "consolidado"
      ? pacingAll
      : view === "gato_colombia"
        ? pacingAll.filter((p) => p.account_group === "gato_colombia")
        : view === "gato_bucaramanga"
          ? pacingAll.filter((p) => p.account_group === "gato_bucaramanga")
          : []; // bogota / barranquilla: no hay plan por sede

  // --- Campañas sin clasificar (de Gato Colombia) ---
  const unclassifiedList: UnclassifiedCampaign[] = usableCampaigns
    .filter((c) => c.account_group === "gato_colombia" && (c.sede === "unclassified" || c.sede === "ambiguous"))
    .map((c) => ({
      campaign_name: c.campaign_name,
      campaign_id: c.campaign_id,
      spend: c.spend,
      results: c.results,
      reason: c.sede === "ambiguous" ? "Nombre con términos de ambas sedes (BOG y BAQ)" : "No se detectó BOG/Bogotá ni BAQ/Barranquilla",
    }));
  if (unclassifiedList.length > 0 && (view === "consolidado" || view === "gato_colombia")) {
    notices.push({
      level: "info",
      code: "unclassified",
      message: `Hay ${unclassifiedList.length} campaña(s) de Gato Colombia sin sede clasificada.`,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    client: { name: appEnv.clientName, timezone: appEnv.timezone },
    appliedView: view,
    availableViews: VIEWS.map((v) => ({ key: v.key, label: v.label })),
    range,
    status: {
      metaReady: envStatus.metaReady,
      sheetsReady: envStatus.sheetsReady,
      accounts: ACCOUNT_GROUPS.map((g) => ({ key: g.key, label: g.label, configured: Boolean(envStatus.metaAccounts[g.key]) })),
      notices,
    },
    lastUpdate,
    total,
    accounts,
    campaigns: viewCampaigns,
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

// Reexport para el frontend.
export { viewLabel };
