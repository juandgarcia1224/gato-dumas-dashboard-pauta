/**
 * /5gatos — Dashboard cliente para 5 Gatos (Gato Dumas Bucaramanga). v2.
 *
 * UNA sola página: solo campañas ACTIVAS, cada una como su propio bloque
 * con presupuesto planeado vs consumido, KPIs y acordeón de adsets → ads
 * (sin rutas de drill-down por URL). La fecha de fin del curso del Excel
 * del cliente aparece como chip al lado de cada adset.
 *
 * Server Component: los datos se traen en el servidor (Meta READ-ONLY).
 * Sistema visual: dashboard admin sobrio (.fg-admin en globals.css).
 */

import Image from "next/image";
import CampaignsView from "@/components/fivegatos/CampaignsView";
import CoursesView from "@/components/fivegatos/CoursesView";
import KpiCards from "@/components/fivegatos/KpiCards";
import MonthSelect from "@/components/fivegatos/MonthSelect";
import { labelMes } from "@/components/fivegatos/labelMes";
import {
  currentMonthBogota,
  getCampanasActivas,
  isValidMonth,
  monthOptions,
} from "@/lib/fivegatos/data";
import { getSinClasificarSheetUrl } from "@/lib/mapping/courses";

export const metadata = {
  title: "5 Gatos · Bucaramanga — Pauta digital",
  description: "Presupuesto e inversión por campaña · Gato Dumas Bucaramanga",
};

export const dynamic = "force-dynamic";

export default async function FiveGatosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month =
    params.month && isValidMonth(params.month)
      ? params.month
      : currentMonthBogota();

  const result = await getCampanasActivas(month);
  const sheetUrl = getSinClasificarSheetUrl();

  return (
    <div className="fg-admin min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3.5">
            <Image
              src="/assets/logo_gato_dumas.png"
              alt="Gato Dumas"
              width={40}
              height={40}
              className="h-10 w-10 rounded-[8px] object-contain"
              priority
            />
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.02em] text-gray-900 sm:text-[28px] sm:leading-tight">
                Cinco Gatos
              </h1>
              <p className="text-[13px] text-gray-500">
                Bucaramanga · {labelMes(month)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthSelect value={month} options={monthOptions(12)} />
            <a
              href={`/api/5gatos/export?month=${month}`}
              className="inline-flex items-center gap-2 rounded-[6px] bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descargar Excel
            </a>
          </div>
        </header>

        {!result.ok ? (
          /* ── Estado de error amable (nunca stack traces) ──── */
          <div className="mt-16 flex flex-col items-center rounded-[8px] border border-gray-200 bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <span className="text-4xl" aria-hidden>
              ⏳
            </span>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Estamos actualizando los datos
            </h2>
            <p className="mt-2 max-w-md text-base text-gray-500">
              La información de Meta se está sincronizando. Vuelve a intentarlo
              en unos minutos. Si el problema persiste, escríbele a Juan
              (juandgarcia1224@gmail.com).
            </p>
          </div>
        ) : (
          <main className="mt-8 space-y-10">
            {/* ── KPIs globales del mes ─────────────────────── */}
            <section aria-label="Indicadores del mes">
              <KpiCards
                kpis={result.data.kpis}
                kpisPrev={result.data.kpisPrev}
                presupuesto={result.data.presupuestoMes}
              />
              <p className="mt-3 text-right text-xs text-gray-400 tabular-nums">
                Datos del {result.data.dateStart} al {result.data.dateStop} ·
                Fuente: Meta Ads
              </p>
            </section>

            {/* ── Campañas activas (bloques con acordeón) ───── */}
            <CampaignsView
              activas={result.data.activas}
              pausadas={result.data.pausadas}
              month={month}
            />

            {/* ── Desglose por Curso / Programa ─────────────── */}
            <CoursesView activas={result.data.activas} />

            {/* ── Sin clasificar (línea discreta) ───────────── */}
            {result.data.sinClasificar.length > 0 && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                <span aria-hidden>⚠️</span>
                <span>
                  {result.data.sinClasificar.length}{" "}
                  {result.data.sinClasificar.length === 1
                    ? "adset sin curso asignado"
                    : "adsets sin curso asignado"}
                </span>
                {sheetUrl && (
                  <>
                    <span className="text-gray-300" aria-hidden>
                      ·
                    </span>
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
                    >
                      Corregir en Sheet →
                    </a>
                  </>
                )}
              </p>
            )}

            {/* ── Footer ────────────────────────────────────── */}
            <footer className="border-t border-gray-200 pb-8 pt-5 text-center text-xs text-gray-400">
              Actualizado{" "}
              {new Date(result.data.updatedAt).toLocaleString("es-CO", {
                timeZone: "America/Bogota",
                dateStyle: "long",
                timeStyle: "short",
              })}{" "}
              · Instituto Gato Dumas Bucaramanga · Reporte automático de
              CookMinds
            </footer>
          </main>
        )}
      </div>
    </div>
  );
}
