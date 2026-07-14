import type { KpiBlock } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";
import Kpi from "./Kpi";

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
    return <span className="text-gray-400">vs mes anterior: —</span>;
  }
  const pct = ((current - prev) / prev) * 100;
  const up = pct >= 0;
  const good = invertGood ? !up : up;
  return (
    <span
      className={`font-medium tabular-nums ${good ? "text-emerald-600" : "text-red-600"}`}
    >
      {up ? "▲" : "▼"}{" "}
      {Math.abs(pct).toLocaleString("es-CO", { maximumFractionDigits: 1 })}%
      <span className="ml-1 font-normal text-gray-400">vs mes anterior</span>
    </span>
  );
}

/** Resumen ejecutivo del mes: 4 KPIs en cards sobrias. */
export default function KpiCards({
  kpis,
  kpisPrev,
}: {
  kpis: KpiBlock;
  kpisPrev: KpiBlock | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label="Inversión del mes"
        value={fmtCop(kpis.inversion)}
        foot={<Delta current={kpis.inversion} prev={kpisPrev?.inversion} />}
      />
      <Kpi
        label="Leads del mes"
        value={fmtInt(kpis.leads)}
        foot={<Delta current={kpis.leads} prev={kpisPrev?.leads} />}
      />
      <Kpi
        label="CPL promedio"
        value={fmtCop(kpis.cpl)}
        foot={<Delta current={kpis.cpl} prev={kpisPrev?.cpl} invertGood />}
      />
      <Kpi
        label="Adsets activos hoy"
        value={fmtInt(kpis.adsetsActivos)}
        foot={
          <span className="tabular-nums">
            {fmtCop(kpis.inversionLifetimeActivos)} consumidos desde su inicio
          </span>
        }
      />
    </div>
  );
}
