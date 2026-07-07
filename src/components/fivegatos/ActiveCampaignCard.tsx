import type { CampaignMonthStats } from "@/lib/fivegatos/data";
import { BENCHMARK_CPL, fmtCop, fmtPct } from "@/lib/fivegatos/constants";

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

export default function ActiveCampaignCard({ c }: { c: CampaignMonthStats }) {
  const s = SEMAFORO_STYLE[c.semaforo] ?? SEMAFORO_STYLE.sin_datos;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold leading-snug text-neutral-900">
            {c.campaign_name}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {c.nombre_normalizado ? (
              <>
                <span
                  className={`mr-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    c.tipo === "Programa"
                      ? "bg-neutral-900 text-white"
                      : "bg-[#B8232A]/10 text-[#B8232A]"
                  }`}
                >
                  {c.tipo}
                </span>
                {c.nombre_normalizado}
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

      <div className="flex items-end justify-between border-t border-neutral-100 pt-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Gasto del mes
          </p>
          <p className="text-2xl font-bold tabular-nums text-neutral-900">
            {fmtCop(c.spend)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            CPL
          </p>
          <p className={`text-2xl font-bold tabular-nums ${s.text}`}>
            {fmtCop(c.cpl)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-neutral-100 pt-3">
        <Metric label="CPM" value={fmtCop(c.cpm)} />
        <Metric label="CTR" value={fmtPct(c.ctr)} />
        <Metric label="CPC" value={fmtCop(c.cpc)} />
      </div>
    </div>
  );
}
