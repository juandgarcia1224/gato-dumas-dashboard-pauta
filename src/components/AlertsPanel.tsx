import { CheckCircle2 } from "lucide-react";
import type { AlertVM } from "@/lib/dashboard/design-types";

/**
 * Panel de alertas operativas (Cloud Design §7). Alertas reales del payload.
 * La recomendación (`reco`) lleva `internal-only` → oculta en modo cliente,
 * pero la alerta entera SIEMPRE se muestra (regla transversal UI_STATES §4).
 */
export default function AlertsPanel({
  alerts,
  counts,
}: {
  alerts: AlertVM[];
  counts: { crit: number; warn: number; info: number };
}) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" />
          <h3>Alertas operativas</h3>
          <span className="sub">{alerts.length} señales detectadas</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {counts.crit > 0 && (
            <span className="badge crit">
              <span className="dot" />
              {counts.crit} {counts.crit === 1 ? "crítica" : "críticas"}
            </span>
          )}
          {counts.warn > 0 && (
            <span className="badge warn">
              <span className="dot" />
              {counts.warn} atención
            </span>
          )}
          {counts.info > 0 && (
            <span className="badge info">
              <span className="dot" />
              {counts.info} aviso
            </span>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="section-body">
          <div className="empty-state">
            <div className="es-icon" style={{ color: "var(--ok)" }}>
              <CheckCircle2 size={22} />
            </div>
            <p className="es-title">Todo bajo control</p>
            <p className="es-body">No hay alertas operativas en este rango.</p>
          </div>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map((a, i) => (
            <div className={"alert-row sev-" + a.sev} key={i}>
              <div className={"sev " + a.sev}>{a.label}</div>
              <div>
                <div className="what">{a.what}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginTop: 2,
                    letterSpacing: ".06em",
                  }}
                >
                  {a.account}
                </div>
              </div>
              <div className="target">
                {a.target}
                <small>{a.targetType}</small>
              </div>
              <div className="metric">
                {a.metric}
                <small>{a.metricLabel}</small>
              </div>
              <div className="reco internal-only">{a.reco}</div>
              <div className="action">
                <span className="example-stamp">—</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
