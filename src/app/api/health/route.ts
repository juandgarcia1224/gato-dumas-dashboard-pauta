import { NextResponse } from "next/server";
import { getAppEnv, getEnvStatus } from "@/lib/config/env";

export const dynamic = "force-dynamic";

function readEnv(name: string): boolean {
  const v = process.env[name];
  return typeof v === "string" && v.trim().length > 0;
}

/** Healthcheck: estado de configuración sin exponer secretos. */
export async function GET() {
  const status = getEnvStatus();
  const app = getAppEnv();

  // Estado específico de /5gatos (usa META_ACCESS_TOKEN_5GATOS, no el token
  // de la vista interna Cloud Design).
  const fiveGatosToken = readEnv("META_ACCESS_TOKEN_5GATOS");
  const fiveGatosMapeoSheet = readEnv("GOOGLE_SHEET_MAPEO_5GATOS_ID");
  const fiveGatosReady =
    fiveGatosToken && status.metaAccounts.gato_bucaramanga && status.sheetsReady;

  return NextResponse.json({
    ok: true,
    service: "gato-dumas-dashboard",
    client: app.clientName,
    timezone: app.timezone,
    checkedAt: new Date().toISOString(),
    config: {
      // Ruta interna Cloud Design (vista de Colombia).
      internalReady: status.metaReady,
      metaToken: status.metaToken,
      metaAccounts: status.metaAccounts,
      // Dashboard cliente /5gatos.
      fiveGatosReady,
      fiveGatosToken,
      fiveGatosMapeoSheet,
      // Comunes.
      sheetsReady: status.sheetsReady,
      googleSheetId: status.googleSheetId,
      googleServiceAccount: status.googleServiceAccount,
      googlePrivateKey: status.googlePrivateKey,
    },
  });
}
