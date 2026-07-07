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
    return <span className="text-xs text-neutral-400">vs mes anterior: —</span>;
  }
  const pct = ((current - prev) / prev) * 100;
  const up = pct >= 0;
  const good = invertGood ? !up : up;
  return (
    <span
      className={`text-xs font-semibold ${good ? "text-emerald-700" : "text-[#B8232A]"}`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toLocaleString("es-CO", { maximumFractionDigits: 1 })}%
      <span className="ml-1 font-normal text-neutral-400">vs mes anterior</span>
    </span>
  );
}

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
      label: "Campañas activas hoy",
      value: fmtInt(kpis.campanasActivas),
      delta: (
        <Delta
          current={kpis.campanasActivas}
          prev={kpisPrev?.campanasActivas}
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-neutral-500">{c.label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
            {c.value}
          </p>
          <p className="mt-2">{c.delta}</p>
        </div>
      ))}
    </div>
  );
}
