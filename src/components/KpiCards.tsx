import {
  DollarSign,
  Target,
  TrendingDown,
  Repeat,
  MousePointerClick,
  PlayCircle,
  AlertTriangle,
} from "lucide-react";
import type { Kpis } from "@/lib/dashboard/metrics";
import {
  formatCOP,
  formatDecimal,
  formatNumber,
  formatPercent,
} from "@/lib/dashboard/formatters";

/**
 * Tarjetas de KPIs. Diseño PROVISIONAL.
 * Si un valor es null se muestra "—" (nunca se inventa).
 */
export default function KpiCards({ kpis }: { kpis: Kpis }) {
  const cards = [
    {
      label: "Inversión total",
      value: formatCOP(kpis.spend),
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: "Resultados",
      value: kpis.results === null ? "—" : formatNumber(kpis.results),
      icon: <Target className="h-4 w-4" />,
    },
    {
      label: "Costo por resultado",
      value: formatCOP(kpis.costPerResult),
      icon: <TrendingDown className="h-4 w-4" />,
    },
    {
      label: "Frecuencia prom.",
      value: formatDecimal(kpis.avgFrequency),
      icon: <Repeat className="h-4 w-4" />,
    },
    {
      label: "CTR promedio",
      value: formatPercent(kpis.avgCtr),
      icon: <MousePointerClick className="h-4 w-4" />,
    },
    {
      label: "Campañas activas",
      value: formatNumber(kpis.activeCampaigns),
      icon: <PlayCircle className="h-4 w-4" />,
    },
    {
      label: "Alertas críticas",
      value: formatNumber(kpis.criticalAlerts),
      icon: <AlertTriangle className="h-4 w-4" />,
      highlight: kpis.criticalAlerts > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {cards.map((c) => (
        <div
          key={c.label}
          className={[
            "rounded-lg border bg-white p-3",
            c.highlight ? "border-red-300 bg-red-50" : "border-gray-200",
          ].join(" ")}
        >
          <div className="flex items-center gap-1.5 text-gray-400">
            {c.icon}
            <span className="text-xs font-medium text-gray-500">{c.label}</span>
          </div>
          <p
            className={[
              "mt-1.5 text-lg font-semibold",
              c.highlight ? "text-red-700" : "text-gray-900",
            ].join(" ")}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}
