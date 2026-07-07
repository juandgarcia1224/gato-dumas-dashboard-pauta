/**
 * Tipos del sistema de mapeo curso↔campaña para 5 Gatos (Bucaramanga).
 * El mapeo vive en el Google Sheet `Mapeo_Cursos_5Gatos_Bucaramanga`
 * (env GOOGLE_SHEET_MAPEO_5GATOS_ID) y lo mantiene Ruzmery.
 */

export type MappingTipo = "Curso" | "Programa";

export interface MappingRule {
  /** Regex (case-insensitive) contra el nombre de campaña. Puede estar vacío si la regla es por id. */
  pattern_regex: string;
  /** Match exacto por campaign_id de Meta. Tiene prioridad sobre el regex. */
  campaign_id_exacto: string;
  tipo: MappingTipo;
  nombre_normalizado: string;
  activo: boolean;
  notas: string;
}

export interface MappingMatch {
  tipo: MappingTipo;
  nombre_normalizado: string;
}

export interface UnclassifiedCampaign {
  campaign_id: string;
  campaign_name: string;
  account_id?: string;
  status?: string;
}

/** Nombres de hoja del Sheet de mapeo. */
export const MAPPING_TABS = {
  mapeo: "Mapeo",
  historial: "Historial",
  sinClasificar: "Sin_Clasificar",
} as const;

export const MAPPING_HEADERS: Record<string, string[]> = {
  [MAPPING_TABS.mapeo]: [
    "pattern_regex",
    "campaign_id_exacto",
    "tipo",
    "nombre_normalizado",
    "activo",
    "notas",
  ],
  [MAPPING_TABS.historial]: ["fecha_iso", "accion", "pattern", "nombre", "usuario"],
  [MAPPING_TABS.sinClasificar]: [
    "fecha_iso",
    "campaign_id",
    "campaign_name",
    "account_id",
    "status",
    "notas",
  ],
};
