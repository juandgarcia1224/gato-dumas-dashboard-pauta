import type { Semaforo } from "@/lib/fivegatos/constants";
import { BENCHMARK_CPL, fmtCop } from "@/lib/fivegatos/constants";

/**
 * Semáforo de CPL vs benchmark: verde/ámbar/rojo con soft background.
 * Único lugar (junto a alertas) donde se usan colores semánticos.
 */
const SEMAFORO_MAP: Record<Semaforo, { label: string; cls: string; dot: string }> = {
  verde: {
    label: "CPL saludable",
    cls: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  amarillo: {
    label: "CPL a vigilar",
    cls: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  rojo: {
    label: "CPL alto",
    cls: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
  sin_datos: {
    label: "Sin leads",
    cls: "bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
};

export default function SeveridadPill({ semaforo }: { semaforo: Semaforo }) {
  const s = SEMAFORO_MAP[semaforo] ?? SEMAFORO_MAP.sin_datos;
  return (
    <span
      title={`Benchmark CPL: ${fmtCop(BENCHMARK_CPL)}`}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-2 py-0.5 text-xs font-medium ${s.cls}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
