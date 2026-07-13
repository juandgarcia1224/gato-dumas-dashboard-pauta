/**
 * Tipos del sistema de mapeo curso↔ADSET para 5 Gatos (Bucaramanga).
 *
 * Modelo de Juan (agencia): 1 adset = 1 curso o programa. El nombre del
 * adset lleva el nombre del curso; las campañas son solo contenedores
 * (ej. "Conversiones Julio" con 5 adsets adentro, uno por curso).
 *
 * El mapeo vive en el Google Sheet `Mapeo_Cursos_5Gatos_Bucaramanga`
 * (env GOOGLE_SHEET_MAPEO_5GATOS_ID) y lo mantiene Ruzmery.
 */

export type MappingTipo = "Curso" | "Programa";

export interface MappingRule {
  /** Regex (case-insensitive) contra el NOMBRE DEL ADSET. Puede estar vacío si la regla es por id. */
  pattern_regex: string;
  /** Match exacto por adset_id de Meta. Tiene prioridad sobre el regex. */
  adset_id_exacto: string;
  tipo: MappingTipo;
  nombre_normalizado: string;
  activo: boolean;
  notas: string;
  /**
   * TRUE = regla heredada del modelo viejo (regexeaba nombres de CAMPAÑA).
   * No se aplica al matching de adsets hasta que Ruzmery la revise/convierta.
   */
  legacy_campaign: boolean;
}

export interface MappingMatch {
  tipo: MappingTipo;
  nombre_normalizado: string;
}

export interface UnclassifiedAdset {
  adset_id: string;
  adset_name: string;
  campaign_id?: string;
  campaign_name?: string;
  account_id?: string;
  status?: string;
}

/** Nombres de hoja del Sheet de mapeo. */
export const MAPPING_TABS = {
  mapeo: "Mapeo",
  historial: "Historial",
  sinClasificar: "Sin_Clasificar",
  readme: "README",
} as const;

export const MAPPING_HEADERS: Record<string, string[]> = {
  [MAPPING_TABS.mapeo]: [
    "pattern_regex",
    "adset_id_exacto",
    "tipo",
    "nombre_normalizado",
    "activo",
    "notas",
    "legacy_campaign",
  ],
  [MAPPING_TABS.historial]: ["fecha_iso", "accion", "pattern", "nombre", "usuario"],
  [MAPPING_TABS.sinClasificar]: [
    "fecha_iso",
    "adset_id",
    "adset_name",
    "campaign_id",
    "campaign_name",
    "account_id",
    "status",
    "notas",
  ],
};

/**
 * gid de la hoja Sin_Clasificar en el Sheet de mapeo (para abrir el link de
 * la UI directamente en esa pestaña). Si el Sheet se recrea, actualizar aquí
 * o vía env GOOGLE_SHEET_MAPEO_5GATOS_SINCLASIFICAR_GID.
 */
export const SIN_CLASIFICAR_GID =
  process.env.GOOGLE_SHEET_MAPEO_5GATOS_SINCLASIFICAR_GID?.trim() || "1587886523";
