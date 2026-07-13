import type { KpiBlock } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";

function Delta({
  current,
  prev,
  invertGood = false,
}: {
  current: number | null;
  prev: number | null | undefined;
  /** true cuando bajar es bueno (ej. CPL). */
  invertGood?: boolean;
}) {
  if (
    current === null ||
    prev === null ||
    prev === undefined ||
    !Number.isFinite(prev) ||
    prev === 0
  ) {
    return <span className="text-xs text-lab-faint">vs mes anterior: —</span>;
  }
  const pct = ((current - prev) / prev) * 100;
  const up = pct >= 0;
  const good = invertGood ? !up : up;
  return (
    <span
      className={`text-xs font-semibold tabular-nums ${good ? "text-lab-salvia" : "text-lab-terracota"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toLocaleString("es-CO", { maximumFractionDigits: 1 })}%
      <span className="ml-1 font-normal text-lab-faint">vs mes anterior</span>
    </span>
  );
}

/**
 * KPIs "The Lab": grid rígido de 4 columnas separadas por hairlines (no
 * cards flotantes). Cada celda: eyebrow mono → número grande en Plex Sans
 * SemiBold → delta. Franja de accent (petróleo/menta) de 3px a la izquierda.
 */
export default function KpiCards({
  kpis,
  kpisPrev,
}: {
  kpis: KpiBlock;
  kpisPrev: KpiBlock | null;
}) {
  const cards = [
    {
      label: "Inversión del mes",
      value: fmtCop(kpis.inversion),
      delta: (
        <Delta current={kpis.inversion} prev={kpisPrev?.inversion} />
      ),
    },
    {
      label: "Leads del mes",
      value: fmtInt(kpis.leads),
      delta: <Delta current={kpis.leads} prev={kpisPrev?.leads} />,
    },
    {
      label: "CPL promedio",
      value: fmtCop(kpis.cpl),
      delta: <Delta current={kpis.cpl} prev={kpisPrev?.cpl} invertGood />,
    },
    {
      label: "Adsets activos hoy",
      value: fmtInt(kpis.adsetsActivos),
      delta: (
        <span className="text-xs text-lab-faint">
          {fmtCop(kpis.inversionLifetimeActivos)} consumidos desde su inicio
        </span>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-px border border-lab-rule bg-lab-rule sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div key={c.label} className="relative bg-lab-surface p-5 pl-6">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-[3px] bg-lab-accent"
          />
          <div className="flex items-baseline justify-between gap-2">
            <p className="lab-eyebrow text-[10px] text-lab-muted">{c.label}</p>
            <span className="lab-eyebrow shrink-0 text-[9px] text-lab-faint">
              0{i + 1} / 04
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-lab-ink-strong tabular-nums">
            {c.value}
          </p>
          <p className="mt-2">{c.delta}</p>
        </div>
      ))}
    </div>
  );
}
