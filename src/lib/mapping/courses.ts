/**
 * Sistema de mapeo curso↔ADSET · 5 Gatos Bucaramanga.
 *
 * Modelo: 1 adset = 1 curso o programa (el nombre del adset lleva el nombre
 * del curso). Las campañas son contenedores y NO se usan para clasificar.
 *
 * Fuente de verdad: Google Sheet `Mapeo_Cursos_5Gatos_Bucaramanga`
 * (env GOOGLE_SHEET_MAPEO_5GATOS_ID), hoja "Mapeo". Lo mantiene Ruzmery.
 * Respaldo: `fallback.json` (si el Sheet no está configurado o no responde).
 *
 * Reglas de matching:
 *   1. Primero `adset_id_exacto` (match literal por id de adset de Meta).
 *   2. Luego cada `pattern_regex` (case-insensitive) contra el ADSET NAME,
 *      en el ORDEN de la hoja, solo filas con activo=TRUE.
 *   3. Filas con legacy_campaign=TRUE son reglas del modelo viejo (nivel
 *      campaña) y se IGNORAN hasta que Ruzmery las revise.
 *   4. Si nada matchea → null (el caller registra en Sin_Clasificar).
 */

import { unstable_cache } from "next/cache";
import { getSheetsClient } from "../sheets/client";
import { arrayToObjects } from "../sheets/schema";
import fallbackJson from "./fallback.json";
import {
  MAPPING_TABS,
  SIN_CLASIFICAR_GID,
  type MappingMatch,
  type MappingRule,
  type MappingTipo,
  type UnclassifiedAdset,
} from "./types";

const MAPPING_CACHE_SECONDS = 15 * 60; // 15 minutos

function getMappingSheetId(): string | null {
  const v = process.env.GOOGLE_SHEET_MAPEO_5GATOS_ID;
  return v && v.trim().length > 0 ? v.trim() : null;
}

function parseBool(v: string): boolean {
  return /^(true|verdadero|sí|si|1|x)$/i.test(v.trim());
}

function normalizeTipo(v: string): MappingTipo {
  return /^programa/i.test(v.trim()) ? "Programa" : "Curso";
}

export function getFallbackRules(): MappingRule[] {
  return (fallbackJson.rules as MappingRule[]).map((r) => ({ ...r }));
}

