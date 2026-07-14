import type { KpiBlock } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";
import Kpi from "./Kpi";

/** Totales de presupuesto del mes (campañas activas) para "Inversión de pauta". */
export interface PresupuestoGlobal {
  planeado: number | null;
  consumido: number;
  restante: number | null;
}

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

/**
 * Resumen ejecutivo del mes con lo que le importa al cliente:
 * Inversión de pauta (planeado) · Consumido hasta hoy · Leads · CPL.
 */
export default function KpiCards({
  kpis,
  kpisPrev,
  presupuesto,
}: {
  kpis: KpiBlock;
  kpisPrev: KpiBlock | null;
  presupuesto: PresupuestoGlobal;
}) {
  const pctConsumido =
    presupuesto.planeado !== null && presupuesto.planeado > 0
      ? (presupuesto.consumido / presupuesto.planeado) * 100
      : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label="Inversión de pauta"
        value={
          presupuesto.planeado !== null ? fmtCop(presupuesto.planeado) : "—"
        }
        foot={
          presupuesto.planeado !== null ? (
            <span className="text-gray-500">
              Presupuesto planeado del mes
            </span>
          ) : (
            <span className="text-gray-400">
              Sin presupuesto configurado en Meta
            </span>
          )
        }
      />
      <Kpi
        label="Consumido hasta hoy"
        value={fmtCop(presupuesto.consumido)}
        foot={
          pctConsumido !== null ? (
            <span className="tabular-nums text-gray-500">
              <span className="font-semibold text-gray-800">
                {pctConsumido.toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
                %
              </span>
              <span className="ml-1">
                del presupuesto ·{" "}
                {presupuesto.restante !== null
                  ? `restan ${fmtCop(presupuesto.restante)}`
                  : ""}
              </span>
            </span>
          ) : (
            <Delta current={kpis.inversion} prev={kpisPrev?.inversion} />
          )
        }
      />
      <Kpi
        label="Leads"
        value={fmtInt(kpis.leads)}
        foot={<Delta current={kpis.leads} prev={kpisPrev?.leads} />}
      />
      <Kpi
        label="CPL"
        value={fmtCop(kpis.cpl)}
        foot={<Delta current={kpis.cpl} prev={kpisPrev?.cpl} invertGood />}
      />
    </div>
  );
}
