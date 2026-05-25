/**
 * ADAPTADOR diseño ↔ datos reales.
 *
 * Convierte el DashboardPayload (fuente real: /api/dashboard → Sheets → Meta)
 * en los view-models que consumen los componentes de Cloud Design.
 *
 * Reglas duras:
 * - NUNCA inventa números. Si falta un dato → placeholder '$—' / '—'.
 * - No usa data.js / mock. Todo sale del payload real.
 */

import type { DashboardPayload } from "./contract";
import type { AccountSummary, Kpis } from "./metrics";
import { getAccountGroup } from "../config/clients";
import {
  formatCOP,
  formatDecimal,
  formatNumber,
  formatPercent,
  formatUpdatePremium,
  isSameBogotaDay,
} from "./formatters";
import type {
  AccountVM,
  AdVM,
  AdsetVM,
  AlertVM,
  BannerVM,
  CampaignVM,
  DashboardVM,
  EntityStatus,
  ExecBlock,
  MetricVM,
  PacingVM,
  Severity,
} from "./design-types";

const CURRENCY_EMPTY = "$—";
const NUMBER_EMPTY = "—";

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}
function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function copOrEmpty(v: number | null | undefined): string {
  return v === null || v === undefined ? CURRENCY_EMPTY : formatCOP(v);
}
function numOrEmpty(v: number | null | undefined): string {
  return v === null || v === undefined ? NUMBER_EMPTY : formatNumber(v);
}
function pctOrEmpty(v: number | null | undefined): string {
  return v === null || v === undefined ? NUMBER_EMPTY : formatPercent(v, 1);
}

function mapEntityStatus(effective: string): EntityStatus {
  const v = (effective || "").toUpperCase();
  if (v.includes("ACTIVE")) return "active";
  if (v.includes("ARCHIV") || v.includes("DELET")) return "archived";
  if (v.includes("DRAFT") || v.includes("PENDING") || v.includes("PROCESS"))
    return "draft";
  return "paused";
}

const METRIC_LABELS: Record<string, string> = {
  frequency: "Frecuencia",
  ctr: "CTR",
  spend: "Gasto",
  cpc: "CPC",
  cpm: "CPM",
  pacing: "Pacing",
};

function sevFromLevel(level: string): Severity {
  if (level === "critical" || level === "crit") return "crit";
  if (level === "warning" || level === "warn") return "warn";
  if (level === "ok") return "ok";
  return "info";
}

function sevLabel(sev: Severity): string {
  return sev === "crit" ? "Crítico" : sev === "warn" ? "Atención" : sev === "ok" ? "Sano" : "Aviso";
}

function targetTypeEs(entityType: string): string {
  switch (entityType) {
    case "campaign":
      return "Campaña";
    case "adset":
      return "Conjunto";
    case "ad":
      return "Anuncio";
    case "account":
      return "Cuenta";
    default:
      return entityType || "—";
  }
}

/** Mapa entity_name → peor severidad de alerta, para marcar filas de tabla. */
function rowAlertMap(
  alerts: DashboardPayload["alerts"],
): Map<string, "crit" | "warn" | "info"> {
  const rank: Record<string, number> = { crit: 0, warn: 1, info: 2 };
  const map = new Map<string, "crit" | "warn" | "info">();
  for (const a of alerts) {
    const sev = sevFromLevel(a.level);
    if (sev === "ok") continue;
    const cur = map.get(a.entity_name);
    if (!cur || rank[sev] < rank[cur]) {
      map.set(a.entity_name, sev as "crit" | "warn" | "info");
    }
  }
  return map;
}

