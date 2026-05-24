/**
 * Sistema de alertas configurable.
 * Genera filas con el esquema de la hoja 06_Alerts. Lo usa el script de
 * actualización (para escribir) y el API del dashboard (para mostrar).
 */

import type { AccountGroupKey } from "../config/clients";
import type { CampaignRecord } from "./metrics";

export type AlertLevel = "info" | "warning" | "critical";

export interface AlertThresholds {
  frequencyWarning: number;
  frequencyCritical: number;
  ctrWarning: number; // en % (Meta entrega ctr como porcentaje)
  ctrCritical: number;
  overpacePct: number; // % por encima de lo esperado
  underpacePct: number; // % por debajo de lo esperado
  cpcWarning: number | null; // COP, null = desactivado
  cpmWarning: number | null; // COP, null = desactivado
  /** Impresiones mínimas para evaluar CTR/frecuencia (evita ruido). */
  minImpressions: number;
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  frequencyWarning: 2.5,
  frequencyCritical: 4,
  ctrWarning: 0.8,
  ctrCritical: 0.5,
  overpacePct: 15,
  underpacePct: 20,
  cpcWarning: null,
  cpmWarning: null,
  minImpressions: 500,
};

export interface AlertRow {
  pulled_at: string;
  platform: "meta";
  account_group: AccountGroupKey;
  level: AlertLevel;
  entity_type: "campaign" | "adset" | "ad" | "account";
  entity_id: string;
  entity_name: string;
  metric: string;
  value: number | string;
  threshold: number | string;
  message: string;
  recommended_action: string;
}

/** Alertas a nivel de campaña. */
export function buildCampaignAlerts(
  rows: CampaignRecord[],
  pulledAt: string,
  thresholds: AlertThresholds = DEFAULT_ALERT_THRESHOLDS,
): AlertRow[] {
  const alerts: AlertRow[] = [];

  for (const r of rows) {
    const isActive = r.effective_status.toUpperCase() === "ACTIVE";
    const base = {
      pulled_at: pulledAt,
      platform: "meta" as const,
      account_group: r.account_group,
      entity_type: "campaign" as const,
      entity_id: r.campaign_id,
      entity_name: r.campaign_name,
    };

    // --- Frecuencia alta ---
    if (r.impressions >= thresholds.minImpressions) {
      if (r.frequency >= thresholds.frequencyCritical) {
        alerts.push({
          ...base,
          level: "critical",
          metric: "frequency",
          value: round(r.frequency),
          threshold: thresholds.frequencyCritical,
          message: `Frecuencia muy alta (${round(r.frequency)}). Riesgo de fatiga del público.`,
          recommended_action:
            "Refrescar creativos o ampliar el público objetivo.",
        });
      } else if (r.frequency >= thresholds.frequencyWarning) {
        alerts.push({
          ...base,
          level: "warning",
          metric: "frequency",
          value: round(r.frequency),
          threshold: thresholds.frequencyWarning,
          message: `Frecuencia elevada (${round(r.frequency)}).`,
          recommended_action: "Monitorear fatiga; preparar nuevos creativos.",
        });
      }
    }

    // --- CTR bajo --- (solo con suficientes impresiones y gasto)
    if (r.impressions >= thresholds.minImpressions && r.spend > 0) {
      if (r.ctr < thresholds.ctrCritical) {
        alerts.push({
          ...base,
          level: "critical",
          metric: "ctr",
          value: round(r.ctr),
          threshold: thresholds.ctrCritical,
          message: `CTR muy bajo (${round(r.ctr)}%).`,
          recommended_action:
            "Revisar gancho del creativo y relevancia del público.",
        });
      } else if (r.ctr < thresholds.ctrWarning) {
        alerts.push({
          ...base,
          level: "warning",
          metric: "ctr",
          value: round(r.ctr),
          threshold: thresholds.ctrWarning,
          message: `CTR bajo (${round(r.ctr)}%).`,
          recommended_action: "Probar variaciones de copy/creativo.",
        });
      }
    }

    // --- Campaña activa sin gasto ---
    if (isActive && r.spend === 0) {
      alerts.push({
        ...base,
        level: "warning",
        metric: "spend",
        value: 0,
        threshold: 0,
        message: "Campaña activa sin gasto en el rango.",
        recommended_action:
          "Verificar presupuesto, estado de entrega y aprobación de anuncios.",
      });
    }

    // --- CPC alto (si configurado) ---
    if (thresholds.cpcWarning && r.cpc > thresholds.cpcWarning) {
      alerts.push({
        ...base,
        level: "warning",
        metric: "cpc",
        value: round(r.cpc),
        threshold: thresholds.cpcWarning,
        message: `CPC alto (${round(r.cpc)}).`,
        recommended_action: "Optimizar segmentación o puja.",
      });
    }

    // --- CPM alto (si configurado) ---
    if (thresholds.cpmWarning && r.cpm > thresholds.cpmWarning) {
      alerts.push({
        ...base,
        level: "warning",
        metric: "cpm",
        value: round(r.cpm),
        threshold: thresholds.cpmWarning,
        message: `CPM alto (${round(r.cpm)}).`,
        recommended_action: "Revisar saturación de público y formatos.",
      });
    }
  }

  return alerts;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
