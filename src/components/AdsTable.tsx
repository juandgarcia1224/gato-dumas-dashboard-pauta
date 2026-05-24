import type { AdView } from "@/lib/dashboard/contract";
import {
  formatCOP,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/formatters";
import EmptyState from "./EmptyState";

export default function AdsTable({ rows }: { rows: AdView[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin anuncios"
        message="No hay anuncios en el rango/filtro actual."
      />
    );
  }
  const sorted = [...rows].sort((a, b) => b.spend - a.spend).slice(0, 100);
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Anuncio</th>
            <th className="px-3 py-2">Conjunto</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Inversión</th>
            <th className="px-3 py-2 text-right">Result.</th>
            <th className="px-3 py-2 text-right">CPR</th>
            <th className="px-3 py-2 text-right">CTR</th>
            <th className="px-3 py-2 text-right">Frec.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((r) => (
            <tr key={r.ad_id}>
              <td className="max-w-xs truncate px-3 py-2 font-medium text-gray-900" title={r.ad_name}>
                {r.ad_name}
              </td>
              <td className="max-w-[12rem] truncate px-3 py-2 text-gray-500" title={r.adset_name}>
                {r.adset_name}
              </td>
              <td className="px-3 py-2 text-gray-500">{r.effective_status || "—"}</td>
              <td className="px-3 py-2 text-right">{formatCOP(r.spend)}</td>
              <td className="px-3 py-2 text-right">
                {r.results === null ? "—" : formatNumber(r.results)}
              </td>
              <td className="px-3 py-2 text-right">{formatCOP(r.cost_per_result)}</td>
              <td className="px-3 py-2 text-right">{formatPercent(r.ctr)}</td>
              <td className="px-3 py-2 text-right">{formatDecimal(r.frequency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
