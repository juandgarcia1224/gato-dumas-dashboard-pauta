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

  /** Máximo de inversión del grupo, para el bar track de distribución. */
  const maxInversion = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.inversion), 0),
    [rows],
  );

  function onSort(key: SortKey) {
    if (key === sortKey) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(key === "nombre");
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-sm border border-dashed border-lab-rule-strong bg-lab-surface px-5 py-8 text-center text-base text-lab-muted">
        Sin inversión registrada este mes.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-lab-rule bg-lab-surface">
      <table className="w-full min-w-[860px] text-left">
        <thead>
          <tr className="border-b border-lab-rule bg-lab-coconut-deep">
            {COLS.map((c) => (
              <th
                key={c.key}
                className={c.numeric ? "px-4 py-3 text-right" : "px-5 py-3"}
              >
                <button
                  type="button"
                  onClick={() => onSort(c.key)}
                  className={`lab-eyebrow inline-flex items-center gap-1 text-[10px] transition-colors hover:text-lab-teal ${
                    sortKey === c.key ? "text-lab-accent" : "text-lab-muted"
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
              className="border-b border-lab-rule last:border-0 hover:bg-lab-coconut"
            >
              <td className="px-5 py-3.5 text-base font-semibold text-lab-ink-strong">
                {r.nombre}
                {r.adsets > 1 && (
                  <span className="lab-mono ml-2 text-[10px] font-normal uppercase tracking-wider text-lab-faint">
                    {r.adsets} adsets
                  </span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right text-base font-semibold tabular-nums text-lab-ink-strong">
                {fmtCop(r.inversion)}
                {/* Bar track de distribución (teal institucional) */}
                <span
                  aria-hidden
                  className="ml-auto mt-1.5 block h-[3px] w-24 bg-lab-coconut-deep"
                >
                  <span
                    className="block h-full bg-lab-teal"
                    style={{
                      width: `${maxInversion > 0 ? Math.max(2, Math.round((r.inversion / maxInversion) * 100)) : 0}%`,
                    }}
                  />
                </span>
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-lab-ink">
                {fmtCop(r.inversionLifetime)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-lab-ink">
                {fmtInt(r.impressions)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-lab-ink">
                {fmtInt(r.clicks)}
              </td>
              <td className="px-4 py-3.5 text-right text-base font-semibold tabular-nums text-lab-ink-strong">
                {fmtInt(r.leads)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-lab-ink">
                {fmtCop(r.cpl)}
              </td>
              <td className="px-4 py-3.5 text-right text-base tabular-nums text-lab-ink">
                {fmtInt(r.adsetsActivos)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-lab-rule-strong bg-lab-coconut text-base font-bold text-lab-ink-strong">
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
