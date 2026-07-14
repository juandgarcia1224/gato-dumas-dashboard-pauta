/**
 * /5gatos/adset/[id] — NIVEL 3 del drill-down: anuncios individuales del
 * adset con creative (thumbnail, texto, CTA) y métricas del mes, más la
 * tarjeta del curso del Excel del cliente cuando el mapeo matchea.
 * Server Component (Meta READ-ONLY). Look admin sobrio (.fg-admin).
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import AdCard from "@/components/fivegatos/AdCard";
import Breadcrumb from "@/components/fivegatos/Breadcrumb";
import CourseChip from "@/components/fivegatos/CourseChip";
import Kpi from "@/components/fivegatos/Kpi";
import MonthSelect from "@/components/fivegatos/MonthSelect";
import SeveridadPill from "@/components/fivegatos/SeveridadPill";
import StatusBadge from "@/components/fivegatos/StatusBadge";
import { labelMes } from "@/components/fivegatos/labelMes";
import { fmtCop, fmtInt, fmtPct } from "@/lib/fivegatos/constants";
import {
  currentMonthBogota,
  getAdsetDetalle,
  isValidMonth,
  monthOptions,
} from "@/lib/fivegatos/data";

export const metadata = {
  title: "Adset · 5 Gatos Bucaramanga",
  description: "Anuncios del adset · Gato Dumas Bucaramanga",
};

export const dynamic = "force-dynamic";

export default async function AdsetPage({
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

  const result = await getAdsetDetalle(id, month);
  if (!result.ok && result.notFound) notFound();

  return (
    <div className="fg-admin min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Breadcrumb + volver ─────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb
            items={
              result.ok
                ? [
                    { label: "Todas las campañas", href: `/5gatos?month=${month}` },
                    {
                      label: result.data.adset.campaign_name || "Campaña",
                      href: `/5gatos/campana/${result.data.adset.campaign_id}?month=${month}`,
                    },
                    { label: result.data.adset.adset_name },
                  ]
                : [
                    { label: "Todas las campañas", href: `/5gatos?month=${month}` },
                    { label: "Adset" },
                  ]
            }
          />
          <Link
            href={
              result.ok && result.data.adset.campaign_id
                ? `/5gatos/campana/${result.data.adset.campaign_id}?month=${month}`
                : `/5gatos?month=${month}`
            }
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
            {/* ── Header del adset ──────────────────────────── */}
            <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-gray-200 pb-5">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Adset · {labelMes(month)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-bold tracking-[-0.02em] text-gray-900 sm:text-2xl">
                    {result.data.adset.adset_name}
                  </h1>
                  <StatusBadge
                    status={
                      result.data.adset.effective_status ||
                      result.data.adset.status
                    }
                  />
                  <SeveridadPill semaforo={result.data.adset.semaforo} />
                </div>
                {result.data.adset.nombre_normalizado && (
                  <p className="mt-1.5 text-sm text-gray-500">
                    {result.data.adset.tipo} ·{" "}
                    {result.data.adset.nombre_normalizado}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                <MonthSelect
                  value={month}
                  options={monthOptions(12)}
                  basePath={`/5gatos/adset/${id}`}
                />
              </div>
            </header>

            {/* ── Curso del Excel + totales del mes ─────────── */}
            <section
              aria-label="Curso asociado y totales del adset"
              className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            >
              {result.data.curso && (
                <CourseChip curso={result.data.curso} variant="card" />
              )}
              <div
                className={`grid grid-cols-2 gap-4 sm:grid-cols-4 ${
                  result.data.curso ? "lg:col-span-2" : "lg:col-span-3"
                }`}
              >
                <Kpi
                  label="Inversión del mes"
                  value={fmtCop(result.data.adset.spend)}
                  foot={
                    <span className="tabular-nums">
                      {fmtCop(result.data.adset.spend_lifetime)} desde el inicio
                    </span>
                  }
                />
                <Kpi label="Leads" value={fmtInt(result.data.adset.leads)} />
                <Kpi label="CPL" value={fmtCop(result.data.adset.cpl)} />
                <Kpi label="CTR" value={fmtPct(result.data.adset.ctr)} />
              </div>
            </section>

            {/* ── Anuncios ──────────────────────────────────── */}
            <section aria-label="Anuncios del adset">
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-gray-900">
                  Anuncios
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Creatives que corren en este adset, con sus métricas del mes.
                </p>
              </div>
              {result.data.ads.length === 0 ? (
                <p className="rounded-[6px] border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-sm text-gray-500">
                  Este adset no tiene anuncios registrados.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {result.data.ads.map((ad) => (
                    <AdCard key={ad.ad_id} ad={ad} />
                  ))}
                </div>
              )}
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
