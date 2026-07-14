import type { PresupuestoInfo } from "@/lib/fivegatos/presupuesto";
import { fmtCop } from "@/lib/fivegatos/constants";

const BAR_CLS: Record<string, string> = {
  verde: "bg-emerald-500",
  ambar: "bg-amber-500",
  rojo: "bg-red-500",
  na: "bg-gray-300",
};

const PCT_CLS: Record<string, string> = {
  verde: "text-emerald-700",
  ambar: "text-amber-700",
  rojo: "text-red-700",
  na: "text-gray-500",
};

function fmtPctEntero(v: number): string {
  return `${v.toLocaleString("es-CO", { maximumFractionDigits: 0 })}%`;
}

/**
 * Presupuesto planeado vs consumido de una campaña, con barra de progreso
 * semántica (<70% verde · 70–90% ámbar · >90% rojo · >100% "Excedido").
 * Si Meta no reporta budget: "Presupuesto no configurado" sin barra.
 */
export default function PresupuestoCard({
  presupuesto,
  modo,
}: {
  presupuesto: PresupuestoInfo;
  modo: "mes" | "vida";
}) {
  const p = presupuesto;
  const labelRango = modo === "mes" ? "este mes" : "toda la campaña";

  if (p.planeado === null) {
    return (
      <div className="rounded-[6px] border border-gray-200 bg-gray-50 px-4 py-3.5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Presupuesto · {labelRango}
        </p>
        <p className="mt-1.5 text-sm text-gray-400">
          Presupuesto no configurado en Meta
          {p.consumido > 0 && (
            <span className="text-gray-500 tabular-nums">
              {" "}
              · consumido {fmtCop(p.consumido)}
            </span>
          )}
        </p>
      </div>
    );
  }

  const pct = p.porcentaje ?? 0;
  const excedido = pct > 100;
  const width = Math.max(0, Math.min(100, pct));

  return (
    <div className="rounded-[6px] border border-gray-200 bg-gray-50 px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Presupuesto · {labelRango}
        </p>
        <p
          className={`text-xs font-semibold tabular-nums ${PCT_CLS[p.semaforo]}`}
        >
          {fmtPctEntero(pct)} consumido
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-sm text-gray-600">
          Planeado:{" "}
          <span className="font-semibold text-gray-900 tabular-nums">
            {fmtCop(p.planeado)}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          Consumido:{" "}
          <span className="font-semibold text-gray-900 tabular-nums">
            {fmtCop(p.consumido)}
          </span>
        </p>
      </div>

      <div
        className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Presupuesto consumido: ${fmtPctEntero(pct)}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${BAR_CLS[p.semaforo]}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 tabular-nums">
        {excedido ? (
          <span className="font-semibold text-red-700">
            Excedido en {fmtCop(Math.abs(p.restante ?? 0))}
          </span>
        ) : (
          <span>
            Restante:{" "}
            <span className="font-medium text-gray-700">
              {fmtCop(p.restante)}
            </span>
          </span>
        )}
        {p.ritmoDiario !== null && (
          <>
            <span className="text-gray-300" aria-hidden>
              ·
            </span>
            <span>
              Ritmo: {fmtCop(Math.round(p.ritmoDiario))}
              /día
            </span>
          </>
        )}
      </p>
    </div>
  );
}
