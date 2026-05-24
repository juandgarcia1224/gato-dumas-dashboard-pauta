import type { CampaignRecord } from "@/lib/dashboard/metrics";
import { getAccountGroup } from "@/lib/config/clients";
import {
  formatCOP,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/formatters";
import EmptyState from "./EmptyState";

function statusClass(s: string): string {
  const v = s.toUpperCase();
  if (v === "ACTIVE") return "text-green-600";
  if (v.includes("PAUSED")) return "text-gray-400";
  return "text-amber-600";
}

export default function CampaignTable({ rows }: { rows: CampaignRecord[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin campañas para mostrar"
        message="No hay datos de campañas en el rango/filtro actual."
      />
    );
  }
  const sorted = [...rows].sort((a, b) => b.spend - a.spend);
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Campaña</th>
            <th className="px-3 py-2">Cuenta</th>
            <th className="px-3 py-2">Objetivo</th>
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
            <tr key={r.campaign_id}>
              <td className="max-w-xs truncate px-3 py-2 font-medium text-gray-900" title={r.campaign_name}>
                {r.campaign_name}
              </td>
              <td className="px-3 py-2 text-gray-500">
                {getAccountGroup(r.account_group)?.label ?? r.account_group}
              </td>
              <td className="px-3 py-2 text-gray-500">{r.objective || "—"}</td>
              <td className={`px-3 py-2 ${statusClass(r.effective_status)}`}>
                {r.effective_status || "—"}
              </td>
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