// ---------- KPIs ----------
function buildKpis(
  total: Kpis,
  connected: boolean,
  plannedTotal: number | null,
  actualTotal: number,
  rangeLabel: string,
): MetricVM[] {
  const pct =
    plannedTotal && plannedTotal > 0 ? (actualTotal / plannedTotal) * 100 : null;

  const e = (s: string) => (connected ? s : NUMBER_EMPTY);

  return [
    {
      id: "spend",
      label: "Inversión total",
      value: connected ? formatCOP(total.spend) : CURRENCY_EMPTY,
      ctx: connected ? `Rango: ${rangeLabel}` : "Sin datos cargados",
      status: connected ? "ok" : "empty",
      placeholder: !connected,
      accent: true,
    },
    {
      id: "budget",
      label: "Presupuesto planeado",
      value: plannedTotal && plannedTotal > 0 ? formatCOP(plannedTotal) : CURRENCY_EMPTY,
      ctx: plannedTotal ? "Plan mensual (Sheet)" : "Por definir en plan mensual",
      status: plannedTotal ? "ok" : "empty",
      placeholder: !plannedTotal,
    },
    {
      id: "pct",
      label: "% consumido",
      value: pct !== null ? `${formatDecimal(pct, 1)}%` : NUMBER_EMPTY,
      ctx: pct !== null ? "Del plan cargado (cuentas con presupuesto)" : "Pacing sin calcular",
      status: pct !== null ? "ok" : "empty",
      placeholder: pct === null,
    },
    {
      id: "results",
      label: "Resultados",
      value: connected ? numOrEmpty(total.results) : NUMBER_EMPTY,
      ctx: connected ? "Conversaciones / leads" : "Sin conversiones cargadas",
      status: connected && total.results !== null ? "ok" : "empty",
      placeholder: !connected || total.results === null,
    },
    {
      id: "cpr",
      label: "Costo por resultado",
      value: connected ? copOrEmpty(total.costPerResult) : CURRENCY_EMPTY,
      ctx: connected ? "Inversión / resultado" : "Cálculo pendiente",
      status: connected && total.costPerResult !== null ? "ok" : "empty",
      placeholder: !connected || total.costPerResult === null,
    },
    {
      id: "freq",
      label: "Frecuencia promedio",
      value: connected ? (total.avgFrequency !== null ? formatDecimal(total.avgFrequency) : NUMBER_EMPTY) : NUMBER_EMPTY,
      ctx: connected ? "Ponderada por impresiones" : "Sin impresiones únicas",
      status: connected && total.avgFrequency !== null ? "ok" : "empty",
      placeholder: !connected || total.avgFrequency === null,
      tech: true,
    },
    {
      id: "ctr",
      label: "CTR promedio",
      value: connected ? (total.avgCtr !== null ? formatPercent(total.avgCtr) : NUMBER_EMPTY) : NUMBER_EMPTY,
      ctx: connected ? "Ponderado por impresiones" : "Sin clics cargados",
      status: connected && total.avgCtr !== null ? "ok" : "empty",
      placeholder: !connected || total.avgCtr === null,
      tech: true,
    },
    {
      id: "active",
      label: "Campañas activas",
      value: e(formatNumber(total.activeCampaigns)),
      ctx: connected ? "En entrega" : "Sin estado conectado",
      status: connected ? "ok" : "empty",
      placeholder: !connected,
    },
    {
      id: "alerts",
      label: "Alertas críticas",
      value: connected ? formatNumber(total.criticalAlerts) : NUMBER_EMPTY,
      ctx: connected ? "Requieren acción" : "Motor de alertas pendiente",
      status: total.criticalAlerts > 0 ? "crit" : connected ? "ok" : "empty",
      placeholder: !connected,
      alert: true,
    },
  ];
}

