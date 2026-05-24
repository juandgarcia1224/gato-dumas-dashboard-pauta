/**
 * Lectura y validación de variables de entorno.
 *
 * Reglas:
 * - NO se lee process.env a nivel de módulo; siempre dentro de funciones,
 *   para que los scripts puedan cargar dotenv antes de invocarlas.
 * - En contexto de dashboard NUNCA lanzamos: devolvemos estados claros.
 * - En contexto de scripts usamos `requireMetaEnv` / `requireGoogleEnv`
 *   que sí lanzan con mensajes accionables.
 */

import { ACCOUNT_GROUPS, type AccountGroupKey } from "./clients";

function read(name: string): string | null {
  const v = process.env[name];
  if (v === undefined || v === null) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export interface MetaEnv {
  token: string | null;
  apiVersion: string;
  accounts: Record<AccountGroupKey, string | null>;
}

export interface GoogleEnv {
  sheetId: string | null;
  serviceAccountEmail: string | null;
  privateKey: string | null;
}

export interface AppEnv {
  clientName: string;
  timezone: string;
}

export interface EnvStatus {
  metaToken: boolean;
  metaAccounts: Record<AccountGroupKey, boolean>;
  googleSheetId: boolean;
  googleServiceAccount: boolean;
  googlePrivateKey: boolean;
  /** True si Meta puede consultarse (token + al menos una cuenta). */
  metaReady: boolean;
  /** True si Sheets puede leerse/escribirse. */
  sheetsReady: boolean;
}

export function getMetaEnv(): MetaEnv {
  const accounts = {} as Record<AccountGroupKey, string | null>;
  for (const g of ACCOUNT_GROUPS) {
    accounts[g.key] = read(g.envVar);
  }
  return {
    token: read("META_ACCESS_TOKEN"),
    apiVersion: read("META_API_VERSION") ?? "v22.0",
    accounts,
  };
}

export function getGoogleEnv(): GoogleEnv {
  let privateKey = read("GOOGLE_PRIVATE_KEY");
  // Las claves suelen venir con \n literales (escapados) desde el JSON.
  if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");
  return {
    sheetId: read("GOOGLE_SHEET_ID"),
    serviceAccountEmail: read("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    privateKey,
  };
}

export function getAppEnv(): AppEnv {
  return {
    clientName: read("NEXT_PUBLIC_CLIENT_NAME") ?? "Gato Dumas",
    timezone: read("NEXT_PUBLIC_TIMEZONE") ?? "America/Bogota",
  };
}

export function getEnvStatus(): EnvStatus {
  const meta = getMetaEnv();
  const google = getGoogleEnv();
  const metaAccounts = {} as Record<AccountGroupKey, boolean>;
  for (const g of ACCOUNT_GROUPS) {
    metaAccounts[g.key] = Boolean(meta.accounts[g.key]);
  }
  const anyAccount = Object.values(metaAccounts).some(Boolean);
  const sheetsReady = Boolean(
    google.sheetId && google.serviceAccountEmail && google.privateKey,
  );
  return {
    metaToken: Boolean(meta.token),
    metaAccounts,
    googleSheetId: Boolean(google.sheetId),
    googleServiceAccount: Boolean(google.serviceAccountEmail),
    googlePrivateKey: Boolean(google.privateKey),
    metaReady: Boolean(meta.token) && anyAccount,
    sheetsReady,
  };
}

/** Para scripts: lanza si Meta no está listo. */
export function requireMetaEnv(): MetaEnv & { token: string } {
  const meta = getMetaEnv();
  if (!meta.token) {
    throw new Error(
      "META_ACCESS_TOKEN no configurado. Defínelo en .env.local (ver docs/SEGURIDAD_TOKENS.md).",
    );
  }
  const anyAccount = Object.values(meta.accounts).some(Boolean);
  if (!anyAccount) {
    throw new Error(
      "Ninguna cuenta publicitaria configurada. Define META_AD_ACCOUNT_GATO_COLOMBIA y/o META_AD_ACCOUNT_GATO_BUCARAMANGA en .env.local.",
    );
  }
  return meta as MetaEnv & { token: string };
}

/** Para scripts: lanza si Sheets no está listo. */
export function requireGoogleEnv(): GoogleEnv & {
  sheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
} {
  const g = getGoogleEnv();
  const missing: string[] = [];
  if (!g.sheetId) missing.push("GOOGLE_SHEET_ID");
  if (!g.serviceAccountEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!g.privateKey) missing.push("GOOGLE_PRIVATE_KEY");
  if (missing.length > 0) {
    throw new Error(
      `Faltan credenciales de Google Sheets: ${missing.join(", ")}. Ver docs/SETUP.md.`,
    );
  }
  return g as GoogleEnv & {
    sheetId: string;
    serviceAccountEmail: string;
    privateKey: string;
  };
}
