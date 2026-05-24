/**
 * Escritura en Google Sheets.
 *
 * Estrategia de datos:
 * - Hojas RAW (campaigns/adsets/ads), pacing y alerts: se SOBRESCRIBEN en cada
 *   corrida con el resultado del rango consultado (evita duplicados).
 * - 07_Update_Log: se AÑADE (es histórico de corridas).
 * - 00_Config / 01_MediaPlan: solo se crean con headers; el contenido lo
 *   gestiona el equipo manualmente. No se sobrescriben datos.
 */

import { getSheetId, getSheetsClient } from "./client";
import {
  HEADERS,
  rowToArray,
  SHEET_TABS,
  type SheetTab,
} from "./schema";

async function listTabs(): Promise<Set<string>> {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: getSheetId() });
  const titles = (meta.data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));
  return new Set(titles);
}

/** Crea las hojas faltantes y garantiza que la fila de headers exista. */
export async function ensureTabs(): Promise<{
  created: string[];
  existing: string[];
}> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();
  const present = await listTabs();
  const allTabs = Object.values(SHEET_TABS) as SheetTab[];

  const toCreate = allTabs.filter((t) => !present.has(t));
  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: toCreate.map((title) => ({
          addSheet: { properties: { title } },
        })),
      },
    });
  }

  // Escribir headers en todas (idempotente: fija la fila 1).
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: allTabs.map((tab) => ({
        range: `${tab}!A1`,
        values: [HEADERS[tab]],
      })),
    },
  });

  return {
    created: toCreate,
    existing: allTabs.filter((t) => present.has(t)),
  };
}

/** Borra todo el contenido de una hoja por debajo del header y reescribe filas. */
export async function overwriteTab(
  tab: SheetTab,
  rows: object[],
): Promise<number> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();

  // Limpiar desde la fila 2 hacia abajo (conservar headers).
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tab}!A2:ZZ`,
  });

  if (rows.length === 0) return 0;

  const values = rows.map((r) => rowToArray(tab, r as Record<string, unknown>));
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A2`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
  return rows.length;
}

/** Añade filas al final de una hoja (sin borrar las existentes). */
export async function appendRows(
  tab: SheetTab,
  rows: object[],
): Promise<number> {
  if (rows.length === 0) return 0;
  const sheets = getSheetsClient();
  const values = rows.map((r) => rowToArray(tab, r as Record<string, unknown>));
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
  return rows.length;
}
