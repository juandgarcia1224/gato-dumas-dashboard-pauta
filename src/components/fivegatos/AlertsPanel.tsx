import { fmtCop } from "@/lib/fivegatos/constants";
import type { Alerta } from "@/lib/dashboard/programacion-cross";

const SEVERIDAD_STYLES: Record<
  Alerta["severidad"],
  {
    ring: string;
    dot: string;
    chip: string;
    icon: string;
    label: string;
  }
> = {
  critica: {
    ring: "border-red-200 bg-red-50/70",
    dot: "bg-red-500",
    chip: "bg-red-100 text-red-800",
    icon: "text-red-600",
    label: "Crítica",
  },
  atender: {
    ring: "border-amber-200 bg-amber-50/70",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-900",
    icon: "text-amber-600",
    label: "Atender",
  },
  info: {
    ring: "border-blue-200 bg-blue-50/70",
    dot: "bg-blue-500",
    chip: "bg-blue-100 text-blue-800",
    icon: "text-blue-600",
    label: "Aviso",
  },
};

export default function AlertsPanel({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return (
      <section
        aria-label="Alertas de programación"
        className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span
            className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-700"
            aria-hidden
          >
            ✓
          </span>
          <div>
            <h2 className="text-base font-bold text-emerald-900">
              Todo alineado con la programación
            </h2>
            <p className="text-sm text-emerald-800/80">
              Los adsets activos coinciden con los cursos vigentes del cliente.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const orden: Alerta["severidad"][] = ["critica", "atender", "info"];
  const ordenadas = [...alertas].sort(
    (a, b) => orden.indexOf(a.severidad) - orden.indexOf(b.severidad),
  );

  const criticas = ordenadas.filter((a) => a.severidad === "critica").length;
  const atender = ordenadas.filter((a) => a.severidad === "atender").length;
  const info = ordenadas.filter((a) => a.severidad === "info").length;

  return (
    <section
      aria-label="Alertas de programación"
      className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">
            Alertas de programación
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Cruce entre pauta activa y programación oficial del cliente
            (Ruzmery).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {criticas > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 font-semibold text-red-800">
              {criticas} crítica{criticas === 1 ? "" : "s"}
            </span>
          )}
          {atender > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-900">
              {atender} atender
            </span>
          )}
          {info > 0 && (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-800">
              {info} aviso{info === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </header>
      <ul className="space-y-3">
        {ordenadas.map((a, i) => {
          const s = SEVERIDAD_STYLES[a.severidad];
          return (
            <li
              key={`${a.severidad}-${a.adset_id ?? "x"}-${i}`}
              className={`rounded-xl border ${s.ring} px-4 py-3.5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`}
                    aria-hidden
                  />
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-sm font-bold text-neutral-900">
                        {a.titulo}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.chip}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                      {a.mensaje}
                    </p>
                    {a.accion_sugerida && (
                      <p className="mt-1.5 text-sm text-neutral-500">
                        <span className="font-semibold text-neutral-600">
                          Sugerido:
                        </span>{" "}
                        {a.accion_sugerida}
                      </p>
                    )}
                  </div>
                </div>
                {a.valor_involucrado != null && a.valor_involucrado > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      En juego
                    </div>
                    <div className="text-sm font-bold tabular-nums text-neutral-900">
                      {fmtCop(a.valor_involucrado)}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
