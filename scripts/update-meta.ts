import "./load-env";
import { pathToFileURL } from "node:url";
import { requireMetaEnv, requireGoogleEnv } from "../src/lib/config/env";
import {
  ACCOUNT_GROUPS,
  getAccountGroup,
  type AccountGroupKey,
} from "../src/lib/config/clients";
import { MetaClient } from "../src/lib/meta/client";
import { fetchEntityMeta, fetchInsights } from "../src/lib/meta/insights";
import {
  toAdRow,
  toAdsetRow,
  toCampaignRow,
} from "../src/lib/meta/transform";
import type {
  AccountPullResult,
  DatePreset,
  DateRange,
} from "../src/lib/meta/types";
import { appendRows, upsertRows } from "../src/lib/sheets/writer";
import { SHEET_TABS } from "../src/lib/sheets/schema";
import { addDays, monthEnd, monthStart, todayBogota } from "../src/lib/dashboard/range";

type SummaryRow = Record<string, unknown>;
interface PullResult extends AccountPullResult {
  summaries: SummaryRow[];
}

// ---------- args ----------
function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = "true";
      }
    }
  }
  return out;
}

const PRESETS: DatePreset[] = ["today", "yesterday", "last_7d", "this_month"];

/**
 * Resuelve a FECHAS EXPLÍCITAS (para daily y range pull) + rangeKey.
 * Los meses usan mes completo (monthStart..monthEnd) para casar con el
 * range_key que busca el dashboard.
 */
function resolveRange(args: Record<string, string>): {
  range: DateRange;
  label: string;
  rangeKey: string;
} {
  let start: string;
  let stop: string;
  let label: string;
  if (args.dateStart && args.dateStop) {
    start = args.dateStart;
    stop = args.dateStop;
    label = `${start}..${stop}`;
  } else {
    const preset = (PRESETS.includes(args.range as DatePreset) ? args.range : "this_month") as DatePreset;
    const today = todayBogota();
    if (preset === "today") {
      start = today;
      stop = today;
    } else if (preset === "yesterday") {
      start = addDays(today, -1);
      stop = start;
    } else if (preset === "last_7d") {
      start = addDays(today, -6);
      stop = today;
    } else {
      const ym = today.slice(0, 7);
      start = monthStart(ym);
      stop = monthEnd(ym);
    }
    label = preset;
  }
  return { range: { dateStart: start, dateStop: stop }, label, rangeKey: `${start}..${stop}` };
}

function toSummaryRows(
  rows: object[],
  level: "campaign" | "adset" | "ad",
  idField: string,
  rangeKey: string,
): SummaryRow[] {
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return { range_key: rangeKey, entity_level: level, entity_id: r[idField], ...r };
  });
}

// ---------- pull de una cuenta ----------
async function pullAccount(
  client: MetaClient,
  groupKey: AccountGroupKey,
  adAccountId: string,
  range: DateRange,
  rangeKey: string,
  pulledAt: string,
  summaryOnly: boolean,
): Promise<PullResult> {
  const group = getAccountGroup(groupKey)!;
  try {
    // RANGE agregado (sin time_increment): results/CPR exactos.
    const [campMeta, adsetMeta, adMeta, campRange, adsetRange, adRange] = await Promise.all([
      fetchEntityMeta(client, adAccountId, "campaign"),
      fetchEntityMeta(client, adAccountId, "adset"),
      fetchEntityMeta(client, adAccountId, "ad"),
      fetchInsights(client, adAccountId, "campaign", range, false),
      fetchInsights(client, adAccountId, "adset", range, false),
      fetchInsights(client, adAccountId, "ad", range, false),
    ]);
    const adAccountName = campRange[0]?.account_name ?? group.label;

    // DAILY (time_increment=1) solo si NO es summaryOnly.
    let campaigns: ReturnType<typeof toCampaignRow>[] = [];
    let adsets: ReturnType<typeof toAdsetRow>[] = [];
    let ads: ReturnType<typeof toAdRow>[] = [];
    if (!summaryOnly) {
      const [campDaily, adsetDaily, adDaily] = await Promise.all([
        fetchInsights(client, adAccountId, "campaign", range, true),
        fetchInsights(client, adAccountId, "adset", range, true),
        fetchInsights(client, adAccountId, "ad", range, true),
      ]);
      campaigns = campDaily.map((i) => toCampaignRow(i, groupKey, adAccountId, adAccountName, campMeta, pulledAt));
      adsets = adsetDaily.map((i) => toAdsetRow(i, groupKey, adAccountId, adsetMeta, pulledAt));
      ads = adDaily.map((i) => toAdRow(i, groupKey, adAccountId, adMeta, pulledAt));
    }

    const summaries: SummaryRow[] = [
      ...toSummaryRows(campRange.map((i) => toCampaignRow(i, groupKey, adAccountId, adAccountName, campMeta, pulledAt)), "campaign", "campaign_id", rangeKey),
      ...toSummaryRows(adsetRange.map((i) => toAdsetRow(i, groupKey, adAccountId, adsetMeta, pulledAt)), "adset", "adset_id", rangeKey),
      ...toSummaryRows(adRange.map((i) => toAdRow(i, groupKey, adAccountId, adMeta, pulledAt)), "ad", "ad_id", rangeKey),
    ];

    return { accountGroup: groupKey, adAccountId, adAccountName, ok: true, campaigns, adsets, ads, summaries };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { accountGroup: groupKey, adAccountId, adAccountName: group.label, ok: false, error: message, campaigns: [], adsets: [], ads: [], summaries: [] };
  }
}

