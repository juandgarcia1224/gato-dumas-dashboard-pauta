"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardPayload } from "@/lib/dashboard/contract";
import { buildDashboardVM } from "@/lib/dashboard/viewmodel";
import { VIEWS } from "@/lib/dashboard/sede";
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
import UnclassifiedPanel from "./UnclassifiedPanel";
import FooterRule from "./FooterRule";
import { BUILD_VERSION } from "@/lib/version";
import { Clock } from "lucide-react";

type Mode = "interno" | "cliente";
type Theme = "light" | "dark";

export default function DashboardShell() {
  const [view, setView] = useState("consolidado");
  const [range, setRange] = useState(""); // "" = el API elige el rango con datos
  const [dateStart, setDateStart] = useState<string>("");
  const [dateStop, setDateStop] = useState<string>("");
  const [mode, setMode] = useState<Mode>("interno");
  const [theme, setTheme] = useState<Theme>("light");
  const [tab, setTab] = useState("Campañas");
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);
  const synced = useRef(false);

  // Restaurar modo/tema + leer query params (una vez)
  useEffect(() => {
    const m = localStorage.getItem("gd_mode") as Mode | null;
    const t = localStorage.getItem("gd_theme") as Theme | null;
    if (m) setMode(m);
    if (t) setTheme(t);
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("view");
    const r = sp.get("range");
    const ds = sp.get("dateStart");
    const dd = sp.get("dateStop");
    if (v) setView(v);
    if (r) {
      setRange(r);
      synced.current = true; // el usuario/URL fijó el rango: no autoseleccionar
    }
    if (ds) setDateStart(ds);
    if (dd) setDateStop(dd);
    initialized.current = true;
    // Marcador de build para diagnosticar despliegues.
    console.info(`[Gato Dumas] build ${BUILD_VERSION}`);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gd_mode", mode);
    localStorage.setItem("gd_theme", theme);
  }, [mode, theme]);

  // Reflejar filtros en la URL (sin recargar)
  useEffect(() => {
    if (!initialized.current) return;
    const sp = new URLSearchParams();
    sp.set("view", view);
    if (range) sp.set("range", range);
    if (range === "custom" && dateStart && dateStop) {
      sp.set("dateStart", dateStart);
      sp.set("dateStop", dateStop);
    }
    window.history.replaceState(null, "", `?${sp.toString()}`);
  }, [view, range, dateStart, dateStop]);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const sp = new URLSearchParams({ view });
        if (range) sp.set("range", range);
        if (range === "custom" && dateStart && dateStop) {
          sp.set("dateStart", dateStart);
          sp.set("dateStop", dateStop);
        }
        const res = await fetch(`/api/dashboard?${sp.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setPayload((await res.json()) as DashboardPayload);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el dashboard");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [view, range, dateStart, dateStop],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Autoseleccionar el rango realmente cargado (si el usuario no fijó uno),
  // para abrir mostrando los datos en vez de "sin datos para Mes actual".
  useEffect(() => {
    if (!payload || synced.current) return;
    synced.current = true;
    const rk = payload.range.requested.key;
    if (rk && rk !== range) setRange(rk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  const vm = useMemo(() => (payload ? buildDashboardVM(payload) : null), [payload]);
  const scopeLabel = VIEWS.find((v) => v.key === view)?.label ?? "Consolidado";

  function applyCustom(s: string, e: string) {
    setDateStart(s);
    setDateStop(e);
    setRange("custom");
  }
  function clearCustom() {
    setDateStart("");
    setDateStop("");
    setRange("this_month");
  }

  return (
    <div className="app" data-build={BUILD_VERSION}>
      <DashboardHeader
        header={
          vm?.header ?? {
            brandName: "Gato Dumas",
            subtitle: "Centro de Seguimiento Digital",
            kicker: "Pauta digital · Meta Ads",
            lastUpdate: { label: "Cargando…", status: "info", badge: "…" },
            connection: { label: "Cargando…", status: "info" },
          }
        }
        mode={mode}
        theme={theme}
        onModeChange={setMode}
        onThemeChange={setTheme}
        onRefresh={() => load(true)}
        refreshing={refreshing}
      />

      {vm && <StatusBanners banners={vm.banners} />}

      <FilterBar
        views={VIEWS}
        view={view}
        onViewChange={setView}
        months={vm?.availableMonths ?? []}
        range={range || vm?.range.requestedKey || ""}
        dateStart={dateStart}
        dateStop={dateStop}
        onRangeChange={setRange}
        onApplyCustom={applyCustom}
        onClearCustom={clearCustom}
      />

      {loading && !vm ? (
        <LoadingState />
      ) : error && !vm ? (
        <div className="status-banner crit">
          <span className="sb-title">Error de carga:</span> {error}
        </div>
      ) : vm ? (
        !vm.range.available ? (
          <RangeUnavailable
            vm={vm}
            onShowLatest={() => {
              const last = vm.availableMonths[vm.availableMonths.length - 1];
              if (last) {
                setDateStart("");
                setDateStop("");
                setRange(last.key);
              }
            }}
          />
        ) : (
          <>
            <ExecStrip data={vm.exec} mode={mode} />

            <div className="section-heading">
              <span className="h-rule" />
              <h3 className="h-section">Resumen ejecutivo · KPIs</h3>
              <span className="sub">{scopeLabel} · {vm.range.requestedLabel}</span>
              <span
                className={"badge " + (vm.resultsExact ? "ok" : "warn")}
                style={{ marginLeft: "auto" }}
                title={
                  vm.resultsExact
                    ? "Resultados y CPR exactos del rango (range summary)"
                    : "Gasto exacto; resultados/CPR requieren sincronización agregada del rango"
                }
              >
                <span className="dot" />
                {vm.resultsExact ? "Resultados exactos" : "Resultados pendientes de sync"}
              </span>
            </div>
            <KpiGrid items={vm.kpis} />

            <AccountSummary
              accounts={vm.accounts}
              activeAccount={view === "bogota" || view === "barranquilla" ? "gato_colombia" : view}
            />

            <PacingChart pacing={vm.pacing} note={vm.pacingNote} />

            <AlertsPanel alerts={vm.alerts} counts={vm.alertCounts} />

            <div className="internal-only">
              {(view === "consolidado" || view === "gato_colombia") &&
                vm.unclassified.count > 0 && <UnclassifiedPanel data={vm.unclassified} />}
              <div className="section-heading">
                <span className="h-rule" />
                <h3 className="h-section">Análisis por nivel</h3>
                <span className="sub">Vista operativa · campañas, conjuntos y anuncios</span>
              </div>
              <PerformanceTables
                campaigns={vm.campaigns}
                adsets={vm.adsets}
                ads={vm.ads}
                tab={tab}
                onTab={setTab}
              />
            </div>

            <ClientExecutiveSummary data={vm.exec} />
            <FooterRule generatedAt={vm.generatedAt} />
          </>
        )
      ) : null}
    </div>
  );
}

function RangeUnavailable({
  vm,
  onShowLatest,
}: {
  vm: NonNullable<ReturnType<typeof buildDashboardVM>>;
  onShowLatest: () => void;
}) {
  const snapshot = vm.range.snapshotOnly;
  const latest = vm.availableMonths[vm.availableMonths.length - 1];
  return (
    <section className="section">
      <div className="section-body">
        <div className="empty-state">
          <div className="es-icon" style={{ color: "var(--warn)" }}>
            <Clock size={22} />
          </div>
          <p className="es-title">
            {snapshot
              ? "Solo hay un snapshot agregado (sin histórico diario)"
              : `No hay datos para “${vm.range.requestedLabel}”`}
          </p>
          <p className="es-body">
            {snapshot
              ? "Para filtrar por mes/fecha necesitas cargar el histórico diario. Corre el comando desde local:"
              : "No hay datos diarios cargados para este rango. Sincronízalo desde local o elige un mes con datos."}
          </p>
          <pre className="cmd-box">{vm.range.suggestedCommand}</pre>
          {latest && (
            <button className="btn ghost es-action" onClick={onShowLatest}>
              Ver {latest.label}
            </button>
          )}
        </div>
      </div>
    </section>
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
