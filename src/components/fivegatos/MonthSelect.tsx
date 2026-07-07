"use client";

import { useRouter } from "next/navigation";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function labelMes(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const nombre = MESES[(m ?? 1) - 1] ?? "";
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${y}`;
}

export default function MonthSelect({
  value,
  options,
}: {
  value: string;
  options: string[];
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-600">
      <span className="hidden sm:inline font-medium">Mes</span>
      <select
        value={value}
        onChange={(e) => router.push(`/5gatos?month=${e.target.value}`)}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base font-semibold text-neutral-900 shadow-sm outline-none focus:border-[#B8232A] focus:ring-2 focus:ring-[#B8232A]/20"
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
