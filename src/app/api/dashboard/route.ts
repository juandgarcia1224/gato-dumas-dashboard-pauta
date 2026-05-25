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
 * GET /api/dashboard
 *   ?view=consolidado|gato_colombia|bogota|barranquilla|gato_bucaramanga
 *   ?range=today|yesterday|last_7d|this_month|custom
 *   ?dateStart=YYYY-MM-DD&dateStop=YYYY-MM-DD   (para range=custom)
 *
 * Nunca lanza: si Sheets no está listo o falla, devuelve payload con notices.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  // `view` nuevo; `account` por compatibilidad.
  const view = url.searchParams.get("view") ?? url.searchParams.get("account") ?? "consolidado";
  const range = url.searchParams.get("range") ?? undefined;
  const dateStart = url.searchParams.get("dateStart") ?? undefined;
  const dateStop = url.searchParams.get("dateStop") ?? undefined;
  const appEnv = getAppEnv();
  const envStatus = getEnvStatus();

  const common = { appEnv, envStatus, view, range, dateStart, dateStop };

  if (!envStatus.sheetsReady) {
    return NextResponse.json(buildDashboardPayload({ ...common, tabs: emptyTabs() }));
  }

  try {
    const data = await readTabs([
      SHEET_TABS.campaigns,
      SHEET_TABS.adsets,
      SHEET_TABS.ads,
      SHEET_TABS.updateLog,
      SHEET_TABS.mapping,
      SHEET_TABS.mediaPlan,
      SHEET_TABS.rangeSummaries,
    ]);
    const tabs: RawTabs = {
      campaigns: data[SHEET_TABS.campaigns] ?? [],
      adsets: data[SHEET_TABS.adsets] ?? [],
      ads: data[SHEET_TABS.ads] ?? [],
      updateLog: data[SHEET_TABS.updateLog] ?? [],
      mapping: data[SHEET_TABS.mapping] ?? [],
      mediaPlan: data[SHEET_TABS.mediaPlan] ?? [],
      rangeSummaries: data[SHEET_TABS.rangeSummaries] ?? [],
    };
    return NextResponse.json(buildDashboardPayload({ ...common, tabs }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      buildDashboardPayload({ ...common, tabs: emptyTabs(), readError: message }),
    );
  }
}