/** Lee la hoja "Mapeo" del Sheet y la convierte en reglas tipadas. */
async function fetchMappingFromSheet(): Promise<MappingRule[]> {
  const sheetId = getMappingSheetId();
  if (!sheetId) return getFallbackRules();
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${MAPPING_TABS.mapeo}!A1:G`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const rows = arrayToObjects((res.data.values ?? []) as unknown[][]);
    const rules: MappingRule[] = rows
      .filter(
        (r) =>
          (r.pattern_regex ?? "") !== "" ||
          (r.adset_id_exacto ?? r.campaign_id_exacto ?? "") !== "",
      )
      .map((r) => ({
        pattern_regex: String(r.pattern_regex ?? "").trim(),
        // Compat: si la hoja aún tiene el header viejo `campaign_id_exacto`,
        // lo leemos igual (pero esas filas deberían venir con legacy_campaign=TRUE).
        adset_id_exacto: String(r.adset_id_exacto ?? r.campaign_id_exacto ?? "").trim(),
        tipo: normalizeTipo(String(r.tipo ?? "Curso")),
        nombre_normalizado: String(r.nombre_normalizado ?? "").trim(),
        activo: parseBool(String(r.activo ?? "")),
        notas: String(r.notas ?? ""),
        legacy_campaign: parseBool(String(r.legacy_campaign ?? "")),
      }));
    // Si la hoja existe pero no tiene NINGUNA regla vigente (no-legacy),
    // usar respaldo para no dejar el dashboard sin clasificación.
    const vigentes = rules.filter((r) => !r.legacy_campaign);
    return vigentes.length > 0 ? rules : [...rules, ...getFallbackRules()];
  } catch (err) {
    console.error(
      "[mapping] No se pudo leer el Sheet de mapeo; usando fallback.json:",
      err instanceof Error ? err.message : err,
    );
    return getFallbackRules();
  }
}

const loadMappingCached = unstable_cache(
  async () => fetchMappingFromSheet(),
  ["5gatos-mapping-rules-adset"],
  { revalidate: MAPPING_CACHE_SECONDS, tags: ["5gatos-mapping"] },
);

/** Carga el mapeo (cacheado 15 min con unstable_cache de Next). */
export async function loadMapping(): Promise<MappingRule[]> {
  try {
    return await loadMappingCached();
  } catch {
    // Fuera del runtime de Next (scripts/tests) unstable_cache puede fallar:
    // caemos a la lectura directa.
    return fetchMappingFromSheet();
  }
}

/**
 * Motor puro de matching (testeable sin red): prueba adset_id exacto primero
 * y luego cada regex activo en orden. Ignora reglas legacy_campaign.
 */
export function matchAdsetAgainstRules(
  rules: MappingRule[],
  adsetName: string,
  adsetId: string,
): MappingMatch | null {
  // 1) id exacto (gana siempre sobre los regex)
  for (const r of rules) {
    if (!r.activo || r.legacy_campaign) continue;
    if (r.adset_id_exacto && r.adset_id_exacto === adsetId) {
      return { tipo: r.tipo, nombre_normalizado: r.nombre_normalizado };
    }
  }
  // 2) regex en orden (sobre adset_name)
  for (const r of rules) {
    if (!r.activo || r.legacy_campaign || !r.pattern_regex) continue;
    let re: RegExp;
    try {
      re = new RegExp(r.pattern_regex, "i");
    } catch {
      console.error(`[mapping] Regex inválido en Sheet, se omite: ${r.pattern_regex}`);
      continue;
    }
    if (re.test(adsetName)) {
      return { tipo: r.tipo, nombre_normalizado: r.nombre_normalizado };
    }
  }
  return null;
}

/**
 * Match de un adset contra el mapeo vigente.
 * `rulesOverride` permite inyectar reglas (tests / batch ya cargado).
 */
export async function matchAdset(
  adsetName: string,
  adsetId: string,
  rulesOverride?: MappingRule[],
): Promise<MappingMatch | null> {
  const rules = rulesOverride ?? (await loadMapping());
  return matchAdsetAgainstRules(rules, adsetName, adsetId);
}

// ---------------------------------------------------------------------------
// Sin_Clasificar — registro con throttle (máx. 1 vez al día por adset)
// ---------------------------------------------------------------------------

/** Throttle en memoria por instancia: adset_id → YYYY-MM-DD registrado. */
const unclassifiedSeen = new Map<string, string>();

function todayIsoBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
  }).format(new Date()); // YYYY-MM-DD
}

/**
 * Registra un adset sin clasificar en la hoja `Sin_Clasificar` del Sheet
 * de mapeo, para que Ruzmery lo corrija. Throttle: el mismo adset no se
 * escribe más de 1 vez por día (memoria de instancia + verificación en hoja).
 * Nunca lanza: el dashboard no debe caerse por esto.
 */
export async function recordUnclassified(
  adset: UnclassifiedAdset,
): Promise<boolean> {
  const sheetId = getMappingSheetId();
  if (!sheetId || !adset.adset_id) return false;

  const today = todayIsoBogota();
  if (unclassifiedSeen.get(adset.adset_id) === today) return false;

  try {
    const sheets = getSheetsClient();

    // Verificación contra la hoja (cubre instancias serverless frías):
    // ¿ya hay una fila de hoy para este adset? (A=fecha_iso, B=adset_id)
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${MAPPING_TABS.sinClasificar}!A2:B`,
    });
    const already = (existing.data.values ?? []).some(
      (row) =>
        String(row[0] ?? "").slice(0, 10) === today &&
        String(row[1] ?? "") === adset.adset_id,
    );
    if (already) {
      unclassifiedSeen.set(adset.adset_id, today);
      return false;
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${MAPPING_TABS.sinClasificar}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            adset.adset_id,
            adset.adset_name,
            adset.campaign_id ?? "",
            adset.campaign_name ?? "",
            adset.account_id ?? "",
            adset.status ?? "",
            "Auto-registrado desde el dashboard. Agregar patrón o adset_id en la hoja Mapeo.",
          ],
        ],
      },
    });
    unclassifiedSeen.set(adset.adset_id, today);
    return true;
  } catch (err) {
    console.error(
      "[mapping] No se pudo registrar adset sin clasificar:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

/** URL del Sheet de mapeo (para el link "corregir en Sheet" de la UI). */
export function getMappingSheetUrl(): string | null {
  const id = getMappingSheetId();
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
}

/** URL del Sheet abierto directamente en la hoja Sin_Clasificar. */
export function getSinClasificarSheetUrl(): string | null {
  const id = getMappingSheetId();
  return id
    ? `https://docs.google.com/spreadsheets/d/${id}/edit#gid=${SIN_CLASIFICAR_GID}`
    : null;
}
