"use client";

import { useState } from "react";

/**
 * FilterBar (Bloque 10): Vista (5 ámbitos) + Rango (4 presets + Personalizado).
 * - Vista: filtro real → recarga /api/dashboard?view=.
 * - Rango: recarga con ?range=; si el rango no tiene datos cargados, el botón
 *   queda activo y el dashboard muestra estado claro (no botón muerto).
 * - Personalizado: abre panel con dos fechas + Aplicar / Limpiar (validado).
 * El grupo "Nivel"/técnico se mantiene fuera; aquí Vista reemplaza a Cuenta.
 */

const RANGES: { key: string; label: string }[] = [
  { key: "this_month", label: "Mes actual" },
  { key: "last_7d", label: "Últimos 7 días" },
  { key: "today", label: "Hoy" },
  { key: "custom", label: "Personalizado" },
];

export interface ViewOption {
  key: string;
  label: string;
}

export default function FilterBar({
  views,
  view,
  onViewChange,
  months,
  range,
  dateStart,
  dateStop,
  onRangeChange,
  onApplyCustom,
  onClearCustom,
}: {
  views: ViewOption[];
  view: string;
  onViewChange: (v: string) => void;
  months: { key: string; label: string }[];
  range: string;
  dateStart?: string;
  dateStop?: string;
  onRangeChange: (r: string) => void;
  onApplyCustom: (start: string, stop: string) => void;
  onClearCustom: () => void;
}) {
  const [open, setOpen] = useState(range === "custom");
  const [start, setStart] = useState(dateStart ?? "");
  const [stop, setStop] = useState(dateStop ?? "");
  const [err, setErr] = useState<string | null>(null);

  function clickRange(key: string) {
    if (key === "custom") {
      setOpen((o) => !o);
      onRangeChange("custom");
      return;
    }
    setOpen(false);
    setErr(null);
    onRangeChange(key);
  }

  function apply() {
    if (!start || !stop) {
      setErr("Selecciona fecha de inicio y fin.");
      return;
    }
    if (start > stop) {
      setErr("La fecha de inicio no puede ser posterior a la fin.");
      return;
    }
    setErr(null);
    onApplyCustom(start, stop);
  }

  function clear() {
    setStart("");
    setStop("");
    setErr(null);
    onClearCustom();
  }

  function dotClass(key: string): string {
    if (key === "gato_bucaramanga") return "alt";
    return "";
  }

  return (
    <div className="filter-bar" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 28px", alignItems: "center" }}>
        <div className="filter-group">
          <span className="lbl">Vista</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {views.map((v) => (
              <button
                key={v.key}
                className={"account-chip " + dotClass(v.key) + (view === v.key ? " active" : "")}
                onClick={() => onViewChange(v.key)}
              >
                <span className="dot" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="lbl">Rango</span>
          <div className="seg" role="radiogroup" aria-label="Rango de fechas">
            {RANGES.map((r) => (
              <button
                key={r.key}
                className={range === r.key ? "active" : ""}
                role="radio"
                aria-checked={range === r.key}
                onClick={() => clickRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {months.length > 0 && (
          <div className="filter-group">
            <span className="lbl">Mes</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {months.map((m) => (
                <button
                  key={m.key}
                  className={"account-chip" + (range === m.key ? " active" : "")}
                  onClick={() => {
                    setOpen(false);
                    setErr(null);
                    onRangeChange(m.key);
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="custom-range">
          <div className="date-field">
            <label>Desde</label>
            <input type="date" value={start} max={stop || undefined} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="date-field">
            <label>Hasta</label>
            <input type="date" value={stop} min={start || undefined} onChange={(e) => setStop(e.target.value)} />
          </div>
          <button className="btn primary" onClick={apply}>Aplicar rango</button>
          <button className="btn ghost" onClick={clear}>Limpiar</button>
          {err && <span className="custom-range-err">{err}</span>}
        </div>
      )}
    </div>
  );
}