export async function runUpdate(argv: string[]) {
  const args = parseArgs(argv);
  const updatedBy = args.updatedBy ?? "desconocido";
  const summaryOnly = Boolean(args.summaryOnly);
  const meta = requireMetaEnv();
  requireGoogleEnv();

  const { range, label, rangeKey } = resolveRange(args);
  const startedAt = new Date().toISOString();
  const runId = `run_${Date.now()}`;
  const client = new MetaClient({
    token: meta.token,
    apiVersion: meta.apiVersion,
  });

  console.log(`\n=== meta:update · ${label}${summaryOnly ? " · SOLO SUMMARY" : ""} · por ${updatedBy} ===`);
  console.log(`run_id=${runId}\n`);

  // Cuentas configuradas
  const targets = ACCOUNT_GROUPS.filter((g) => meta.accounts[g.key]).map((g) => ({
    group: g,
    adAccountId: meta.accounts[g.key]!,
  }));

  if (targets.length === 0) {
    console.error("❌ No hay cuentas configuradas. Aborta.");
    process.exit(1);
  }

  // Pull por cuenta (independiente: si una falla, sigue la otra)
  const results: PullResult[] = [];
  for (const t of targets) {
    process.stdout.write(`→ ${t.group.label} (${t.adAccountId}) ... `);
    const r = await pullAccount(
      client,
      t.group.key,
      t.adAccountId,
      range,
      rangeKey,
      startedAt,
      summaryOnly,
    );
    if (r.ok) {
      if (summaryOnly) {
        console.log(`ok · summary: ${r.summaries.length} filas (campaña+conjunto+anuncio)`);
      } else {
        console.log(`ok · ${r.campaigns.length} camp / ${r.adsets.length} adsets / ${r.ads.length} ads`);
      }
    } else {
      console.log(`ERROR: ${r.error}`);
    }
    results.push(r);
  }

  const okResults = results.filter((r) => r.ok);
  const allCampaigns = okResults.flatMap((r) => r.campaigns);
  const allAdsets = okResults.flatMap((r) => r.adsets);
  const allAds = okResults.flatMap((r) => r.ads);

  // UPSERT no destructivo (conserva histórico de otros días/meses).
  // Clave única incluye date_start/date_stop → las filas diarias coexisten.
  if (okResults.length > 0) {
    if (!summaryOnly) {
      const campKey = ["platform", "account_group", "ad_account_id", "date_start", "date_stop", "campaign_id"];
      const adsetKey = [...campKey, "adset_id"];
      const adKey = [...adsetKey, "ad_id"];
      const rc = await upsertRows(SHEET_TABS.campaigns, allCampaigns, campKey);
      const ra = await upsertRows(SHEET_TABS.adsets, allAdsets, adsetKey);
      const rd = await upsertRows(SHEET_TABS.ads, allAds, adKey);
      console.log("\n✓ Upsert RAW diario (spend/filtros/pacing, sin borrar):");
      console.log(`  campañas: +${rc.added} / ${rc.updated} act · total ${rc.total}`);
      console.log(`  adsets:   +${ra.added} / ${ra.updated} · total ${ra.total}`);
      console.log(`  ads:      +${rd.added} / ${rd.updated} · total ${rd.total}`);
    } else {
      console.log("\n✓ Modo --summaryOnly: NO se tocan las hojas RAW diarias (02/03/04).");
    }

    // RANGE SUMMARIES (results/CPR exactos del rango, sin sobreconteo diario)
    const allSummaries = okResults.flatMap((r) => r.summaries);
    if (allSummaries.length > 0) {
      const sumKey = ["range_key", "account_group", "entity_level", "entity_id"];
      const rs = await upsertRows(SHEET_TABS.rangeSummaries, allSummaries, sumKey);
      console.log(`✓ Range summary (${rangeKey}): +${rs.added} / ${rs.updated} act · total ${rs.total}`);
    }
  } else {
    console.log("\n⚠️  Todas las cuentas fallaron. No se modifican datos.");
  }

  // ----- Update log (una fila por cuenta) -----
  const finishedAt = new Date().toISOString();
  const logRows = results.map((r) => ({
    run_id: runId,
    started_at: startedAt,
    finished_at: finishedAt,
    updated_by: updatedBy,
    platform: "meta",
    account_group: r.accountGroup,
    status: r.ok ? "ok" : "error",
    date_preset_or_range: label,
    campaigns_count: r.campaigns.length,
    adsets_count: r.adsets.length,
    ads_count: r.ads.length,
    error_message: r.error ?? "",
  }));
  await appendRows(SHEET_TABS.updateLog, logRows);

  // ----- Resumen -----
  console.log("\n=== Resumen ===");
  for (const r of results) {
    const g = getAccountGroup(r.accountGroup);
    console.log(
      `  ${r.ok ? "✅" : "❌"} ${g?.label}: ${r.campaigns.length} campañas` +
        (r.ok ? "" : ` — ${r.error}`),
    );
  }
  if (summaryOnly) {
    const totalSum = okResults.reduce((a, r) => a + r.summaries.length, 0);
    console.log(`\nRange summaries procesados: ${totalSum} filas (sin tocar daily RAW).`);
  } else {
    console.log(
      `\nFilas diarias procesadas: ${allCampaigns.length} (campaña×día) · ${allAdsets.length} (adset×día) · ${allAds.length} (ad×día)`,
    );
  }
  console.log(`Update log: ${logRows.length} filas añadidas (run ${runId}).\n`);

  if (okResults.length === 0) process.exit(1);
}

// Auto-ejecuta solo si se corre directo (no al importarse desde meta:update:manual).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runUpdate(process.argv.slice(2)).catch((err) => {
    console.error("\n❌ Error fatal en meta:update:", err.message ?? err);
    process.exit(1);
  });
}
