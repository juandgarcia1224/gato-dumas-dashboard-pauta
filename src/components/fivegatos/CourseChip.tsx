import type { CursoInfo } from "@/lib/fivegatos/data";
import {
  estadoCursoLabel,
  fmtInt,
  formatFechaCurso,
  INSCRITOS_ESPERADOS_CURSO,
} from "@/lib/fivegatos/constants";

/** Color del estado del curso (sutil, dentro de la paleta semántica). */
function estadoCls(estado: CursoInfo["estado"]): string {
  switch (estado) {
    case "INICIO":
      return "bg-emerald-50 text-emerald-700";
    case "POR_ABRIR":
      return "bg-indigo-50 text-indigo-700";
    case "FINALIZO":
      return "bg-gray-100 text-gray-600";
    case "DETENIDO":
    case "CANCELADO":
    case "SUSPENDIDO":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function fechas(curso: CursoInfo): string {
  return (
    formatFechaCurso(curso.fecha_inicio, curso.fecha_fin) ||
    curso.fecha_texto ||
    "Fechas por confirmar"
  );
}

/**
 * Info del curso del Excel del cliente, cuando el mapeo curso↔adset matchea.
 * - variant="chip": compacto para celdas de tabla.
 * - variant="card": tarjeta destacada para el header del adset.
 */
export default function CourseChip({
  curso,
  variant = "chip",
}: {
  curso: CursoInfo;
  variant?: "chip" | "card";
}) {
  if (variant === "card") {
    return (
      <div className="rounded-[6px] border border-gray-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Curso · Programación del cliente
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-900">{curso.nombre}</p>
        <p className="mt-1.5 text-sm text-gray-600 tabular-nums">
          {fechas(curso)}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
          <span
            className={`inline-flex items-center rounded-[4px] px-2 py-0.5 text-xs font-medium ${estadoCls(curso.estado)}`}
          >
            {estadoCursoLabel(curso.estado)}
          </span>
          <span className="tabular-nums">
            Inscritos: <strong className="font-semibold text-gray-900">{fmtInt(curso.inscritos)}</strong>
            <span className="text-gray-400"> / {INSCRITOS_ESPERADOS_CURSO} esperados</span>
          </span>
        </p>
      </div>
    );
  }

  return (
    <span className="inline-flex min-w-0 flex-col gap-0.5">
      <span className="flex items-center gap-1.5">
        <span className="truncate text-sm font-medium text-gray-900">
          {curso.nombre}
        </span>
        <span
          className={`inline-flex shrink-0 items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium ${estadoCls(curso.estado)}`}
        >
          {estadoCursoLabel(curso.estado)}
        </span>
      </span>
      <span className="text-xs text-gray-500 tabular-nums">
        {fechas(curso)} · {fmtInt(curso.inscritos)} inscritos
      </span>
    </span>
  );
}
