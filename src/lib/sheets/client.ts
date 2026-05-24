/**
 * Cliente autenticado de Google Sheets vía service account (JWT).
 * Scope read/write. No persiste credenciales: las toma de env en cada llamada.
 */

import { google, type sheets_v4 } from "googleapis";
import { requireGoogleEnv } from "../config/env";

let cached: sheets_v4.Sheets | null = null;

export function getSheetsClient(): sheets_v4.Sheets {
  if (cached) return cached;
  const { serviceAccountEmail, privateKey } = requireGoogleEnv();
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cached = google.sheets({ version: "v4", auth });
  return cached;
}

export function getSheetId(): string {
  return requireGoogleEnv().sheetId;
}
