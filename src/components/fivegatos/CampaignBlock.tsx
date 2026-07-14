"use client";

import { useId, useState } from "react";
import type { AdStats, AdsetConCurso, CampanaActiva } from "@/lib/fivegatos/data";
import type { ModoPresupuesto } from "@/lib/fivegatos/presupuesto";
import { fmtCop, fmtInt, fmtPct } from "@/lib/fivegatos/constants";
import AdCardCompact from "./AdCardCompact";
import FinCursoChip from "./FinCursoChip";
import PresupuestoCard from "./PresupuestoCard";
import StatusBadge from "./StatusBadge";

// ---------------------------------------------------------------------------
// KPIs de la campaña en fila (hairlines verticales entre celdas en md+)
// ---------------------------------------------------------------------------

function KpiInline({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 first:pl-0 md:border-l md:border-gray-200 md:first:border-l-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold text-gray-900 tabular-nums sm:text-lg">
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fila de adset con acordeón (ads lazy: /api/5gatos/ads al primer despliegue)
// ---------------------------------------------------------------------------

const PCT_CLS: Record<string, string> = {
  verde: "text-emerald-700",
  ambar: "text-amber-700",
  rojo: "text-red-700",
  na: "text-gray-400",
};

type AdsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; ads: AdStats[] }
  | { status: "error" };

const ROW_GRID =
  "grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[16px_minmax(0,1fr)_150px_110px_70px_100px]";

function AdsetRow({
  adset,
  month,
  modo,
}: {
  adset: AdsetConCurso;
  month: string;
  modo: ModoPresupuesto;
}) {
  const [open, setOpen] = useState(false);
  const [adsState, setAdsState] = useState<AdsState>({ status: "idle" });
  const panelId = useId();

  async function cargarAds() {
    setAdsState({ status: "loading" });
    try {
      const res = await fetch(
        `/api/5gatos/ads?adset=${adset.adset_id}&month=${month}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: { ads: AdStats[] } = await res.json();
      setAdsState({ status: "done", ads: json.ads ?? [] });
    } catch {
      setAdsState({ status: "error" });
    }
  }

  function toggle() {
    const abrir = !open;
    setOpen(abrir);
    if (abrir && adsState.status === "idle") void cargarAds();
  }

  const p = adset.presupuesto[modo];
  const inversion = modo === "mes" ? adset.spend : adset.spend_lifetime;
  const leads = modo === "mes" ? adset.leads : adset.leads_lifetime;
  const cpl = modo === "mes" ? adset.cpl : adset.cpl_lifetime;
  const pausado = adset.effective_status !== "ACTIVE";

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`${ROW_GRID} w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400`}
      >
        {/* ▶ / ▼ */}
        <span
          aria-hidden
          className={`text-[10px] text-gray-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ▶
        </span>

        {/* Nombre + chips */}
        <span className="min-w-0">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`truncate text-sm font-semibold ${pausado ? "text-gray-500" : "text-gray-900"}`}
              title={adset.adset_name}
            >
              {adset.adset_name}
            </span>
            <FinCursoChip curso={adset.curso} />
            {pausado && (
              <span className="inline-flex shrink-0 items-center rounded-[4px] bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                Pausado
              </span>
            )}
          </span>
          {adset.curso && (
            <span className="mt-0.5 block truncate text-xs text-gray-500">
              {adset.curso.nombre}
            </span>
          )}
        </span>

        {/* Presupuesto (solo md+) */}
        <span className="hidden text-xs text-gray-600 tabular-nums md:block">
          {p.planeado !== null ? (
            <>
              <span className={`font-semibold ${PCT_CLS[p.semaforo]}`}>
                {(p.porcentaje ?? 0).toLocaleString("es-CO", {
                  maximumFractionDigits: 0,
                })}
                %
              </span>{" "}
              de {fmtCop(p.planeado)}
            </>
          ) : (
            <span className="text-gray-400">Sin presupuesto</span>
          )}
        </span>

        {/* Inversión */}
        <span className="text-right text-sm font-semibold text-gray-900 tabular-nums">
          {fmtCop(inversion)}
        </span>

        {/* Leads (md+) */}
        <span className="hidden text-right text-sm text-gray-700 tabular-nums md:block">
          {fmtInt(leads)}
        </span>

        {/* CPL (md+) */}
        <span className="hidden text-right text-sm text-gray-700 tabular-nums md:block">
          {fmtCop(cpl)}
        </span>
      </button>

      {/* Panel del acordeón (animación grid-rows 0fr → 1fr) */}
      <div
        id={panelId}
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
            {adsState.status === "loading" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-[72px] animate-pulse rounded-[6px] bg-gray-200"
                  />
                ))}
              </div>
            )}
            {adsState.status === "error" && (
              <p className="text-sm text-gray-500">
                No pudimos cargar los anuncios.{" "}
                <button
                  type="button"
                  onClick={() => void cargarAds()}
                  className="font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
                >
                  Reintentar
                </button>
              </p>
            )}
            {adsState.status === "done" &&
              (adsState.ads.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Este adset no tiene anuncios registrados.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {adsState.ads.map((ad) => (
                    <AdCardCompact key={ad.ad_id} ad={ad} />
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloque de campaña: header + presupuesto + KPIs + tabla de adsets acordeón
// ---------------------------------------------------------------------------

export default function CampaignBlock({
  campana,
  month,
  modo,
}: {
  campana: CampanaActiva;
  month: string;
  modo: ModoPresupuesto;
}) {
  const c = campana;
  return (
    <section
      aria-label={`Campaña ${c.campaign_name}`}
      className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:p-8"
    >
      {/* ── Header del bloque ─────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-gray-200 pb-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">
            {c.campaign_name}
          </h3>
          <p className="mt-1 text-[13px] text-gray-500">
            {c.objetivo && <>Objetivo: {c.objetivo} · </>}
            Adsets activos: {fmtInt(c.adsetsActivos)}
            {c.adsetsTotal > c.adsetsActivos && (
              <span className="text-gray-400"> de {fmtInt(c.adsetsTotal)}</span>
            )}
          </p>
        </div>
        <StatusBadge status={c.effective_status} />
      </header>

      {/* ── Presupuesto ───────────────────────────────────────── */}
      <div className="mt-5">
        <PresupuestoCard presupuesto={c.presupuesto[modo]} modo={modo} />
      </div>

      {/* ── KPIs de la campaña (fila, siempre del mes) ────────── */}
      <div className="mt-5 grid grid-cols-3 gap-y-4 md:grid-cols-6">
        <KpiInline label="Impresiones" value={fmtInt(c.impressions)} />
        <KpiInline label="Clics" value={fmtInt(c.clicks)} />
        <KpiInline label="CTR" value={fmtPct(c.ctr)} />
        <KpiInline label="CPC" value={fmtCop(c.cpc)} />
        <KpiInline label="Leads" value={fmtInt(c.leads)} />
        <KpiInline label="CPL" value={fmtCop(c.cpl)} />
      </div>

      {/* ── Tabla de adsets (acordeón) ────────────────────────── */}
      <div className="mt-5 overflow-hidden rounded-[6px] border border-gray-200">
        <div
          className={`${ROW_GRID} border-b border-gray-200 bg-gray-50 px-4 py-2.5`}
          aria-hidden
        >
          <span />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Adset
          </span>
          <span className="hidden text-xs font-medium uppercase tracking-wide text-gray-600 md:block">
            Presupuesto
          </span>
          <span className="text-right text-xs font-medium uppercase tracking-wide text-gray-600">
            {modo === "mes" ? "Inversión mes" : "Inversión total"}
          </span>
          <span className="hidden text-right text-xs font-medium uppercase tracking-wide text-gray-600 md:block">
            Leads
          </span>
          <span className="hidden text-right text-xs font-medium uppercase tracking-wide text-gray-600 md:block">
            CPL
          </span>
        </div>
        {c.adsets.map((a) => (
          <AdsetRow key={a.adset_id} adset={a} month={month} modo={modo} />
        ))}
      </div>
    </section>
  );
}