// ---------- Accounts ----------
function buildAccounts(
  payload: DashboardPayload,
): AccountVM[] {
  return payload.accounts.map((a: AccountSummary) => {
    const pace = payload.pacing.find((p) => p.account_group === a.accountGroup);
    const planned = pace?.planned_monthly_budget ?? null;
    const actual = pace?.actual_spend_to_date ?? 0;
    const expected = pace?.expected_spend_to_date ?? null;
    const pct = planned && planned > 0 ? (actual / planned) * 100 : null;

    let status: AccountVM["status"] = "ok";
    let statusLabel = "Sano";
    if (!a.configured) {
      status = "ghost";
      statusLabel = "Sin configurar";
    } else if (a.kpis.criticalAlerts > 0) {
      status = "crit";
      statusLabel = "Atención crítica";
    } else if (pace?.pacing_status === "overpacing") {
      status = "warn";
      statusLabel = "Sobreconsumo";
    } else if (pace?.pacing_status === "underpacing") {
      status = "warn";
      statusLabel = "Bajo consumo";
    } else if (!a.hasData) {
      status = "ghost";
      statusLabel = "Sin gasto";
    }

    const meterTone: Severity =
      pace?.pacing_status === "overpacing"
        ? "crit"
        : pace?.pacing_status === "underpacing"
          ? "warn"
          : "ok";

    return {
      id: a.accountGroup,
      name: a.label,
      cities: a.sede,
      status,
      statusLabel,
      stats: [
        { k: "Inversión", v: a.hasData ? formatCOP(a.kpis.spend) : CURRENCY_EMPTY },
        { k: "Presupuesto", v: planned ? formatCOP(planned) : CURRENCY_EMPTY },
        { k: "% consumo", v: pct !== null ? `${formatDecimal(pct, 0)}%` : NUMBER_EMPTY },
        { k: "Resultados", v: numOrEmpty(a.kpis.results) },
        { k: "Costo / res.", v: copOrEmpty(a.kpis.costPerResult) },
        { k: "Frecuencia", v: a.kpis.avgFrequency !== null ? formatDecimal(a.kpis.avgFrequency) : NUMBER_EMPTY },
        { k: "CTR", v: a.kpis.avgCtr !== null ? formatPercent(a.kpis.avgCtr) : NUMBER_EMPTY },
        { k: "Campañas", v: formatNumber(a.kpis.activeCampaigns) },
      ],
      pacing: {
        fill: planned ? clamp((actual / planned) * 100) : 0,
        marker: planned && expected !== null ? clamp((expected / planned) * 100) : 0,
        tone: meterTone,
        label: planned ? `${formatDecimal(pct ?? 0, 0)}% / 100%` : "Sin plan",
      },
    };
  });
}

// ---------- Pacing block ----------
function buildPacing(payload: DashboardPayload): PacingVM | null {
  const withPlan = payload.pacing.filter(
    (p) => p.planned_monthly_budget !== null && p.planned_monthly_budget > 0,
  );
  if (withPlan.length === 0) return null;

  const plannedTotal = sum(withPlan.map((p) => p.planned_monthly_budget ?? 0));
  const actualTotal = sum(withPlan.map((p) => p.actual_spend_to_date ?? 0));
  const expectedTotal = sum(withPlan.map((p) => p.expected_spend_to_date ?? 0));

  const spentPct = plannedTotal > 0 ? (actualTotal / plannedTotal) * 100 : 0;
  const expectedPct = plannedTotal > 0 ? (expectedTotal / plannedTotal) * 100 : 0;
  const delta = spentPct - expectedPct;

  let deltaSeverity: Severity = "ok";
  let statusToday = "En ritmo";
  if (delta > 15) {
    deltaSeverity = "crit";
    statusToday = "Sobreconsumo";
  } else if (delta < -20) {
    deltaSeverity = "warn";
    statusToday = "Bajo consumo";
  } else if (Math.abs(delta) > 10) {
    deltaSeverity = "warn";
    statusToday = delta > 0 ? "Ligero adelanto" : "Ligero retraso";
  }

  const N = 13;
  const expectedLine = Array.from({ length: N }, (_, i) =>
    clamp((expectedPct * i) / (N - 1)),
  );
  const realLine = Array.from({ length: N }, (_, i) =>
    clamp((spentPct * i) / (N - 1)),
  );

  // Aviso de cobertura: cuentas presentes en el rango pero SIN plan mensual
  // (quedan excluidas del cálculo de pacing; no se inventa su presupuesto).
  const sinPlan = payload.pacing
    .filter((p) => !(p.planned_monthly_budget && p.planned_monthly_budget > 0))
    .map((p) => getAccountGroup(String(p.account_group))?.label ?? String(p.account_group));
  const note =
    sinPlan.length > 0
      ? `${sinPlan.join(", ")} sin plan mensual: excluida(s) del pacing.`
      : undefined;

  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  return {
    hasPlan: true,
    interpolated: true,
    expectedLine,
    realLine,
    spentToday: `${formatDecimal(spentPct, 0)}%`,
    expectedToday: `${formatDecimal(expectedPct, 0)}%`,
    deltaToday: `${sign}${formatDecimal(Math.abs(delta), 0)} pts`,
    deltaSeverity,
    statusToday,
    note,
  };
}

