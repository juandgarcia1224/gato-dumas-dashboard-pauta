"use client";

import { useRouter } from "next/navigation";
import { labelMes } from "./labelMes";

export default function MonthSelect({
  value,
  options,
}: {
  value: string;
  options: string[];
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2">
      <span className="lab-eyebrow hidden text-[10px] text-lab-muted sm:inline">
        Mes
      </span>
      <select
        value={value}
        onChange={(e) => router.push(`/5gatos?month=${e.target.value}`)}
        className="lab-mono rounded-sm border border-lab-rule-strong bg-lab-surface px-3 py-2.5 text-sm font-medium text-lab-ink outline-none transition-colors focus:border-lab-accent focus:ring-1 focus:ring-lab-accent"
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
