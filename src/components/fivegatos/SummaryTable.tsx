"use client";

import { useMemo, useState } from "react";
import type { GroupSummaryRow } from "@/lib/fivegatos/data";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";

type SortKey =
  | "nombre"
  | "inversion"
  | "inversionLifetime"
  | "impressions"
  | "clicks"
  | "leads"
  | "cpl"
  | "adsetsActivos";

const COLS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "nombre", label: "", numeric: false },
  { key: "inversion", label: "Inversión (mes)", numeric: true },
  { key: "inversionLifetime", label: "Desde inicio", numeric: true },
  { key: "impressions", label: "Impresiones", numeric: true },
  { key: "clicks", label: "Clics", numeric: true },
  { key: "leads", label: "Leads", numeric: true },
  { key: "cpl", label: "CPL", numeric: true },
  { key: "adsetsActivos", label: "Adsets activos", numeric: true },
];

export default function SummaryTable({
  rows,
  firstColLabel,
}: {
  rows: GroupSummaryRow[];
  firstColLabel: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("inversion");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === "nombre") {
        return asc
          ? a.nombre.localeCompare(b.nombre, "es")
          : b.nombre.localeCompare(a.nombre, "es");
      }
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return asc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [rows, sortKey, asc]);

  const totals = useMemo(() => {
    const inversion = rows.reduce((s, r) => s + r.inversion, 0);
    const inversionLifetime = rows.reduce((s, r) => s + r.inversionLifetime, 0);
    const impressions = rows.reduce((s, r) => s + r.impressions, 0);
    const clicks = rows.reduce((s, r) => s + r.clicks, 0);
    const leads = rows.reduce((s, r) => s + r.leads, 0);
    const adsetsActivos = rows.reduce((s, r) => s + r.adsetsActivos, 0);
    return {
      inversion,
      inversionLifetime,
      impressions,
      clicks,
      leads,
      adsetsActivos,
      cpl: leads > 0 ? inversion / leads : null,
    };
  }, [rows]);

  function onSort(key: SortKey) {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(key === "nombre");
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 bg-white/60 px-5 py-8 text-center text-base text-neutral-500">
        Sin inversión registrada este mes.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full min-w-[860px] text-left">
        <thead>
          <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
            {COLS.map((c) => (
              <th
                key={c.key}
                className={c.numeric ? "px-4 py-3 text-right" : "px-5 py-3"}
              >
                <button
                  type="button"
                  onClick={() => onSort(c.key)}
                  className={`inline-flex items-center gap-1 font-semibold hover:text-[#B8232A] ${
                    sortKey === c.key ? "text-[#B8232A]" : ""
                  }`}
                >
                  {c.key === "nombre" ? firstColLabel : c.label}
                  {sortKey === c.key && (
                    <span aria-hidden>{asc ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.nombre}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
            >
              <td className="px-5 py-3.5 text-base font-semibold text-neutral-900">
                {r.nombre}
                {r.adsets > 1 && (
                  <span className="ml-2 text-xs font-normal text-neutral-400">
                    {r.adsets} adsets
                  </span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right text-base font-semibold tabular-nums text-neutral-900">
                {fmtCop(r.inversion)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-neutral-700">
                {fmtCop(r.inversionLifetime)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-neutral-700">
                {fmtInt(r.impressions)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-neutral-700">
                {fmtInt(r.clicks)}
              </td>
              <td className="px-4 py-3.5 text-right text-base font-semibold tabular-nums text-neutral-900">
                {fmtInt(r.leads)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-neutral-700">
                {fmtCop(r.cpl)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-neutral-700">
                {fmtInt(r.adsetsActivos)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-neutral-300 bg-neutral-50 text-base font-bold text-neutral-900">
            <td className="px-5 py-3.5">Total</td>
            <td className="px-4 py-3.5 text-right tabular-nums">{fmtCop(totals.inversion)}</td>
            <td className="px-4 py-3.5 text-right tabular-nums">{fmtCop(totals.inversionLifetime)}</td>
            <td className="px-4 py-3.5 text-right tabular-nums">{fmtInt(totals.impressions)}</td>
            <td className="px-4 py-3.5 text-right tabular-nums">{fmtInt(totals.clicks)}</td>
            <td className="px-4 py-3.5 text-right tabular-nums">{fmtInt(totals.leads)}</td>
            <td className="px-4 py-3.5 text-right tabular-nums">{fmtCop(totals.cpl)}</td>
            <td className="px-4 py-3.5 text-right tabular-nums">{fmtInt(totals.adsetsActivos)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