// ---------- Alerts ----------
function buildAlerts(payload: DashboardPayload): {
  alerts: AlertVM[];
  counts: { crit: number; warn: number; info: number };
} {
  const rank: Record<Severity, number> = { crit: 0, warn: 1, info: 2, ok: 3 };
  const alerts: AlertVM[] = payload.alerts.map((a) => {
    const sev = sevFromLevel(a.level);
    return {
      sev,
      label: sevLabel(sev),
      what: a.message,
      account: getAccountGroup(String(a.account_group))?.label ?? String(a.account_group),
      target: a.entity_name,
      targetType: targetTypeEs(a.entity_type),
      metric: String(a.value ?? "—"),
      metricLabel: METRIC_LABELS[a.metric] ?? a.metric,
      reco: a.recommended_action,
    };
  });
  alerts.sort((x, y) => rank[x.sev] - rank[y.sev]);
  const counts = {
    crit: alerts.filter((a) => a.sev === "crit").length,
    warn: alerts.filter((a) => a.sev === "warn").length,
    info: alerts.filter((a) => a.sev === "info").length,
  };
  return { alerts, counts };
}

// ---------- Tables ----------
function buildTables(payload: DashboardPayload) {
  const aMap = rowAlertMap(payload.alerts);
  const acctLabel = (k: string) => getAccountGroup(k)?.label ?? k;

  const campaigns: CampaignVM[] = [...payload.campaigns]
    .sort((a, b) => b.spend - a.spend)
    .map((c) => {
      const noConv = c.spend > 0 && c.results === 0;
      return {
        name: c.campaign_name,
        acct: acctLabel(c.account_group),
        status: mapEntityStatus(c.effective_status),
        spend: formatCOP(c.spend),
        results: c.results === null ? NUMBER_EMPTY : formatNumber(c.results),
        noConversions: noConv,
        cpr: copOrEmpty(c.cost_per_result),
        freq: c.frequency ? formatDecimal(c.frequency) : NUMBER_EMPTY,
        ctr: formatPercent(c.ctr),
        cpc: copOrEmpty(c.cpc || null),
        cpm: copOrEmpty(c.cpm || null),
        alert: aMap.get(c.campaign_name) ?? (noConv ? "warn" : null),
      };
    });

  const adsets: AdsetVM[] = [...payload.adsets]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 100)
    .map((s) => {
      const noConv = s.spend > 0 && s.results === 0;
      return {
        name: s.adset_name,
        camp: s.campaign_name,
        acct: acctLabel(String(s.account_group)),
        status: mapEntityStatus(s.effective_status),
        spend: formatCOP(s.spend),
        results: s.results === null ? NUMBER_EMPTY : formatNumber(s.results),
        noConversions: noConv,
        cpr: copOrEmpty(s.cost_per_result),
        freq: s.frequency ? formatDecimal(s.frequency) : NUMBER_EMPTY,
        ctr: formatPercent(s.ctr),
        alert: aMap.get(s.adset_name) ?? (noConv ? "warn" : null),
      };
    });

  const ads: AdVM[] = [...payload.ads]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 100)
    .map((d) => {
      const noConv = d.spend > 0 && d.results === 0;
      return {
        name: d.ad_name,
        camp: d.campaign_name,
        acct: acctLabel(String(d.account_group)),
        status: mapEntityStatus(d.effective_status),
        spend: formatCOP(d.spend),
        results: d.results === null ? NUMBER_EMPTY : formatNumber(d.results),
        noConversions: noConv,
        cpr: copOrEmpty(d.cost_per_result),
        ctr: formatPercent(d.ctr),
        alert: aMap.get(d.ad_name) ?? (noConv ? "warn" : null),
      };
    });

  return { campaigns, adsets, ads };
}

