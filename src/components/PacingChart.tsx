"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PacingView } from "@/lib/dashboard/contract";
import { getAccountGroup } from "@/lib/config/clients";
import { formatCOP } from "@/lib/dashboard/formatters";
import EmptyState from "./EmptyState";

const STATUS_LABEL: Record<string, string> = {
  on_track: "En ritmo",
  overpacing: "Sobreconsumo",
  underpacing: "Subconsumo",
  no_plan: "Sin plan",
};

const STATUS_COLOR: Record<string, string> = {
  on_track: "#16a34a",
  overpacing: "#dc2626",
  underpacing: "#d97706",
  no_plan: "#9ca3af",
};

/**
 * Pacing de gasto: esperado vs real por cuenta. Diseño PROVISIONAL.
 * Si no hay plan de medios, lo indica como estado (no inventa presupuesto).
 */
export default function PacingChart({ pacing }: { pacing: PacingView[] }) {
  const withPlan = pacing.filter((p) => p.planned_monthly_budget !== null);

  if (pacing.length === 0) {
    return (
      <EmptyState
        title="Sin datos de pacing"
        message="Ejecuta meta:update y completa 01_MediaPlan para ver el ritmo de gasto."
      />
    );
  }

  const data = pacing.map((p) => ({
    name: getAccountGroup(String(p.account_group))?.label ?? p.account_group,
    esperado: p.expected_spend_to_date ?? 0,
    real: p.actual_spend_to_date ?? 0,
    status: p.pacing_status,
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {withPlan.length === 0 && (
        <p className="mb-2 text-xs text-amber-600">
          Sin presupuesto planificado en 01_MediaPlan: se muestra solo gasto real.
        </p>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
            />
            <Tooltip formatter={(v: number) => formatCOP(v)} />
            <Legend />
            <Bar dataKey="esperado" name="Esperado a la fecha" fill="#9ca3af" />
            <Bar dataKey="real" name="Real a la fecha">
              {data.map((d, i) => (
                <Cell key={i} fill={STATUS_COLOR[d.status] ?? "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {pacing.map((p) => (
          <span key={p.account_group} className="text-gray-600">
            <strong>
              {getAccountGroup(String(p.account_group))?.label ??
                p.account_group}
              :
            </strong>{" "}
            {STATUS_LABEL[p.pacing_status] ?? p.pacing_status}
            {p.spend_delta_pct !== null && (
              <span className="text-gray-400">
                {" "}
                ({p.spend_delta_pct > 0 ? "+" : ""}
                {p.spend_delta_pct}%)
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
