import type { AccountSummary } from "@/lib/dashboard/metrics";
import {
  formatCOP,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/formatters";

/** Resumen comparativo por cuenta (Gato Colombia vs Gato Bucaramanga). */
export default function AccountSummaryTable({
  accounts,
}: {
  accounts: AccountSummary[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Cuenta</th>
            <th className="px-3 py-2">Sede</th>
            <th className="px-3 py-2 text-right">Inversión</th>
            <th className="px-3 py-2 text-right">Resultados</th>
            <th className="px-3 py-2 text-right">CPR</th>
            <th className="px-3 py-2 text-right">CTR</th>
            <th className="px-3 py-2 text-right">Frec.</th>
            <th className="px-3 py-2 text-right">Activas</th>
            <th className="px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {accounts.map((a) => (
            <tr key={a.accountGroup}>
              <td className="px-3 py-2 font-medium text-gray-900">{a.label}</td>
              <td className="px-3 py-2 text-gray-500">{a.sede}</td>
              <td className="px-3 py-2 text-right">{formatCOP(a.kpis.spend)}</td>
              <td className="px-3 py-2 text-right">
                {a.kpis.results === null ? "—" : formatNumber(a.kpis.results)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatCOP(a.kpis.costPerResult)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPercent(a.kpis.avgCtr)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatDecimal(a.kpis.avgFrequency)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatNumber(a.kpis.activeCampaigns)}
              </td>
              <td className="px-3 py-2">
                {!a.configured ? (
                  <span className="text-amber-600">Sin configurar</span>
                ) : !a.hasData ? (
                  <span className="text-gray-400">Sin datos</span>
                ) : (
                  <span className="text-green-600">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
