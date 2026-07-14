"use client";

import { useRouter } from "next/navigation";
import { labelMes } from "./labelMes";

/**
 * Selector de mes estándar. `basePath` permite reutilizarlo en las vistas
 * de detalle (campaña/adset) conservando la ruta actual.
 */
export default function MonthSelect({
  value,
  options,
  basePath = "/5gatos",
}: {
  value: string;
  options: string[];
  basePath?: string;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:inline">
        Mes
      </span>
      <select
        value={value}
        onChange={(e) => router.push(`${basePath}?month=${e.target.value}`)}
        className="rounded-[6px] border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
        aria-label="Seleccionar mes"
      >
        {options.map((m) => (
          <option key={m} value={m}>
            {labelMes(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
