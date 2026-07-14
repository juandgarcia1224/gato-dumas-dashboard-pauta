/**
 * /5gatos/campana/[id] — NIVEL 2 del drill-down: adsets de una campaña,
 * con el curso del Excel del cliente al lado cuando el mapeo matchea.
 * Server Component (Meta READ-ONLY). Look admin sobrio (.fg-admin).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import AdsetsTable from "@/components/fivegatos/AdsetsTable";
import Breadcrumb from "@/components/fivegatos/Breadcrumb";
import Kpi from "@/components/fivegatos/Kpi";
import MonthSelect from "@/components/fivegatos/MonthSelect";
import StatusBadge from "@/components/fivegatos/StatusBadge";
import { labelMes } from "@/components/fivegatos/labelMes";
import { fmtCop, fmtInt } from "@/lib/fivegatos/constants";
import {
  currentMonthBogota,
  getCampanaDetalle,
  isValidMonth,
  monthOptions,
} from "@/lib/fivegatos/data";

export const metadata = {
  title: "Campaña · 5 Gatos Bucaramanga",
  description: "Adsets de la campaña · Gato Dumas Bucaramanga",
};

export const dynamic = "force-dynamic";

export default async function CampanaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const month =
    sp.month && isValidMonth(sp.month) ? sp.month : currentMonthBogota();

  const result = await getCampanaDetalle(id, month);
  if (!result.ok && result.notFound) notFound();

  return (
    <div className="fg-admin min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Breadcrumb + volver ─────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb
            items={[
              { label: "Todas las campañas", href: `/5gatos?month=${month}` },
              {
                label: result.ok ? result.data.campana.campaign_name : "Campaña",
              },
            ]}
          />
          <Link
            href={`/5gatos?month=${month}`}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            <span aria-hidden>←</span> Volver
          </Link>
        </div>

        {!result.ok ? (
          <div className="mt-16 flex flex-col items-center rounded-[6px] border border-gray-200 bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <span className="text-4xl" aria-hidden>
              ⏳
            </span>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Estamos actualizando los datos
            </h2>
            <p className="mt-2 max-w-md text-base text-gray-500">
              La información de Meta se está sincronizando. Vuelve a intentarlo
              en unos minutos.
            </p>
          </div>
        ) : (
          <main className="mt-6 space-y-8">
            {/* ── Header de la campaña ──────────────────────── */}
            <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-gray-200 pb-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Campaña · {labelMes(month)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-bold tracking-[-0.02em] text-gray-900 sm:text-2xl">
                    {result.data.campana.campaign_name}
                  </h1>
                  <StatusBadge status={result.data.campana.effective_status} />
                </div>
              </div>
              <MonthSelect
                value={month}
                options={monthOptions(12)}
                basePath={`/5gatos/campana/${id}`}
              />
            </header>

            {/* ── Totales del mes ───────────────────────────── */}
            <section
              aria-label="Totales de la campaña"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Kpi
                label="Inversión del mes"
                value={fmtCop(result.data.campana.spend)}
                foot={
                  <span className="tabular-nums">
                    {fmtCop(result.data.campana.spend_lifetime)} desde el inicio
                  </span>
                }
              />
              <Kpi label="Leads del mes" value={fmtInt(result.data.campana.leads)} />
              <Kpi label="CPL" value={fmtCop(result.data.campana.cpl)} />
              <Kpi
                label="Adsets"
                value={fmtInt(result.data.campana.adsetsTotal)}
                foot={`${fmtInt(result.data.campana.adsetsActivos)} activos hoy`}
              />
            </section>

            {/* ── Adsets ────────────────────────────────────── */}
            <section aria-label="Adsets de la campaña">
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                  Adsets
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Un adset por curso o programa. Haz clic en un adset para ver
                  sus anuncios.
                </p>
              </div>
              <AdsetsTable
                rows={result.data.adsets}
                cursos={result.data.cursos}
                month={month}
              />
            </section>

            <footer className="border-t border-gray-200 pb-8 pt-5 text-center text-xs text-gray-400">
              Datos del {result.data.dateStart} al {result.data.dateStop} ·
              Fuente: Meta Ads · Reporte automático de CookMinds
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}
