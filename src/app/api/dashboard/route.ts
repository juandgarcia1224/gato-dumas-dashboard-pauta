import { NextResponse } from "next/server";
import { getAppEnv, getEnvStatus } from "@/lib/config/env";
import { readTabs } from "@/lib/sheets/reader";
import { SHEET_TABS } from "@/lib/sheets/schema";
import {
  buildDashboardPayload,
  emptyTabs,
  type RawTabs,
} from "@/lib/dashboard/contract";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard?account=all|gato_colombia|gato_bucaramanga
 * Devuelve el DashboardPayload (ver src/lib/dashboard/contract.ts).
 * Nunca lanza: si Sheets no está listo o falla la lectura, devuelve payload
 * con notices claros y datos vacíos.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const accountFilter = url.searchParams.get("account") ?? "all";
  const appEnv = getAppEnv();
  const envStatus = getEnvStatus();

  if (!envStatus.sheetsReady) {
    return NextResponse.json(
      buildDashboardPayload({
        appEnv,
        envStatus,
        tabs: emptyTabs(),
        accountFilter,
      }),
    );
  }

  try {
    const data = await readTabs([
      SHEET_TABS.campaigns,
      SHEET_TABS.adsets,
      SHEET_TABS.ads,
      SHEET_TABS.alerts,
      SHEET_TABS.pacing,
      SHEET_TABS.updateLog,
    ]);
    const tabs: RawTabs = {
      campaigns: data[SHEET_TABS.campaigns] ?? [],
      adsets: data[SHEET_TABS.adsets] ?? [],
      ads: data[SHEET_TABS.ads] ?? [],
      alerts: data[SHEET_TABS.alerts] ?? [],
      pacing: data[SHEET_TABS.pacing] ?? [],
      updateLog: data[SHEET_TABS.updateLog] ?? [],
    };
    return NextResponse.json(
      buildDashboardPayload({ appEnv, envStatus, tabs, accountFilter }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      buildDashboardPayload({
        appEnv,
        envStatus,
        tabs: emptyTabs(),
        accountFilter,
        readError: message,
      }),
    );
  }
}
