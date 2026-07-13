/**
 * /5gatos — Dashboard cliente para 5 Gatos (Gato Dumas Bucaramanga).
 * NIVEL ADSET (1 adset = 1 curso/programa): inversión mensual por curso y
 * programa + adsets activos con consumo lifetime desde su inicio real.
 * Server Component: los datos se traen en el servidor (Meta READ-ONLY).
 *
 * Sistema visual: "The Lab" (Brand House 2026) — retícula suiza, hairlines,
 * IBM Plex Sans/Mono + display condensed. Tokens --lab-* en globals.css.
 */

import Image from "next/image";
import ActiveAdsetCard from "@/components/fivegatos/ActiveAdsetCard";
import AlertsPanel from "@/components/fivegatos/AlertsPanel";
import KpiCards from "@/components/fivegatos/KpiCards";
import MonthSelect from "@/components/fivegatos/MonthSelect";
import { labelMes } from "@/components/fivegatos/labelMes";
import SummaryTable from "@/components/fivegatos/SummaryTable";
import { getAlertasProgramacion } from "@/lib/dashboard/programacion-cross";
import { BENCHMARK_CPL, fmtCop } from "@/lib/fivegatos/constants";
import {
  currentMonthBogota,
  getFiveGatosMonth,
  isValidMonth,
  monthOptions,
  type AdsetStats,
} from "@/lib/fivegatos/data";
import { labFontVars } from "@/lib/fivegatos/fonts";
import { getSinClasificarSheetUrl } from "@/lib/mapping/courses";

export const metadata = {
  title: "5 Gatos · Bucaramanga — Pauta digital",
  description: "Inversión mensual por curso y programa · Gato Dumas Bucaramanga",
};

export const dynamic = "force-dynamic";

/**
 * Adapta el shape AdsetStats (viewmodel del dashboard) al shape AdsetActivo
 * que consume el cruce de programación. Ambos tipos convergen en los mismos
 * campos con nombres ligeramente distintos.
 */
function adaptarAdsetsParaCruce(
  adsets: AdsetStats[],
): import("@/lib/dashboard/programacion-cross").AdsetActivo[] {
  return adsets.map((a) => ({
    id: a.adset_id,
    name: a.adset_name,
    campaign_name: a.campaign_name,
    effective_status: a.effective_status,
    spend_lifetime: a.spend_lifetime,
    spend_month: a.spend,
    start_time: a.start_time,
    end_time: a.end_time,
    cpl: a.cpl,
  }));
}

