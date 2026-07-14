import { fmtCop } from "@/lib/fivegatos/constants";
import type { Alerta } from "@/lib/dashboard/programacion-cross";

/**
 * Alertas del cruce pauta ↔ programación oficial del cliente.
 * Semánticos con soft backgrounds: crítica rojo · atender ámbar · info indigo.
 */
const SEVERIDAD_STYLES: Record<
  Alerta["severidad"],
  { box: string; edge: string; dot: string; chip: string; label: string }
> = {
  critica: {
    box: "border-gray-200 bg-red-50",
    edge: "border-l-red-600",
    dot: "bg-red-600",
    chip: "bg-red-100 text-red-700",
    label: "Crítica",
  },
  atender: {
    box: "border-gray-200 bg-amber-50",
    edge: "border-l-amber-600",
    dot: "bg-amber-600",
    chip: "bg-amber-100 text-amber-700",
    label: "Atender",
  },
  info: {
    box: "border-gray-200 bg-indigo-50/60",
    edge: "border-l-indigo-500",
    dot: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700",
    label: "Aviso",
  },
};

export default function AlertsPanel({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return (
      <section
        aria-label="Alertas de programación"
        className="rounded-[6px] border border-emerald-200 bg-emerald-50 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-emerald-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            aria-hidden
          >
            ✓
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Todo alineado con la programación
            </h2>
            <p className="text-sm text-gray-600">
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
      className="rounded-[6px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Alertas de programación
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Cruce entre la pauta activa y la programación oficial del cliente.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          {criticas > 0 && (
            <span className="rounded-[4px] bg-red-100 px-2 py-1 text-red-700">
              {criticas} crítica{criticas === 1 ? "" : "s"}
            </span>
          )}
          {atender > 0 && (
            <span className="rounded-[4px] bg-amber-100 px-2 py-1 text-amber-700">
              {atender} atender
            </span>
          )}
          {info > 0 && (
            <span className="rounded-[4px] bg-indigo-50 px-2 py-1 text-indigo-700">
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
              className={`rounded-[6px] border border-l-[3px] px-4 py-3.5 ${s.box} ${s.edge}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${s.dot}`}
                    aria-hidden
                  />
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {a.titulo}
                      </h3>
                      <span
                        className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${s.chip}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">
                      {a.mensaje}
                    </p>
                    {a.accion_sugerida && (
                      <p className="mt-1.5 text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">
                          Sugerido:
                        </span>{" "}
                        {a.accion_sugerida}
                      </p>
                    )}
                  </div>
                </div>
                {a.valor_involucrado != null && a.valor_involucrado > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      En juego
                    </div>
                    <div className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">
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
