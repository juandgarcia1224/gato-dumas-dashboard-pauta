import { NextResponse } from "next/server";
import { getAppEnv, getEnvStatus } from "@/lib/config/env";

export const dynamic = "force-dynamic";

/** Healthcheck: estado de configuración sin exponer secretos. */
export async function GET() {
  const status = getEnvStatus();
  const app = getAppEnv();
  return NextResponse.json({
    ok: true,
    service: "gato-dumas-dashboard",
    client: app.clientName,
    timezone: app.timezone,
    checkedAt: new Date().toISOString(),
    config: {
      metaReady: status.metaReady,
      sheetsReady: status.sheetsReady,
      metaToken: status.metaToken,
      metaAccounts: status.metaAccounts,
      googleSheetId: status.googleSheetId,
      googleServiceAccount: status.googleServiceAccount,
      googlePrivateKey: status.googlePrivateKey,
    },
  });
}
