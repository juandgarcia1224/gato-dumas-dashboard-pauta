import type { AdsetView } from "@/lib/dashboard/contract";
import {
  formatCOP,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/formatters";
import EmptyState from "./EmptyState";

export default function AdsetTable({ rows }: { rows: AdsetView[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin conjuntos de anuncios"
        message="No hay adsets en el rango/filtro actual."
      />
    );
  }
  const sorted = [...rows].sort((a, b) => b.spend - a.spend).slice(0, 100);
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Conjunto</th>
            <th className="px-3 py-2">Campaña</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Presup. diario</th>
            <th className="px-3 py-2 text-right">Inversión</th>
            <th className="px-3 py-2 text-right">Result.</th>
            <th className="px-3 py-2 text-right">CTR</th>
            <th className="px-3 py-2 text-right">Frec.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((r) => (
            <tr key={r.adset_id}>
              <td className="max-w-xs truncate px-3 py-2 font-medium text-gray-900" title={r.adset_name}>
                {r.adset_name}
              </td>
              <td className="max-w-[12rem] truncate px-3 py-2 text-gray-500" title={r.campaign_name}>
                {r.campaign_name}
              </td>
              <td className="px-3 py-2 text-gray-500">{r.effective_status || "—"}</td>
              <td className="px-3 py-2 text-right">{formatCOP(r.daily_budget)}</td>
              <td className="px-3 py-2 text-right">{formatCOP(r.spend)}</td>
              <td className="px-3 py-2 text-right">
                {r.results === null ? "—" : formatNumber(r.results)}
              </td>
              <td className="px-3 py-2 text-right">{formatPercent(r.ctr)}</td>
              <td className="px-3 py-2 text-right">{formatDecimal(r.frequency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
