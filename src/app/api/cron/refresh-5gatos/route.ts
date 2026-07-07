/**
 * GET /api/cron/refresh-5gatos
 * Cron (cada 3 horas, ver vercel.json): trae insights de Meta del mes en
 * curso + 90 días atrás (agrupado por campaña y mes), aplica el mapeo
 * curso↔campaña y guarda snapshot en el Sheet PROD
 * (11_5Gatos_Snapshot + 12_5Gatos_Cron_Log).
 *
 * Seguridad: requiere header `Authorization: Bearer ${CRON_SECRET}`.
 * (Vercel Cron lo envía automáticamente si CRON_SECRET existe como env var.)
 *
 * Circuit breaker: si el pull de Meta falla en 3 corridas seguidas,
 * responde 500 con mensaje accionable (probablemente token vencido).
 */

import { NextRequest, NextResponse } from "next/server";
import { MetaClient, MetaApiError } from "@/lib/meta/client";
import { fetchEntityMeta } from "@/lib/meta/insights";
import { interpretResult } from "@/lib/meta/transform";
import type { MetaAction } from "@/lib/meta/types";
import { loadMapping, matchCampaignAgainstRules, recordUnclassified } from "@/lib/mapping/courses";
import { getFiveGatosAccountId, getFiveGatosToken } from "@/lib/fivegatos/constants";
import { getSheetsClient, getSheetId } from "@/lib/sheets/client";
import { HEADERS, SHEET_TABS } from "@/lib/sheets/schema";
import { appendRows, upsertRows } from "@/lib/sheets/writer";
import { getEnvStatus } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const FIELDS = [
  "campaign_id",
  "campaign_name",
  "spend",
  "impressions",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "actions",
  "cost_per_action_type",
  "date_start",
  "date_stop",
].join(",");

interface CronInsight {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  date_start?: string;
  date_stop?: string;
}

function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
}

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

/** Crea (si faltan) las hojas 11/12 en el Sheet PROD y fija sus headers. */
async function ensureFiveGatosTabs(): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const present = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title),
  );
  const wanted = [SHEET_TABS.fiveGatosSnapshot, SHEET_TABS.fiveGatosCronLog];
  const missing = wanted.filter((t) => !present.has(t));
  if (missing.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
  }
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: wanted.map((tab) => ({ range: `${tab}!A1`, values: [HEADERS[tab]] })),
    },
  });
}

/** ¿Cuántas corridas consecutivas fallidas hay al final del log (incluyendo esta)? */
async function consecutiveFailures(): Promise<number> {
  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range: `${SHEET_TABS.fiveGatosCronLog}!A2:B`,
    });
    const rows = res.data.values ?? [];
    let count = 0;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (String(rows[i][1] ?? "") === "error") count++;
      else break;
    }
    return count;
  } catch {
    return 0;
  }
}

async function logRun(row: Record<string, unknown>): Promise<void> {
  try {
    await appendRows(SHEET_TABS.fiveGatosCronLog, [row]);
  } catch (err) {
    console.error("[cron 5gatos] No se pudo escribir el log:", err);
  }
}

