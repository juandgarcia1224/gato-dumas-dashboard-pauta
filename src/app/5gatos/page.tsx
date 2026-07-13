/**
 * /5gatos — Dashboard cliente para 5 Gatos (Gato Dumas Bucaramanga).
 * NIVEL ADSET (1 adset = 1 curso/programa): inversión mensual por curso y
 * programa + adsets activos con consumo lifetime desde su inicio real.
 * Server Component: los datos se traen en el servidor (Meta READ-ONLY).
 */

import Image from "next/image";
import ActiveAdsetCard from "@/components/fivegatos/ActiveAdsetCard";
import KpiCards from "@/components/fivegatos/KpiCards";
import MonthSelect from "@/components/fivegatos/MonthSelect";
import { labelMes } from "@/components/fivegatos/labelMes";
import SummaryTable from "@/components/fivegatos/SummaryTable";
import { BENCHMARK_CPL, fmtCop } from "@/lib/fivegatos/constants";
import {
  currentMonthBogota,
  getFiveGatosMonth,
  isValidMonth,
  monthOptions,
} from "@/lib/fivegatos/data";
import { getSinClasificarSheetUrl } from "@/lib/mapping/courses";

export const metadata = {
  title: "5 Gatos · Bucaramanga — Pauta digital",
  description: "Inversión mensual por curso y programa · Gato Dumas Bucaramanga",
};

export const dynamic = "force-dynamic";

function SectionTitle({
  children,
  sub,
}: {
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
        {children}
      </h2>
      {sub && <p className="mt-1 text-sm text-neutral-500">{sub}</p>}
    </div>
  );
}

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

  const result = await getFiveGatosMonth(month);
  const sheetUrl = getSinClasificarSheetUrl();

  return (
    <div className="min-h-screen bg-[#f6f4f0] font-sans text-neutral-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-neutral-900/90 pb-5">
          <div className="flex items-center gap-4">
            <Image
              src="/assets/logo_gato_dumas.png"
              alt="Gato Dumas"
              width={56}
              height={56}
              className="h-12 w-12 rounded-full object-contain sm:h-14 sm:w-14"
              priority
            />
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                5 Gatos <span className="text-[#B8232A]">·</span> Bucaramanga
              </h1>
              <p className="text-sm text-neutral-500">
                Pauta digital · Gato Dumas · {labelMes(month)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelect value={month} options={monthOptions(12)} />
            <a
              href={`/api/5gatos/export?month=${month}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#B8232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9c1d23] focus:outline-none focus:ring-2 focus:ring-[#B8232A]/40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
          <div className="mt-16 flex flex-col items-center rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
            <span className="text-4xl" aria-hidden>
              ⏳
            </span>
            <h2 className="mt-4 text-xl font-bold">
              Estamos actualizando los datos
            </h2>
            <p className="mt-2 max-w-md text-base text-neutral-500">
              La información de Meta se está sincronizando. Vuelve a intentarlo
              en unos minutos. Si el problema persiste, escríbele a Juan
              (juandgarcia1224@gmail.com).
            </p>
          </div>
        ) : (
          <main className="mt-8 space-y-12">
            {/* ── KPIs ─────────────────────────────────────── */}
            <section aria-label="Indicadores del mes">
              <KpiCards kpis={result.data.kpis} kpisPrev={result.data.kpisPrev} />
              <p className="mt-3 text-right text-xs text-neutral-400">
                Datos del {result.data.dateStart} al {result.data.dateStop} ·
                Fuente: Meta Ads
              </p>
            </section>

            {/* ── Resumen por Curso ────────────────────────── */}
            <section aria-label="Resumen por curso">
              <SectionTitle sub="Inversión y resultados de cursos cortos, clases y masterclass (suma de sus adsets).">
                Resumen por Curso
              </SectionTitle>
              <SummaryTable rows={result.data.cursos} firstColLabel="Curso" />
            </section>

            {/* ── Resumen por Programa ─────────────────────── */}
            <section aria-label="Resumen por programa">
              <SectionTitle sub="Diplomados y programas profesionales.">
                Resumen por Programa
              </SectionTitle>
              <SummaryTable
                rows={result.data.programas}
                firstColLabel="Programa"
              />
            </section>

            {/* ── Adsets activos ───────────────────────────── */}
            <section aria-label="Adsets activos">
              <SectionTitle
                sub={`Un adset por curso o programa · Semáforo según CPL del mes vs benchmark de ${fmtCop(BENCHMARK_CPL)}.`}
              >
                Adsets activos ahora
              </SectionTitle>
              {result.data.activos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 bg-white/60 px-5 py-8 text-center text-base text-neutral-500">
                  No hay adsets activos en este momento.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {result.data.activos.map((a) => (
                    <ActiveAdsetCard key={a.adset_id} a={a} />
                  ))}
                </div>
              )}
            </section>

            {/* ── Sin clasificar (discreto) ────────────────── */}
            {result.data.sinClasificar.length > 0 && (
              <section
                aria-label="Adsets sin clasificar"
                className="rounded-xl border border-amber-200 bg-amber-50/60 p-5"
              >
                <h3 className="text-sm font-bold text-amber-900">
                  {result.data.sinClasificar.length}{" "}
                  {result.data.sinClasificar.length === 1
                    ? "adset sin curso o programa asignado"
                    : "adsets sin curso o programa asignado"}
                </h3>
                <p className="mt-1 text-sm text-amber-800/80">
                  Estos adsets aún no están asociados a un curso o programa y
                  no aparecen en los resúmenes de arriba.
                </p>
                <ul className="mt-3 space-y-1 text-sm text-amber-900">
                  {result.data.sinClasificar.map((a) => (
                    <li key={a.adset_id} className="flex justify-between gap-4">
                      <span className="truncate">
                        {a.adset_name}
                        <span className="ml-2 text-xs text-amber-700/70">
                          {a.campaign_name}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">{fmtCop(a.spend)}</span>
                    </li>
                  ))}
                </ul>
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-amber-900 underline underline-offset-2 hover:text-[#B8232A]"
                  >
                    Corregir en el Sheet de mapeo →
                  </a>
                )}
              </section>
            )}

            {/* ── Footer ───────────────────────────────────── */}
            <footer className="border-t border-neutral-200 pt-5 pb-8 text-center text-xs text-neutral-400">
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
