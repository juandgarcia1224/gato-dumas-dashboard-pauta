import type { MetricVM } from "@/lib/dashboard/design-types";

/**
 * KPI Grid + MetricCard (Cloud Design §4). 4 columnas en desktop.
 * Valores ya formateados por el viewmodel; placeholders '$—' / '—' cuando
 * no hay dato real. Clases `accent`/`alert-card`/`tech` según el mapa.
 */
function MetricCard({ kpi }: { kpi: MetricVM }) {
  const cls = ["kpi"];
  if (kpi.accent) cls.push("accent");
  if (kpi.alert && kpi.status === "crit") cls.push("alert-card");
  if (kpi.tech) cls.push("tech");

  return (
    <div className={cls.join(" ")}>
      <div className="kpi-top">
        <div className="label">{kpi.label}</div>
        <span className="trend flat">— vs período ant.</span>
      </div>
      <div className="value">
        {kpi.value}
        {kpi.unit && <span className="unit">{kpi.unit}</span>}
      </div>
      <div className="ctx">{kpi.ctx}</div>
      <div className="kpi-foot">
        {kpi.placeholder ? (
          <>
            <span className="example-stamp">Sin conectar</span>
            <span className="badge ghost">Sin datos</span>
          </>
        ) : (
          <>
            <span className="example-stamp">Dato real · Meta</span>
            {kpi.status === "crit" && (
              <span className="badge crit">
                <span className="dot" />
                Atención
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function KpiGrid({ items }: { items: MetricVM[] }) {
  return (
    <section className="row cols-4" aria-label="Indicadores principales">
      {items.map((k) => (
        <MetricCard key={k.id} kpi={k} />
      ))}
    </section>
  );
}
