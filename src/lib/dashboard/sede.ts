/**
 * Inferencia de sede (Bogotá / Barranquilla / Bucaramanga / sin clasificar) y
 * definición de "vistas" del dashboard.
 *
 * Regla dura: NO inventar sede. Si no hay evidencia clara en el nombre (ni
 * override en 08_Campaign_Mapping), la entidad queda "unclassified" y NO se
 * muestra en las vistas Bogotá/Barranquilla, pero SÍ en Consolidado y Gato Colombia.
 */

export type Sede = "bogota" | "barranquilla" | "bucaramanga" | "unclassified" | "ambiguous";

export type ViewKey =
  | "consolidado"
  | "gato_colombia"
  | "bogota"
  | "barranquilla"
  | "gato_bucaramanga";

export interface ViewDef {
  key: ViewKey;
  label: string;
  /** Cuenta base requerida (para chips/colores). */
  accountGroup?: "gato_colombia" | "gato_bucaramanga";
}

export const VIEWS: ViewDef[] = [
  { key: "consolidado", label: "Consolidado" },
  { key: "gato_colombia", label: "Gato Colombia", accountGroup: "gato_colombia" },
  { key: "bogota", label: "Bogotá", accountGroup: "gato_colombia" },
  { key: "barranquilla", label: "Barranquilla", accountGroup: "gato_colombia" },
  { key: "gato_bucaramanga", label: "Gato Bucaramanga", accountGroup: "gato_bucaramanga" },
];

export function isViewKey(v: string): v is ViewKey {
  return VIEWS.some((x) => x.key === v);
}

function normalize(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

/**
 * Infiere la sede de una entidad de Gato Colombia a partir de su nombre.
 * Prioridad: override de mapping > Bucaramanga (por cuenta) > BAQ/Barranquilla >
 * BOG/Bogotá > sin clasificar. Si hay términos de ambas sedes → ambigua.
 */
export function inferSede(params: {
  accountGroup: string;
  names: (string | undefined)[]; // campaign_name, adset_name, ad_name…
  mappingSede?: Sede | "";
}): Sede {
  if (params.mappingSede) return params.mappingSede as Sede;
  if (params.accountGroup === "gato_bucaramanga") return "bucaramanga";

  const text = params.names
    .filter((n): n is string => Boolean(n))
    .map(normalize)
    .join(" | ");
  const tokens = text.split(/[^A-Z0-9]+/);

  const hasBaq = tokens.includes("BAQ") || text.includes("BARRANQUILLA");
  const hasBog = tokens.includes("BOG") || text.includes("BOGOTA");

  if (hasBaq && hasBog) return "ambiguous";
  if (hasBaq) return "barranquilla";
  if (hasBog) return "bogota";
  return "unclassified";
}

/** ¿Una fila (con su sede ya inferida) pertenece a la vista seleccionada? */
export function rowMatchesView(
  accountGroup: string,
  sede: Sede,
  view: ViewKey,
): boolean {
  switch (view) {
    case "consolidado":
      return true;
    case "gato_colombia":
      return accountGroup === "gato_colombia";
    case "gato_bucaramanga":
      return accountGroup === "gato_bucaramanga";
    case "bogota":
      return accountGroup === "gato_colombia" && sede === "bogota";
    case "barranquilla":
      return accountGroup === "gato_colombia" && sede === "barranquilla";
    default:
      return true;
  }
}

export function viewLabel(view: string): string {
  return VIEWS.find((v) => v.key === view)?.label ?? view;
}