export async function GET(req: NextRequest) {
  const started = Date.now();

  // 1) Autenticación del cron.
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = getFiveGatosToken();
  const env = getEnvStatus();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "META_ACCESS_TOKEN_5GATOS no configurado en Vercel. " +
          "Genera el token permanente del System User (docs/BUSINESS_MANAGER_SETUP.md).",
      },
      { status: 500 },
    );
  }

  const accountId = getFiveGatosAccountId();
  const client = new MetaClient({
    token,
    apiVersion: process.env.META_API_VERSION?.trim() || "v22.0",
  });

  // Asegurar hojas 11/12 ANTES del pull, para que el log de errores y el
  // circuit breaker funcionen aunque la primera corrida falle.
  if (env.sheetsReady) {
    try {
      await ensureFiveGatosTabs();
    } catch (err) {
      console.error("[cron 5gatos] No se pudieron asegurar las hojas:", err);
    }
  }

  try {
    // 2) Insights: mes en curso + 90 días atrás, una fila por campaña y mes.
    const since = isoDaysAgo(90);
    const until = todayIso();
    const [insights, statusMap, rules] = await Promise.all([
      client.getAll<CronInsight>(`${accountId}/insights`, {
        level: "campaign",
        fields: FIELDS,
        time_increment: "monthly",
        time_range: JSON.stringify({ since, until }),
      }),
      fetchEntityMeta(client, accountId, "campaign"),
      loadMapping(),
    ]);

    const snapshotAt = new Date().toISOString();
    const num = (v: string | undefined) => {
      const n = Number(v ?? 0);
      return Number.isFinite(n) ? n : 0;
    };

    const unclassified = new Map<string, CronInsight>();
    const rows = insights.map((r) => {
      const spend = num(r.spend);
      const result = interpretResult(r.actions, r.cost_per_action_type, spend);
      const match = matchCampaignAgainstRules(
        rules,
        r.campaign_name ?? "",
        r.campaign_id ?? "",
      );
      if (!match && spend > 0 && r.campaign_id) unclassified.set(r.campaign_id, r);
      const meta = r.campaign_id ? statusMap.get(r.campaign_id) : undefined;
      return {
        snapshot_at: snapshotAt,
        month: (r.date_start ?? "").slice(0, 7),
        campaign_id: r.campaign_id ?? "",
        campaign_name: r.campaign_name ?? "",
        tipo: match?.tipo ?? "",
        nombre_normalizado: match?.nombre_normalizado ?? "",
        status: meta?.status ?? "",
        effective_status: meta?.effective_status ?? "",
        spend,
        impressions: num(r.impressions),
        clicks: num(r.clicks),
        ctr: num(r.ctr),
        cpc: num(r.cpc),
        cpm: num(r.cpm),
        results_type: result.results_type,
        results: result.results,
        cost_per_result: result.cost_per_result,
        date_start: r.date_start ?? "",
        date_stop: r.date_stop ?? "",
      };
    });

    // 3) Guardar snapshot en el Sheet PROD (si Sheets está configurado).
    let sheetInfo = "sheets no configurado (snapshot omitido)";
    if (env.sheetsReady) {
      const res = await upsertRows(SHEET_TABS.fiveGatosSnapshot, rows, [
        "month",
        "campaign_id",
      ]);
      sheetInfo = `snapshot: +${res.added} nuevas, ${res.updated} actualizadas (${res.total} filas)`;
    }

    // 4) Registrar sin-clasificar en el Sheet de mapeo (throttled).
    await Promise.allSettled(
      [...unclassified.values()].map((r) =>
        recordUnclassified({
          campaign_id: r.campaign_id ?? "",
          campaign_name: r.campaign_name ?? "",
          account_id: accountId,
        }),
      ),
    );

    if (env.sheetsReady) {
      await logRun({
        run_at: snapshotAt,
        status: "ok",
        months: `${since}..${until}`,
        campaigns_count: rows.length,
        unclassified_count: unclassified.size,
        duration_ms: Date.now() - started,
        error_message: "",
      });
    }

    return NextResponse.json({
      ok: true,
      rango: `${since} → ${until}`,
      filas: rows.length,
      sin_clasificar: unclassified.size,
      sheet: sheetInfo,
      duracion_ms: Date.now() - started,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTokenError =
      err instanceof MetaApiError && (err.fbCode === 190 || err.status === 401);

    if (env.sheetsReady) {
      await logRun({
        run_at: new Date().toISOString(),
        status: "error",
        months: "",
        campaigns_count: 0,
        unclassified_count: 0,
        duration_ms: Date.now() - started,
        error_message: msg,
      });
    }

    // 5) Circuit breaker: 3 fallas consecutivas → alerta clara.
    const fails = env.sheetsReady ? await consecutiveFailures() : 1;
    if (fails >= 3) {
      const alerta =
        `⛔ CIRCUIT BREAKER 5GATOS: ${fails} corridas consecutivas fallidas. ` +
        (isTokenError
          ? "El token de Meta parece VENCIDO o revocado. Acción: generar token permanente del System User (docs/BUSINESS_MANAGER_SETUP.md) y actualizar META_ACCESS_TOKEN_5GATOS en Vercel."
          : `Último error: ${msg}. Revisar logs de Vercel y estado de la cuenta ${accountId}.`);
      console.error(alerta);
      return NextResponse.json({ error: alerta }, { status: 500 });
    }

    console.error(`[cron 5gatos] Corrida fallida (${fails} seguidas):`, msg);
    return NextResponse.json(
      { error: `Corrida fallida: ${msg}`, fallas_consecutivas: fails },
      { status: 500 },
    );
  }
}
