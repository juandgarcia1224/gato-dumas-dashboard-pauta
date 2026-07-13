import { fmtCop } from "@/lib/fivegatos/constants";
import type { Alerta } from "@/lib/dashboard/programacion-cross";

/**
 * Severidad con la paleta semántica oficial The Lab:
 * crítica = terracota desaturado · atender = ámbar tostado ·
 * info = teal institucional (paleta oficial). Border-left de 3px.
 */
const SEVERIDAD_STYLES: Record<
  Alerta["severidad"],
  {
    ring: string;
    edge: string;
    dot: string;
    chip: string;
    label: string;
  }
> = {
  critica: {
    ring: "border-lab-rule bg-lab-terracota-soft",
    edge: "border-l-lab-terracota",
    dot: "bg-lab-terracota",
    chip: "bg-lab-terracota-soft text-lab-terracota",
    label: "Crítica",
  },
  atender: {
    ring: "border-lab-rule bg-lab-ambar-soft",
    edge: "border-l-lab-ambar",
    dot: "bg-lab-ambar",
    chip: "bg-lab-ambar-soft text-lab-ambar",
    label: "Atender",
  },
  info: {
    ring: "border-lab-rule bg-lab-teal-soft",
    edge: "border-l-lab-teal",
    dot: "bg-lab-teal",
    chip: "bg-lab-teal-soft text-lab-teal",
    label: "Aviso",
  },
};

export default function AlertsPanel({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return (
      <section
        aria-label="Alertas de programación"
        className="border border-lab-menta border-l-[3px] border-l-lab-menta bg-lab-menta-soft px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <span
            className="lab-frame grid h-8 w-8 shrink-0 place-items-center bg-lab-surface text-lab-salvia"
            aria-hidden
          >
            ✓
          </span>
          <div>
            <h2 className="text-base font-semibold text-lab-ink-strong">
              Todo alineado con la programación
            </h2>
            <p className="text-sm text-lab-muted">
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
      className="border border-lab-rule bg-lab-surface p-5"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="lab-eyebrow text-[10px] text-lab-teal">
            Alertas · Programación
          </p>
          <h2 className="mt-1 text-lg font-semibold text-lab-ink-strong">
            Alertas de programación
          </h2>
          <p className="mt-0.5 text-sm text-lab-muted">
            Cruce entre pauta activa y programación oficial del cliente
            (Ruzmery).
          </p>
        </div>
        <div className="lab-mono flex items-center gap-2 text-[10px] uppercase tracking-wider">
          {criticas > 0 && (
            <span className="rounded-[2px] bg-lab-terracota-soft px-2 py-1 font-medium text-lab-terracota">
              {criticas} crítica{criticas === 1 ? "" : "s"}
            </span>
          )}
          {atender > 0 && (
            <span className="rounded-[2px] bg-lab-ambar-soft px-2 py-1 font-medium text-lab-ambar">
              {atender} atender
            </span>
          )}
          {info > 0 && (
            <span className="rounded-[2px] bg-lab-teal-soft px-2 py-1 font-medium text-lab-teal">
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
              className={`border border-l-[3px] px-4 py-3.5 ${s.ring} ${s.edge}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${s.dot}`}
                    aria-hidden
                  />
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="text-sm font-semibold text-lab-ink-strong">
                        {a.titulo}
                      </h3>
                      <span
                        className={`lab-mono rounded-[2px] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${s.chip}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-lab-ink">
                      {a.mensaje}
                    </p>
                    {a.accion_sugerida && (
                      <p className="mt-1.5 text-sm text-lab-muted">
                        <span className="font-semibold text-lab-ink">
                          Sugerido:
                        </span>{" "}
                        {a.accion_sugerida}
                      </p>
                    )}
                  </div>
                </div>
                {a.valor_involucrado != null && a.valor_involucrado > 0 && (
                  <div className="shrink-0 text-right">
                    <div className="lab-eyebrow text-[9px] text-lab-muted">
                      En juego
                    </div>
                    <div className="mt-0.5 text-sm font-semibold tabular-nums text-lab-ink-strong">
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
