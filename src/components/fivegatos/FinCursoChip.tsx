import type { CursoInfo } from "@/lib/fivegatos/data";
import { fmtFechaCorta } from "@/lib/fivegatos/constants";

/**
 * Chip discreto con la fecha del curso del Excel del cliente, al lado del
 * nombre del adset:
 *   - curso vigente        → gris   "Fin: 29 jul"
 *   - curso ya terminado   → rojo   "Cerró 29 jul"
 *   - curso que no arranca → ámbar  "Inicia 8 jul"
 *   - sin match del Excel  → no se renderiza (el padre pasa curso=null).
 * Fechas cortas "29 jul"; incluye año solo si no es el actual.
 */
export default function FinCursoChip({ curso }: { curso: CursoInfo | null }) {
  if (!curso) return null;

  const hoy = new Date();
  const inicio = curso.fecha_inicio ? new Date(curso.fecha_inicio) : null;
  const fin = curso.fecha_fin ? new Date(curso.fecha_fin) : null;

  let label: string;
  let cls: string;
  if (fin && fin.getTime() < hoy.getTime()) {
    label = `Cerró ${fmtFechaCorta(curso.fecha_fin)}`;
    cls = "bg-red-100 text-red-700";
  } else if (inicio && inicio.getTime() > hoy.getTime()) {
    label = `Inicia ${fmtFechaCorta(curso.fecha_inicio)}`;
    cls = "bg-amber-100 text-amber-700";
  } else if (fin) {
    label = `Fin: ${fmtFechaCorta(curso.fecha_fin)}`;
    cls = "bg-gray-100 text-gray-600";
  } else {
    // Curso matcheado pero sin fechas parseables en el Excel.
    return null;
  }

  return (
    <span
      title={`Curso: ${curso.nombre}`}
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${cls}`}
    >
      {label}
    </span>
  );
}
