"use client";

/**
 * FilterBar (Cloud Design §2.B).
 * - Rango: refleja el rango YA cargado (se fija al sincronizar por terminal con
 *   `meta:update`); las otras opciones se muestran deshabilitadas para no
 *   sugerir datos que no existen.
 * - Cuenta: filtro real → recarga /api/dashboard?account=.
 * - Nivel: controla la tabla activa. El grupo lleva clase `level` → oculto en
 *   modo cliente vía CSS.
 */

const RANGE_OPTIONS: { id: string; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "last_7d", label: "Últimos 7 días" },
  { id: "this_month", label: "Mes actual" },
  { id: "custom", label: "Personalizado" },
];

function normalizeRange(loaded: string): string {
  if (loaded === "today") return "today";
  if (loaded === "last_7d") return "last_7d";
  if (loaded === "this_month") return "this_month";
  if (loaded && loaded.includes("..")) return "custom";
  return "";
}

export interface AccountOption {
  key: string;
  label: string;
  configured: boolean;
  alt?: boolean;
}

const LEVELS = ["Campañas", "Conjuntos", "Anuncios"] as const;

export default function FilterBar({
  loadedRange,
  account,
  accounts,
  onAccountChange,
  level,
  onLevelChange,
}: {
  loadedRange: string;
  account: string;
  accounts: AccountOption[];
  onAccountChange: (a: string) => void;
  level: string;
  onLevelChange: (l: string) => void;
}) {
  const activeRange = normalizeRange(loadedRange);
  const chips: AccountOption[] = [
    { key: "all", label: "Consolidado", configured: true },
    ...accounts,
  ];

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="lbl">Rango</span>
        <div className="seg" role="radiogroup" aria-label="Rango de fechas">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.id}
              className={activeRange === r.id ? "active" : ""}
              disabled={activeRange !== r.id}
              title={
                activeRange === r.id
                  ? "Rango cargado actualmente"
                  : "El rango se define al sincronizar (npm run meta:update)"
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="lbl">Cuenta</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {chips.map((a) => (
            <button
              key={a.key}
              className={
                "account-chip " +
                (a.alt ? "alt " : "") +
                (account === a.key ? "active" : "")
              }
              disabled={!a.configured && a.key !== "all"}
              onClick={() => onAccountChange(a.key)}
              title={
                !a.configured && a.key !== "all"
                  ? "Cuenta no configurada"
                  : undefined
              }
            >
              <span className="dot" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group level">
        <span className="lbl">Nivel</span>
        <div className="seg" role="radiogroup" aria-label="Nivel de análisis">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={level === l ? "active" : ""}
              role="radio"
              aria-checked={level === l}
              onClick={() => onLevelChange(l)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
