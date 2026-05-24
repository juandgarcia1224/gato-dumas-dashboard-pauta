"use client";

import Image from "next/image";
import { RefreshCw, Download } from "lucide-react";
import type { HeaderVM, Severity } from "@/lib/dashboard/design-types";

function dotClass(s: Severity): string {
  return s === "ok" ? "" : s === "warn" ? "warn" : s === "crit" ? "crit" : "info";
}

/**
 * TopBar (Cloud Design §2.A). Logo institucional como imagen (no redibujado),
 * marca, meta-pills de estado real y toggles Interno/Cliente + tema.
 */
export default function DashboardHeader({
  header,
  mode,
  theme,
  onModeChange,
  onThemeChange,
  onRefresh,
  refreshing,
}: {
  header: HeaderVM;
  mode: "interno" | "cliente";
  theme: "light" | "dark";
  onModeChange: (m: "interno" | "cliente") => void;
  onThemeChange: (t: "light" | "dark") => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <header className="topbar">
      <div className="brand-mark">
        <Image
          className="logo-img"
          src="/assets/logo_gato_dumas.png"
          alt="Instituto Gato Dumas"
          width={56}
          height={56}
          priority
        />
        <div className="brand-id">
          <div className="lvl-1">{header.subtitle}</div>
          <div className="lvl-2">{header.brandName}</div>
          <div className="eyebrow" style={{ marginTop: 4 }}>
            {header.kicker}
          </div>
        </div>
      </div>

      <div className="topbar-meta">
        <div className="meta-pill">
          <div className="k">Última actualización</div>
          <div className="v">
            <span className={`status-dot ${dotClass(header.lastUpdate.status)}`} />
            <span>{header.lastUpdate.label}</span>
          </div>
        </div>
        <div className="meta-pill">
          <div className="k">Estado de conexión</div>
          <div className="v">
            <span className={`status-dot ${dotClass(header.connection.status)}`} />
            <span>{header.connection.label}</span>
          </div>
        </div>

        <div className="filter-group" style={{ gap: 8 }}>
          <div className="seg" role="radiogroup" aria-label="Modo de vista">
            <button
              className={mode === "interno" ? "active" : ""}
              role="radio"
              aria-checked={mode === "interno"}
              onClick={() => onModeChange("interno")}
            >
              Interno
            </button>
            <button
              className={mode === "cliente" ? "active" : ""}
              role="radio"
              aria-checked={mode === "cliente"}
              onClick={() => onModeChange("cliente")}
            >
              Cliente
            </button>
          </div>
          <button
            className="btn ghost"
            title="Cambiar tema"
            onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "Oscuro" : "Claro"}
          </button>
        </div>

        <button
          className="btn primary"
          onClick={onRefresh}
          disabled={refreshing}
          title="Recarga la vista desde /api/dashboard. La sincronización con Meta se ejecuta por terminal (npm run meta:update)."
        >
          <RefreshCw className={`ico ${refreshing ? "spin" : ""}`} size={14} />
          {refreshing ? "Actualizando…" : "Actualizar datos"}
        </button>
      </div>
    </header>
  );
}
