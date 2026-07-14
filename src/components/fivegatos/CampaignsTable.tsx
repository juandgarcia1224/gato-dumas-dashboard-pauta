"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CampaignStats } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";
import SeveridadPill from "./SeveridadPill";
import StatusBadge from "./StatusBadge";

type SortKey = "nombre" | "estado" | "adsets" | "spend" | "leads" | "cpl" | "semaforo";

const COLS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "nombre", label: "Campaña", numeric: false },
  { key: "estado", label: "Estado", numeric: false },
  { key: "adsets", label: "Adsets", numeric: true },
  { key: "spend", label: "Inversión mes", numeric: true },
  { key: "leads", label: "Leads", numeric: true },
  { key: "cpl", label: "CPL", numeric: true },
  { key: "semaforo", label: "Semáforo", numeric: false },
];

const SEMAFORO_RANK: Record<string, number> = {
  verde: 0,
  amarillo: 1,
  rojo: 2,
  sin_datos: 3,
};

function sortValue(r: CampaignStats, key: SortKey): number | string {
  switch (key) {
    case "nombre":
      return r.campaign_name;
    case "estado":
      return r.effective_status === "ACTIVE" ? 0 : 1;
    case "adsets":
      return r.adsetsTotal;
    case "spend":
      return r.spend;
    case "leads":
      return r.leads;
    case "cpl":
      return r.cpl ?? -Infinity;
    case "semaforo":
      return SEMAFORO_RANK[r.semaforo] ?? 9;
  }
}

/**
 * Nivel 1 del drill-down: lista de campañas del mes. Fila entera clickeable
 * → /5gatos/campana/{id}. Tabla admin sobria, ordenable, con totales al pie.
 */
export default function CampaignsTable({
  rows,
  month,
}: {
  rows: CampaignStats[];
  month: string;
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === "string" || typeof bv === "string") {
        const cmp = String(av).localeCompare(String(bv), "es");
        return asc ? cmp : -cmp;
      }
      return asc ? av - bv : bv - av;
    });
    return copy;
  }, [rows, sortKey, asc]);

  const totals = useMemo(() => {
    const spend = rows.reduce((s, r) => s + r.spend, 0);
    const leads = rows.reduce((s, r) => s + r.leads, 0);
    return {
      spend,
      leads,
      adsets: rows.reduce((s, r) => s + r.adsetsTotal, 0),
      cpl: leads > 0 ? spend / leads : null,
    };
  }, [rows]);

  function onSort(key: SortKey) {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(key === "nombre" || key === "estado" || key === "semaforo");
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-[6px] border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-sm text-gray-500">
        Sin campañas con actividad este mes.
      </p>
    );
  }

  const href = (id: string) => `/5gatos/campana/${id}?month=${month}`;

  return (
    <div className="overflow-x-auto rounded-[6px] border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th
                key={c.key}
                className={`sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-4 py-3 ${c.numeric ? "text-right" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onSort(c.key)}
                  className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors hover:text-gray-900 focus:outline-none focus-visible:rounded-[4px] focus-visible:ring-2 focus-visible:ring-gray-400 ${
                    sortKey === c.key ? "text-gray-900" : "text-gray-600"
                  }`}
                >
                  {c.label}
                  {sortKey === c.key && <span aria-hidden>{asc ? "▲" : "▼"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.campaign_id}
              tabIndex={0}
              onClick={() => router.push(href(r.campaign_id))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(href(r.campaign_id));
                }
              }}
              className="cursor-pointer border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400"
            >
              <td className="px-4 py-3">
                <Link
                  href={href(r.campaign_id)}
                  onClick={(e) => e.stopPropagation()}
                  tabIndex={-1}
                  className="text-sm font-semibold text-gray-900 hover:underline underline-offset-2"
                >
                  {r.campaign_name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  status={r.effective_status === "ACTIVE" ? "ACTIVE" : "PAUSED"}
                />
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums">
                {fmtInt(r.adsetsTotal)}
                {r.adsetsActivos > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({r.adsetsActivos} act.)
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 tabular-nums">
                {fmtCop(r.spend)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums">
                {fmtInt(r.leads)}
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums">
                {fmtCop(r.cpl)}
              </td>
              <td className="px-4 py-3">
                <SeveridadPill semaforo={r.semaforo} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-50 text-sm font-semibold text-gray-900">
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right tabular-nums">
              {fmtInt(totals.adsets)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {fmtCop(totals.spend)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {fmtInt(totals.leads)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {fmtCop(totals.cpl)}
            </td>
            <td className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
