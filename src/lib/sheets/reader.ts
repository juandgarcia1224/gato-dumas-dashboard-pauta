/**
 * Lectura de Google Sheets → objetos tipados por header.
 * Lo usa el API del dashboard. Tolerante: hoja vacía devuelve [].
 */

import { getSheetId, getSheetsClient } from "./client";
import { arrayToObjects, type SheetTab } from "./schema";

export async function readTab(tab: SheetTab): Promise<Record<string, string>[]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${tab}!A1:ZZ`,
    // UNFORMATTED: evita que el locale del Sheet (es-CO) formatee decimales con
    // coma (ej. "1,77") y rompa Number(). arrayToObjects normaliza a string.
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values = (res.data.values ?? []) as unknown[][];
  return arrayToObjects(values);
}

/** Lee varias hojas en una sola petición (más rápido y menos cuota). */
export async function readTabs(
  tabs: SheetTab[],
): Promise<Record<string, Record<string, string>[]>> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: getSheetId(),
    ranges: tabs.map((t) => `${t}!A1:ZZ`),
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const out: Record<string, Record<string, string>[]> = {};
  const ranges = res.data.valueRanges ?? [];
  tabs.forEach((tab, i) => {
    const values = (ranges[i]?.values ?? []) as unknown[][];
    out[tab] = arrayToObjects(values);
  });
  return out;
}