function SectionTitle({
  num,
  children,
  sub,
}: {
  /** Numeración estilo laboratorio, ej. "02 · Cursos". */
  num?: string;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-4">
      {num && (
        <p className="lab-eyebrow text-[10px] text-lab-teal">{num}</p>
      )}
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-lab-ink-strong sm:text-xl">
        {children}
      </h2>
      {sub && <p className="mt-1 text-sm text-lab-muted">{sub}</p>}
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

  // Alertas de programación (cruce con Excel del cliente). Nunca lanza.
  const alertasResult = result.ok
    ? await getAlertasProgramacion(
        adaptarAdsetsParaCruce([
          ...result.data.activos,
          ...result.data.sinClasificar,
        ]),
      )
    : { alertas: [], programacionDisponible: false };

  return (
    <div className={`lab ${labFontVars} min-h-screen`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 border-b border-lab-rule-strong pb-6">
          <div className="flex items-center gap-4">
            <span className="lab-frame inline-flex shrink-0 bg-lab-surface p-1.5">
              <Image
                src="/assets/logo_gato_dumas.png"
                alt="Gato Dumas"
                width={56}
                height={56}
                className="lab-logo h-11 w-11 object-contain sm:h-12 sm:w-12"
                priority
              />
            </span>
            <div>
              <p className="lab-eyebrow text-[10px] tracking-[0.28em] text-lab-muted">
                Instituto Gato Dumas
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <h1 className="lab-display text-4xl leading-none text-lab-ink-strong sm:text-5xl">
                  Cinco Gatos
                </h1>
                <span className="text-base font-medium text-lab-muted">
                  Bucaramanga
                </span>
              </div>
              <p className="mt-1.5 text-sm text-lab-muted">
                Pauta digital · Gato Dumas · {labelMes(month)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthSelect value={month} options={monthOptions(12)} />
            <a
              href={`/api/5gatos/export?month=${month}`}
              className="lab-mono inline-flex items-center gap-2 rounded-sm border border-lab-accent px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-lab-accent transition-colors hover:bg-lab-accent hover:text-lab-bg focus:outline-none focus-visible:ring-1 focus-visible:ring-lab-accent focus-visible:ring-offset-2"
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
          <div className="mt-16 flex flex-col items-center rounded-sm border border-lab-rule bg-lab-surface px-6 py-16 text-center">
            <span className="text-4xl" aria-hidden>
              ⏳
            </span>
            <h2 className="mt-4 text-xl font-semibold text-lab-ink-strong">
              Estamos actualizando los datos
            </h2>
            <p className="mt-2 max-w-md text-base text-lab-muted">
              La información de Meta se está sincronizando. Vuelve a intentarlo
              en unos minutos. Si el problema persiste, escríbele a Juan
              (juandgarcia1224@gmail.com).
            </p>
          </div>
        ) : (
          <main className="mt-8 space-y-12">
            {/* ── Alertas de programación (cruce con Excel del cliente) ── */}
            {alertasResult.programacionDisponible && (
              <AlertsPanel alertas={alertasResult.alertas} />
            )}

            {/* ── KPIs ─────────────────────────────────────── */}
            <section aria-label="Indicadores del mes">
              <p className="lab-eyebrow mb-3 text-[10px] text-lab-teal">
                01 · Indicadores
              </p>
              <KpiCards kpis={result.data.kpis} kpisPrev={result.data.kpisPrev} />
              <p className="lab-mono mt-3 text-right text-[10px] uppercase tracking-wider text-lab-faint">
                Datos del {result.data.dateStart} al {result.data.dateStop} ·
                Fuente: Meta Ads
              </p>
            </section>

            {/* ── Resumen por Curso ────────────────────────── */}
            <section aria-label="Resumen por curso">
              <SectionTitle
                num="02 · Cursos"
                sub="Inversión y resultados de cursos cortos, clases y masterclass (suma de sus adsets)."
              >
                Resumen por Curso
              </SectionTitle>
              <SummaryTable rows={result.data.cursos} firstColLabel="Curso" />
            </section>

            {/* ── Resumen por Programa ─────────────────────── */}
            <section aria-label="Resumen por programa">
              <SectionTitle
                num="03 · Programas"
                sub="Diplomados y programas profesionales."
              >
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
                num="04 · Adsets"
                sub={`Un adset por curso o programa · Semáforo según CPL del mes vs benchmark de ${fmtCop(BENCHMARK_CPL)}.`}
              >
                Adsets activos ahora
              </SectionTitle>
              {result.data.activos.length === 0 ? (
                <p className="rounded-sm border border-dashed border-lab-rule-strong bg-lab-surface px-5 py-8 text-center text-base text-lab-muted">
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
                className="border border-dashed border-lab-rule-strong bg-lab-surface p-5"
              >
                <p className="lab-eyebrow text-[10px] text-lab-ambar">
                  Pendiente de mapeo
                </p>
                <h3 className="mt-1.5 text-sm font-semibold text-lab-ink-strong">
                  {result.data.sinClasificar.length}{" "}
                  {result.data.sinClasificar.length === 1
                    ? "adset sin curso o programa asignado"
                    : "adsets sin curso o programa asignado"}
                </h3>
                <p className="mt-1 text-sm text-lab-muted">
                  Estos adsets aún no están asociados a un curso o programa y
                  no aparecen en los resúmenes de arriba.
                </p>
                <ul className="mt-3 divide-y divide-lab-rule text-sm text-lab-ink">
                  {result.data.sinClasificar.map((a) => (
                    <li
                      key={a.adset_id}
                      className="flex justify-between gap-4 py-2"
                    >
                      <span className="truncate">
                        {a.adset_name}
                        <span className="lab-mono ml-2 text-[10px] uppercase tracking-wider text-lab-faint">
                          {a.campaign_name}
                        </span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {fmtCop(a.spend)}
                      </span>
                    </li>
                  ))}
                </ul>
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-lab-teal underline underline-offset-2 transition-colors hover:text-lab-accent"
                  >
                    Corregir en el Sheet de mapeo →
                  </a>
                )}
              </section>
            )}

            {/* ── Footer ───────────────────────────────────── */}
            <footer className="lab-mono border-t border-lab-rule pt-5 pb-8 text-center text-[10px] uppercase tracking-[0.18em] text-lab-faint">
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