// ---------- Header ----------
function buildHeader(payload: DashboardPayload, connected: boolean) {
  const lu = payload.lastUpdate;
  let lastUpdate = {
    label: "Pendiente de sincronizar",
    status: "warn" as Severity,
    badge: "Pendiente",
  };
  if (lu && lu.finished_at) {
    const sameDay = isSameBogotaDay(lu.finished_at);
    const ageH = (Date.now() - new Date(lu.finished_at).getTime()) / 3.6e6;
    const status: Severity = sameDay ? "ok" : ageH > 72 ? "crit" : "warn";
    lastUpdate = {
      label: formatUpdatePremium(lu.finished_at),
      status,
      badge: sameDay ? "Al día" : "Revisar actualización",
    };
  }

  // El token de Meta es temporal (se entrega por corrida): NO determina el
  // estado de conexión del dashboard, que lee de Google Sheets.
  let connection = { label: "Pendiente de sincronizar", status: "warn" as Severity };
  const hasReadError = payload.status.notices.some((n) => n.code === "read_error");
  const partial = lu?.perAccount.some((p) => p.status !== "ok");
  if (hasReadError) {
    connection = { label: "Sin conexión con Google Sheets", status: "crit" };
  } else if (!payload.status.sheetsReady) {
    connection = { label: "Google Sheets no configurado", status: "warn" };
  } else if (partial) {
    connection = { label: "Sincronización parcial · 1 de 2 cuentas", status: "warn" };
  } else if (connected) {
    connection = { label: "Datos cargados · Meta Ads", status: "ok" };
  } else {
    connection = { label: "Sin datos · pendiente de sincronizar", status: "warn" };
  }

  return {
    brandName: payload.client.name,
    subtitle: "Centro de Seguimiento Digital",
    kicker: "Pauta digital · Meta Ads",
    lastUpdate,
    connection,
  };
}

// ---------- Banners (estados de configuración, sin mock) ----------
const BANNER_META: Record<
  string,
  { title: string; icon: string }
> = {
  token_missing: { title: "Actualización manual de Meta", icon: "info" },
  account_missing: { title: "Cuenta publicitaria sin configurar", icon: "link-2" },
  sheet_missing: { title: "Sheet no configurado", icon: "database" },
  read_error: { title: "No fue posible leer Google Sheets", icon: "cloud-off" },
  no_data: { title: "Sin datos cargados", icon: "database" },
  no_last_update: { title: "Última actualización pendiente", icon: "clock" },
  range_unavailable: { title: "Rango sin datos", icon: "clock" },
  unclassified: { title: "Campañas sin sede", icon: "info" },
};

function buildBanners(payload: DashboardPayload): BannerVM[] {
  const byCode = new Map<string, BannerVM>();
  for (const n of payload.status.notices) {
    const meta = BANNER_META[n.code] ?? { title: n.code, icon: "info" };
    const level: BannerVM["level"] =
      n.level === "critical" ? "crit" : n.level === "info" ? "info" : "warn";
    const existing = byCode.get(n.code);
    if (existing) {
      existing.body += ` · ${n.message}`;
    } else {
      byCode.set(n.code, { level, title: meta.title, body: n.message, icon: meta.icon });
    }
  }
  // Orden: crit → warn → info
  const order: Record<BannerVM["level"], number> = { crit: 0, warn: 1, info: 2 };
  return [...byCode.values()].sort((a, b) => order[a.level] - order[b.level]);
}

