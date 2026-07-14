/**
 * GET /api/5gatos/ads?adset={id}&month=YYYY-MM
 *
 * Ads de UN adset (creative + métricas del mes) para el acordeón de
 * /5gatos: el cliente los pide solo cuando el usuario despliega el adset,
 * así el render inicial no dispara N llamadas a Meta.
 *
 * Protegida por middleware (login Google + allowlist). SOLO lectura de
 * Meta, cacheada 10 min por adset+mes (unstable_cache en getAdsDeAdset).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  currentMonthBogota,
  getAdsDeAdset,
  isValidMonth,
} from "@/lib/fivegatos/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adsetId = req.nextUrl.searchParams.get("adset") ?? "";
  if (!/^\d{5,25}$/.test(adsetId)) {
    return NextResponse.json({ error: "Parámetro adset inválido." }, { status: 400 });
  }
  const monthParam = req.nextUrl.searchParams.get("month") ?? "";
  const month = isValidMonth(monthParam) ? monthParam : currentMonthBogota();

  try {
    const ads = await getAdsDeAdset(adsetId, month);
    return NextResponse.json({ month, adset_id: adsetId, ads });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[5gatos] Error trayendo ads del adset ${adsetId}:`, msg);
    return NextResponse.json(
      { error: "Estamos actualizando los datos, vuelve en unos minutos." },
      { status: 503 },
    );
  }
}
