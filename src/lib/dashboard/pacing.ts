/**
 * Pacing de gasto: compara gasto real acumulado vs. gasto esperado según el
 * presupuesto mensual planificado (hoja 01_MediaPlan) prorrateado por días.
 */

import { ACCOUNT_GROUPS, type AccountGroupKey } from "../config/clients";
import {
  DEFAULT_ALERT_THRESHOLDS,
  type AlertRow,
  type AlertThresholds,
} from "./alerts";

export type PacingStatus =
  | "on_track"
  | "overpacing"
  | "underpacing"
  | "no_plan";

export interface PacingRow {
  date: string; // as-of YYYY-MM-DD
  month: string; // YYYY-MM
  platform: "meta";
  account_group: AccountGroupKey;
  planned_monthly_budget: number | null;
  expected_spend_to_date: number | null;
  actual_spend_to_date: number;
  spend_delta: number | null;
  spend_delta_pct: number | null;
  pacing_status: PacingStatus;
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

/** Suma planned_budget de 01_MediaPlan por account_group para un mes dado. */
export function plannedBudgetByAccount(
  mediaPlan: Record<string, string>[],
  month: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of mediaPlan) {
    if ((row.platform ?? "").toLowerCase() !== "meta") continue;
    if (row.month !== month) continue;
    const key = row.account_group;
    const budget = Number(row.planned_budget);
    if (!key || !Number.isFinite(budget)) continue;
    out[key] = (out[key] ?? 0) + budget;
  }
  return out;
}

/**
 * Calcula una fila de pacing por cada grupo de cuenta para el mes/fecha dados.
 */
export function computePacing(params: {
  month: string; // YYYY-MM
  asOf: Date;
  plannedByAccount: Record<string, number>;
  actualByAccount: Record<string, number>;
  thresholds?: AlertThresholds;
}): PacingRow[] {
  const t = params.thresholds ?? DEFAULT_ALERT_THRESHOLDS;
  const [year, mon] = params.month.split("-").map(Number);
  const dim = daysInMonth(year, mon - 1);
  // Día transcurrido dentro del mes (limitado a [1, dim]).
  const dom = Math.min(Math.max(params.asOf.getDate(), 1), dim);
  const fraction = dom / dim;
  const asOfStr = params.asOf.toISOString().slice(0, 10);

  return ACCOUNT_GROUPS.map((g) => {
    const planned = params.plannedByAccount[g.key] ?? null;
    const actual = params.actualByAccount[g.key] ?? 0;

    if (planned === null || planned <= 0) {
      return {
        date: asOfStr,
        month: params.month,
        platform: "meta" as const,
        account_group: g.key,
        planned_monthly_budget: null,
        expected_spend_to_date: null,
        actual_spend_to_date: actual,
        spend_delta: null,
        spend_delta_pct: null,
        pacing_status: "no_plan" as PacingStatus,
      };
    }

    const expected = planned * fraction;
    const delta = actual - expected;
    const deltaPct = expected > 0 ? (delta / expected) * 100 : null;

    let status: PacingStatus = "on_track";
    if (deltaPct !== null) {
      if (deltaPct > t.overpacePct) status = "overpacing";
      else if (deltaPct < -t.underpacePct) status = "underpacing";
    }

    return {
      date: asOfStr,
      month: params.month,
      platform: "meta" as const,
      account_group: g.key,
      planned_monthly_budget: round(planned),
      expected_spend_to_date: round(expected),
      actual_spend_to_date: round(actual),
      spend_delta: round(delta),
      spend_delta_pct: deltaPct === null ? null : round(deltaPct),
      pacing_status: status,
    };
  });
}

/** Alertas de sobre/subconsumo derivadas del pacing. */
export function buildPacingAlerts(
  pacing: PacingRow[],
  pulledAt: string,
  groupLabel: (key: AccountGroupKey) => string,
): AlertRow[] {
  const alerts: AlertRow[] = [];
  for (const p of pacing) {
    if (p.pacing_status === "overpacing") {
      alerts.push({
        pulled_at: pulledAt,
        platform: "meta",
        account_group: p.account_group,
        level: "warning",
        entity_type: "account",
        entity_id: p.account_group,
        entity_name: groupLabel(p.account_group),
        metric: "pacing",
        value: p.spend_delta_pct ?? "",
        threshold: "+15%",
        message: `Sobreconsumo: gasto ${fmtPct(p.spend_delta_pct)} por encima de lo esperado.`,
        recommended_action:
          "Revisar presupuestos diarios; el gasto va adelantado al plan.",
      });
    } else if (p.pacing_status === "underpacing") {
      alerts.push({
        pulled_at: pulledAt,
        platform: "meta",
        account_group: p.account_group,
        level: "warning",
        entity_type: "account",
        entity_id: p.account_group,
        entity_name: groupLabel(p.account_group),
        metric: "pacing",
        value: p.spend_delta_pct ?? "",
        threshold: "-20%",
        message: `Subconsumo: gasto ${fmtPct(p.spend_delta_pct)} respecto a lo esperado.`,
        recommended_action:
          "Revisar entrega; el presupuesto del mes podría no ejecutarse.",
      });
    }
  }
  return alerts;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtPct(v: number | null): string {
  if (v === null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${round(v)}%`;
}