// ---------- Exec blocks (resumen derivado de datos reales) ----------
function buildExec(
  payload: DashboardPayload,
  connected: boolean,
  pacing: PacingVM | null,
): { works: ExecBlock; attn: ExecBlock; next: ExecBlock } {
  const t = payload.total;
  const rangeLabel = payload.lastUpdate?.date_preset_or_range ?? "—";

  const works: ExecBlock = connected
    ? {
        head: "Qué está funcionando",
        body:
          t.results !== null
            ? `${formatNumber(t.results)} resultados con inversión de ${formatCOP(t.spend)}${t.costPerResult !== null ? ` (CPR ${formatCOP(t.costPerResult)})` : ""}.`
            : `Inversión activa de ${formatCOP(t.spend)} en ${formatNumber(t.activeCampaigns)} campañas.`,
        foot: `Rango: ${rangeLabel}`,
      }
    : {
        head: "Qué está funcionando",
        body: "Sin datos cargados todavía. Conecta Meta Ads para ver resultados reales.",
        foot: "—",
      };

  const topAlert = payload.alerts.find((a) => a.level === "critical") ?? payload.alerts.find((a) => a.level === "warning");
  const attn: ExecBlock = topAlert
    ? {
        head: "Qué requiere atención",
        body: `${topAlert.message} (${getAccountGroup(String(topAlert.account_group))?.label ?? topAlert.account_group}).`,
        foot: `${t.criticalAlerts} crítica(s) en total`,
      }
    : {
        head: "Qué requiere atención",
        body: connected ? "Sin alertas operativas en este rango." : "Motor de alertas pendiente de datos.",
        foot: connected ? "Todo bajo control" : "—",
      };

  let nextBody: string;
  if (!connected) {
    nextBody = "Configura el token y corre la primera carga: npm run meta:update.";
  } else if (pacing?.deltaSeverity === "crit") {
    nextBody = "Revisar presupuestos: el gasto va por encima del plan.";
  } else if (pacing?.statusToday === "Bajo consumo") {
    nextBody = "Revisar entrega: el gasto va por debajo del plan mensual.";
  } else if (t.criticalAlerts > 0) {
    nextBody = "Atender las alertas críticas listadas en el panel.";
  } else {
    nextBody = "Mantener optimización; sin acciones urgentes detectadas.";
  }
  const next: ExecBlock = {
    head: "Próximo paso sugerido",
    body: nextBody,
    foot: payload.lastUpdate ? `Por ${payload.lastUpdate.updated_by || "—"}` : "—",
  };

  return { works, attn, next };
}

// ---------- Ensamblado ----------
export function buildDashboardVM(payload: DashboardPayload): DashboardVM {
  const connected = payload.status.sheetsReady && payload.campaigns.length > 0;

  const withPlan = payload.pacing.filter(
    (p) => p.planned_monthly_budget !== null && p.planned_monthly_budget > 0,
  );
  const plannedTotal = withPlan.length
    ? sum(withPlan.map((p) => p.planned_monthly_budget ?? 0))
    : null;
  const actualTotal = sum(withPlan.map((p) => p.actual_spend_to_date ?? 0));
  const rangeLabel = payload.lastUpdate?.date_preset_or_range ?? "—";

  const pacing = buildPacing(payload);
  const { alerts, counts } = buildAlerts(payload);
  const tables = buildTables(payload);

  return {
    connected,
    appliedView: payload.appliedView,
    availableViews: payload.availableViews,
    range: {
      available: payload.range.available,
      requestedLabel: payload.range.requested.label,
      loadedLabel: payload.range.loaded?.label ?? null,
      suggestedCommand: payload.range.suggestedCommand,
    },
    unclassified: {
      count: payload.unclassified.count,
      campaigns: payload.unclassified.campaigns.map((c) => ({
        campaign_name: c.campaign_name,
        campaign_id: c.campaign_id,
        spend: formatCOP(c.spend),
        results: c.results === null ? "—" : formatNumber(c.results),
        reason: c.reason,
      })),
    },
    header: buildHeader(payload, connected),
    banners: buildBanners(payload),
    exec: buildExec(payload, connected, pacing),
    kpis: buildKpis(payload.total, connected, plannedTotal, actualTotal, rangeLabel),
    accounts: buildAccounts(payload),
    pacing,
    alerts,
    alertCounts: counts,
    campaigns: tables.campaigns,
    adsets: tables.adsets,
    ads: tables.ads,
    generatedAt: payload.generatedAt,
  };
}
