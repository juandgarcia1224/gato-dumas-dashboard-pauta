/**
 * Card KPI sobria: label chico uppercase sutil → número grande sans →
 * delta/nota al pie. Números siempre tabulares.
 */
export default function Kpi({
  label,
  value,
  foot,
}: {
  label: string;
  value: string;
  foot?: React.ReactNode;
}) {
  return (
    <div className="rounded-[6px] border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums sm:text-3xl">
        {value}
      </p>
      {foot && <div className="mt-2 text-xs text-gray-500">{foot}</div>}
    </div>
  );
}
