"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardPayload } from "@/lib/dashboard/contract";
import DashboardHeader from "./DashboardHeader";
import AccountSelector from "./AccountSelector";
import KpiCards from "./KpiCards";
import LastUpdateCard from "./LastUpdateCard";
import AccountSummaryTable from "./AccountSummaryTable";
import PacingChart from "./PacingChart";
import AlertsPanel from "./AlertsPanel";
import CampaignTable from "./CampaignTable";
import AdsetTable from "./AdsetTable";
import AdsTable from "./AdsTable";

type TableTab = "campaigns" | "adsets" | "ads";

/**
 * Orquestador del dashboard (Fase 1, vista interna).
 * Estructura preparada para separar /internal y /client: el prop `view`
 * permitirá ocultar/secciones técnicas en la futura vista cliente.
 *
 * DISEÑO PROVISIONAL — Cloud Design reemplazará el layout sobre este contrato.
 */
export default function DashboardShell({
  view = "internal",
}: {
  view?: "internal" | "client";
}) {
  const [account, setAccount] = useState("all");
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TableTab>("campaigns");

  const load = useCallback(async (acct: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?account=${acct}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as DashboardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(account);
  }, [account, load]);

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
      <DashboardHeader
        clientName={data?.client.name ?? "Gato Dumas"}
        onRefresh={() => load(account)}
        loading={loading}
      />

      {view === "internal" && (
        <p className="text-xs text-gray-400">
          Vista interna · Fase 1 (Meta Ads). TikTok pendiente (Fase 2).
        </p>
      )}

      <AccountSelector
        accounts={data?.status.accounts ?? []}
        value={account}
        onChange={setAccount}
      />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500">
          Cargando…
        </div>
      ) : data ? (
        <>
          <KpiCards kpis={data.total} />

          <div className="grid gap-4 lg:grid-cols-3">
            <LastUpdateCard lastUpdate={data.lastUpdate} />
            <div className="lg:col-span-2">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">
                Resumen por cuenta
              </h2>
              <AccountSummaryTable accounts={data.accounts} />
            </div>
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              Pacing de gasto
            </h2>
            <PacingChart pacing={data.pacing} />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              Alertas
            </h2>
            <AlertsPanel alerts={data.alerts} notices={data.status.notices} />
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <TabButton active={tab === "campaigns"} onClick={() => setTab("campaigns")}>
                Campañas ({data.campaigns.length})
              </TabButton>
              <TabButton active={tab === "adsets"} onClick={() => setTab("adsets")}>
                Conjuntos ({data.adsets.length})
              </TabButton>
              <TabButton active={tab === "ads"} onClick={() => setTab("ads")}>
                Anuncios ({data.ads.length})
              </TabButton>
            </div>
            {tab === "campaigns" && <CampaignTable rows={data.campaigns} />}
            {tab === "adsets" && <AdsetTable rows={data.adsets} />}
            {tab === "ads" && <AdsTable rows={data.ads} />}
          </section>

          <footer className="pt-4 text-center text-xs text-gray-400">
            Generado {new Date(data.generatedAt).toLocaleString("es-CO")} ·
            Diseño base provisional — pendiente handoff de Cloud Design
          </footer>
        </>
      ) : null}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-md px-3 py-1.5 text-sm font-medium",
        active
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
