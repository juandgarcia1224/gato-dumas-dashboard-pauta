"use client";

import type { PacingVM, Severity } from "@/lib/dashboard/design-types";
import EmptyState from "./EmptyState";

const W = 600;
const H = 200;
const padX = 30;
const padY = 24;

function buildPaths(line: number[]) {
  const n = line.length;
  const xs = (i: number) => padX + (i / (n - 1)) * (W - padX * 2);
  const ys = (v: number) => H - padY - (v / 100) * (H - padY * 2);
  const path = line
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(v).toFixed(1)}`)
    .join(" ");
  return { path, xs, ys };
}

function badgeClass(s: Severity): string {
  return s === "crit" ? "crit" : s === "warn" ? "warn" : s === "ok" ? "ok" : "info";
}

/**
 * Pacing (Cloud Design §6). Gráfico SVG inline (sin librerías).
 * Líneas: esperado punteado gris, real teal sólido + área. Marca "HOY".
 * Si no hay plan mensual → EmptyState (UI_STATES §5/§12.5).
 * Nota honesta: sin historial diario, la curva real es interpolación lineal
 * entre 0 y el % acumulado real de hoy (endpoints reales, intermedio disclosed).
 */
export default function PacingChart({ pacing }: { pacing: PacingVM | null }) {
  return (
    <section className="section">
      <div className="section-head">
        <div className="title-wrap">
          <span className="h-rule" />
          <h3>Pacing de gasto</h3>
          <span className="sub">Gasto esperado vs gasto real · mes en curso</span>
        </div>
        {pacing && (
          <span className={`badge ${badgeClass(pacing.deltaSeverity)}`}>
            <span className="dot" />
            {pacing.statusToday}
          </span>
        )}
      </div>

      {!pacing ? (
        <div className="section-body">
          <EmptyState
            kind="sheet"
            title="Sin plan mensual"
            body="Conecta el Sheet de presupuesto (01_MediaPlan) para calcular el pacing y el % consumido."
          />
        </div>
      ) : (
        <PacingBody pacing={pacing} />
      )}
    </section>
  );
}

function PacingBody({ pacing }: { pacing: PacingVM }) {
  const exp = buildPaths(pacing.expectedLine);
  const real = buildPaths(pacing.realLine);
  const lastX = real.xs(pacing.realLine.length - 1);
  const areaPath =
    real.path + ` L ${lastX.toFixed(1)} ${(H - padY).toFixed(1)} L ${padX} ${(H - padY).toFixed(1)} Z`;

  return (
    <div className="pacing-wrap">
      <div className="pacing-chart">
        <svg className="line-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Curva de pacing">
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={padX} y1={exp.ys(v)} x2={W - padX} y2={exp.ys(v)} stroke="var(--hairline)" strokeWidth="1" />
              <text x={padX - 6} y={exp.ys(v) + 3} fontSize="9" fill="var(--muted)" textAnchor="end" fontFamily="var(--font-mono)">
                {v}%
              </text>
            </g>
          ))}
          <path d={areaPath} fill="rgba(40,128,141,0.08)" />
          <path d={exp.path} fill="none" stroke="var(--muted)" strokeWidth="1.3" strokeDasharray="3 4" />
          <path d={real.path} fill="none" stroke="var(--brand-teal)" strokeWidth="2" />
          <line x1={lastX} y1={padY} x2={lastX} y2={H - padY} stroke="var(--ink)" strokeWidth="1" strokeDasharray="2 3" />
          <text x={lastX} y={padY - 6} fontSize="9" fill="var(--ink)" textAnchor="end" fontFamily="var(--font-mono)" letterSpacing="1">
            HOY
          </text>
        </svg>

        <div className="legend">
          <span className="lg-item">
            <span className="swatch" style={{ background: "var(--brand-teal)" }} />
            Gasto real
          </span>
          <span className="lg-item">
            <span className="swatch" style={{ background: "var(--muted)" }} />
            Gasto esperado
          </span>
          <span className="lg-item" style={{ marginLeft: "auto" }}>
            <span className="swatch" style={{ background: "var(--ink)" }} />
            Día actual
          </span>
        </div>
      </div>

      <div className="pacing-panel">
        <div className="gauge-row">
          <div className="stat">
            <div className="stat-k">Gasto real</div>
            <div className="stat-v">{pacing.spentToday}</div>
            <div className="stat-d">del plan mensual</div>
          </div>
          <div className="stat">
            <div className="stat-k">Esperado</div>
            <div className="stat-v">{pacing.expectedToday}</div>
            <div className="stat-d">a la fecha</div>
          </div>
          <div className="stat">
            <div className="stat-k">Diferencia</div>
            <div
              className="stat-v"
              style={{
                color:
                  pacing.deltaSeverity === "crit"
                    ? "var(--crit)"
                    : pacing.deltaSeverity === "warn"
                      ? "var(--warn)"
                      : "var(--ink)",
              }}
            >
              {pacing.deltaToday}
            </div>
            <div className="stat-d">vs curva esperada</div>
          </div>
          <div className="stat">
            <div className="stat-k">Estado</div>
            <div className="stat-v" style={{ fontSize: 15, fontFamily: "var(--font-sans)", fontWeight: 700 }}>
              {pacing.statusToday}
            </div>
            <div className="stat-d">umbral ±10 pts</div>
          </div>
        </div>

        {pacing.interpolated && (
          <div style={{ fontSize: 11, color: "var(--muted)" }}>
            <span className="example-stamp">Curva diaria: proyección lineal</span>
            <br />
            Los % de hoy y esperado son reales; el historial diario se acumulará
            con cada sincronización.
          </div>
        )}
      </div>
    </div>
  );
}
