"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardPayload } from "@/lib/dashboard/contract";
import { buildDashboardVM } from "@/lib/dashboard/viewmodel";
import DashboardHeader from "./DashboardHeader";
import StatusBanners from "./StatusBanners";
import FilterBar from "./FilterBar";
import ExecStrip from "./ExecStrip";
import KpiGrid from "./KpiGrid";
import AccountSummary from "./AccountSummary";
import PacingChart from "./PacingChart";
import AlertsPanel from "./AlertsPanel";
import PerformanceTables from "./PerformanceTables";
import ClientExecutiveSummary from "./ClientExecutiveSummary";
import FooterRule from "./FooterRule";

type Mode = "interno" | "cliente";
type Theme = "light" | "dark";

/**
 * Orquestador (Cloud Design). Fuente de datos REAL: GET /api/dashboard.
 * NO usa data.js / mock. El modo/tema se aplican en <html data-*> (CSS maneja
 * la visibilidad por modo, no el JSX).
 */
export default function DashboardShell() {
  const [account, setAccount] = useState("all");
  const [mode, setMode] = useState<Mode>("interno");
  const [theme, setTheme] = useState<Theme>("light");
  const [level, setLevel] = useState("Campañas");
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restaurar preferencias de vista
  useEffect(() => {
    const m = localStorage.getItem("gd_mode") as Mode | null;
    const t = localStorage.getItem("gd_theme") as Theme | null;
    if (m) setMode(m);
    if (t) setTheme(t);
  }, []);

  // Aplicar data-* en <html> (Cloud Design: visibilidad por CSS)
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gd_mode", mode);
    localStorage.setItem("gd_theme", theme);
  }, [mode, theme]);

  const load = useCallback(async (acct: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?account=${acct}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPayload((await res.json()) as DashboardPayload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(account);
  }, [account, load]);

  const vm = useMemo(() => (payload ? buildDashboardVM(payload) : null), [payload]);

  const accountOptions = useMemo(
    () =>
      (payload?.status.accounts ?? []).map((a) => ({
        key: a.key,
        label: a.label,
        configured: a.configured,
        alt: a.key === "gato_bucaramanga",
      })),
    [payload],
  );

  const loadedRange = payload?.lastUpdate?.date_preset_or_range ?? "";

  const scopeLabel =
    account === "gato_colombia"
      ? "Gato Colombia · Bogotá + Barranquilla"
      : account === "gato_bucaramanga"
        ? "Gato Bucaramanga · Cinco Gatos"
        : "Consolidado · Gato Colombia + Gato Bucaramanga";

  return (
    <div className="app">
      <DashboardHeader
        header={
          vm?.header ?? {
            brandName: "Gato Dumas",
            subtitle: "Centro de Seguimiento Digital",
            kicker: "Pauta digital · Meta Ads",
            lastUpdate: { label: "Cargando…", status: "info" },
            connection: { label: "Cargando…", status: "info" },
          }
        }
        mode={mode}
        theme={theme}
        onModeChange={setMode}
        onThemeChange={setTheme}
        onRefresh={() => load(account, true)}
        refreshing={refreshing}
      />

      {vm && <StatusBanners banners={vm.banners} />}

      <FilterBar
        loadedRange={loadedRange}
        account={account}
        accounts={accountOptions}
        onAccountChange={setAccount}
        level={level}
        onLevelChange={setLevel}
      />

      {loading && !vm ? (
        <LoadingState />
      ) : error && !vm ? (
        <div className="status-banner crit">
          <span className="sb-title">Error de carga:</span> {error}
        </div>
      ) : vm ? (
        <>
          <ExecStrip data={vm.exec} mode={mode} />

          <div className="section-heading">
            <span className="h-rule" />
            <h3 className="h-section">Resumen ejecutivo · KPIs</h3>
            <span className="sub">{scopeLabel}</span>
          </div>
          <KpiGrid items={vm.kpis} />

          <AccountSummary accounts={vm.accounts} activeAccount={account} />

          <PacingChart pacing={vm.pacing} />

          <AlertsPanel alerts={vm.alerts} counts={vm.alertCounts} />

          <div className="internal-only">
            <div className="section-heading">
              <span className="h-rule" />
              <h3 className="h-section">Análisis por nivel</h3>
              <span className="sub">Vista operativa · campañas, conjuntos y anuncios</span>
            </div>
            <PerformanceTables
              campaigns={vm.campaigns}
              adsets={vm.adsets}
              ads={vm.ads}
              tab={level}
              onTab={setLevel}
            />
          </div>

          <ClientExecutiveSummary data={vm.exec} />

          <FooterRule generatedAt={vm.generatedAt} />
        </>
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div aria-busy="true">
      <div className="row cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="kpi" key={i}>
            <div className="skeleton" style={{ height: 12, width: "70%" }} />
            <div className="skeleton" style={{ height: 28, width: "50%", marginTop: 12 }} />
            <div className="skeleton" style={{ height: 10, width: "40%", marginTop: 12 }} />
          </div>
        ))}
      </div>
      <div className="section">
        <div className="section-body">
          <div className="skeleton" style={{ height: 200, width: "100%" }} />
        </div>
      </div>
    </div>
  );
}
