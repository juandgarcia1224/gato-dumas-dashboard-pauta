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
  });
  const values = (res.data.values ?? []) as string[][];
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
  });
  const out: Record<string, Record<string, string>[]> = {};
  const ranges = res.data.valueRanges ?? [];
  tabs.forEach((tab, i) => {
    const values = (ranges[i]?.values ?? []) as string[][];
    out[tab] = arrayToObjects(values);
  });
  return out;
}
