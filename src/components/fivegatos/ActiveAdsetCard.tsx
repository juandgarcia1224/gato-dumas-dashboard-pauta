"use client";

import type { AdsetStats } from "@/lib/fivegatos/data";
import {
  BENCHMARK_CPL,
  diasCorridos,
  fmtCop,
  fmtFecha,
  fmtInt,
  fmtPct,
} from "@/lib/fivegatos/constants";

const SEMAFORO_STYLE: Record<string, { dot: string; label: string; text: string }> = {
  verde: { dot: "bg-emerald-500", label: "CPL saludable", text: "text-emerald-700" },
  amarillo: { dot: "bg-amber-400", label: "CPL a vigilar", text: "text-amber-700" },
  rojo: { dot: "bg-[#B8232A]", label: "CPL alto", text: "text-[#B8232A]" },
  sin_datos: { dot: "bg-neutral-300", label: "Sin leads aún", text: "text-neutral-500" },
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums text-neutral-800">{value}</p>
    </div>
  );
}

/**
 * Card de un ADSET activo. Modelo: 1 adset = 1 curso o programa; la campaña
 * padre se muestra como eyebrow. La métrica destacada es el consumo LIFETIME
 * (desde el inicio real del adset). Días corridos se calculan en el cliente
 * con new Date().
 */
export default function ActiveAdsetCard({ a }: { a: AdsetStats }) {
  const s = SEMAFORO_STYLE[a.semaforo] ?? SEMAFORO_STYLE.sin_datos;
  const dias = diasCorridos(a.start_time);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* Eyebrow: campaña padre (contenedor) */}
      <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        Campaña · {a.campaign_name || "—"}
      </p>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug text-neutral-900">
            {a.adset_name}
          </p>
          <p className="mt-1.5 text-sm text-neutral-500">
            {a.nombre_normalizado ? (
              <>
                <span
                  className={`mr-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    a.tipo === "Programa"
                      ? "bg-neutral-900 text-white"
                      : "bg-[#B8232A]/10 text-[#B8232A]"
                  }`}
                >
                  {a.tipo}
                </span>
                {a.nombre_normalizado}
              </>
            ) : (
              <span className="italic text-neutral-400">Sin clasificar</span>
            )}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-50 px-2.5 py-1 text-xs font-semibold ${s.text}`}
          title={`Benchmark CPL: ${fmtCop(BENCHMARK_CPL)}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden />
          {s.label}
        </span>
      </div>

      {/* Fechas y días corridos */}
      <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
        <span className="tabular-nums">
          Inicio: <strong>{fmtFecha(a.start_time)}</strong>
        </span>
        <span className="mx-1.5 text-neutral-300">·</span>
        <span className="tabular-nums">
          Fin: <strong>{a.end_time ? fmtFecha(a.end_time) : "sin fecha fin"}</strong>
        </span>
        {dias !== null && (
          <>
            <span className="mx-1.5 text-neutral-300">·</span>
            <span className="tabular-nums">
              Días corridos: <strong>{fmtInt(dias)}</strong>
            </span>
          </>
        )}
      </div>

      {/* Consumo lifetime destacado */}
      <div className="border-t border-neutral-100 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Consumo total
        </p>
        <p className="text-3xl font-bold tabular-nums tracking-tight text-neutral-900">
          {fmtCop(a.spend_lifetime)}
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">desde el inicio del adset</p>
      </div>

      {/* Métricas secundarias del mes */}
      <div className="grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3">
        <Metric label="Gasto del mes" value={fmtCop(a.spend)} />
        <Metric label="Leads (mes)" value={fmtInt(a.leads)} />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            CPL (mes)
          </p>
          <p className={`text-sm font-semibold tabular-nums ${s.text}`}>
            {fmtCop(a.cpl)}
          </p>
        </div>
        <Metric label="CTR" value={fmtPct(a.ctr)} />
        <Metric label="CPC" value={fmtCop(a.cpc)} />
        <Metric label="CPM" value={fmtCop(a.cpm)} />
        <div className="col-span-3">
          <Metric label="Impresiones (mes)" value={fmtInt(a.impressions)} />
        </div>
      </div>
    </div>
  );
}
