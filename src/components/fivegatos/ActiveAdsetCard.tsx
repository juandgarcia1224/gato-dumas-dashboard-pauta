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

/**
 * Semáforo de severidad (roles semánticos, fuera de la paleta institucional):
 * sano = salvia · vigilar = ámbar · atender = terracota desaturado.
 */
const SEMAFORO_STYLE: Record<
  string,
  { dot: string; label: string; text: string; edge: string; chip: string }
> = {
  verde: {
    dot: "bg-lab-salvia",
    label: "CPL saludable",
    text: "text-lab-salvia",
    edge: "border-l-lab-salvia",
    chip: "bg-lab-salvia-soft",
  },
  amarillo: {
    dot: "bg-lab-ambar",
    label: "CPL a vigilar",
    text: "text-lab-ambar",
    edge: "border-l-lab-ambar",
    chip: "bg-lab-ambar-soft",
  },
  rojo: {
    dot: "bg-lab-terracota",
    label: "CPL alto",
    text: "text-lab-terracota",
    edge: "border-l-lab-terracota",
    chip: "bg-lab-terracota-soft",
  },
  sin_datos: {
    dot: "bg-lab-faint",
    label: "Sin leads aún",
    text: "text-lab-muted",
    edge: "border-l-lab-rule-strong",
    chip: "bg-lab-coconut",
  },
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="lab-eyebrow text-[9px] text-lab-faint">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-lab-ink">
        {value}
      </p>
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
    <div
      className={`flex flex-col gap-4 border border-lab-rule border-l-[3px] bg-lab-surface p-5 ${s.edge}`}
    >
      {/* Eyebrow: campaña padre (contenedor) */}
      <p className="lab-eyebrow truncate text-[10px] text-lab-accent opacity-75">
        Campaña · {a.campaign_name || "—"}
      </p>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-snug text-lab-ink-strong">
            {a.adset_name}
          </p>
          <p className="mt-1.5 text-sm text-lab-muted">
            {a.nombre_normalizado ? (
              <>
                <span className="lab-mono mr-1.5 rounded-[2px] bg-lab-coconut-deep px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-lab-accent">
                  {a.tipo}
                </span>
                {a.nombre_normalizado}
              </>
            ) : (
              <span className="italic text-lab-faint">Sin clasificar</span>
            )}
          </p>
        </div>
        <span
          className={`lab-mono inline-flex shrink-0 items-center gap-1.5 rounded-[2px] px-2 py-1 text-[10px] font-medium uppercase tracking-wider ${s.chip} ${s.text}`}
          title={`Benchmark CPL: ${fmtCop(BENCHMARK_CPL)}`}
        >
          <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
          {s.label}
        </span>
      </div>

      {/* Consumo lifetime destacado (Plex Sans, no display condensed) */}
      <div className="border-t border-lab-rule pt-3">
        <p className="lab-eyebrow text-[10px] text-lab-muted">Consumo total</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-lab-ink-strong">
          {fmtCop(a.spend_lifetime)}
        </p>
        <p className="mt-0.5 text-xs text-lab-faint">
          desde el inicio del adset
        </p>
      </div>

      {/* Métricas secundarias del mes */}
      <div className="grid grid-cols-3 gap-3 border-t border-lab-rule pt-3">
        <Metric label="Gasto del mes" value={fmtCop(a.spend)} />
        <Metric label="Leads (mes)" value={fmtInt(a.leads)} />
        <div>
          <p className="lab-eyebrow text-[9px] text-lab-faint">CPL (mes)</p>
          <p className={`mt-0.5 text-sm font-semibold tabular-nums ${s.text}`}>
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

      {/* Fechas y días corridos — bloque discreto al pie, con hairline */}
      <div className="lab-mono border-t border-lab-rule pt-3 text-[11px] text-lab-muted">
        <span className="tabular-nums">
          Inicio: <strong className="font-medium text-lab-ink">{fmtFecha(a.start_time)}</strong>
        </span>
        <span className="mx-1.5 text-lab-faint">·</span>
        <span className="tabular-nums">
          Fin:{" "}
          <strong className="font-medium text-lab-ink">
            {a.end_time ? fmtFecha(a.end_time) : "sin fecha fin"}
          </strong>
        </span>
        {dias !== null && (
          <>
            <span className="mx-1.5 text-lab-faint">·</span>
            <span className="tabular-nums">
              Días corridos:{" "}
              <strong className="font-medium text-lab-ink">{fmtInt(dias)}</strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
