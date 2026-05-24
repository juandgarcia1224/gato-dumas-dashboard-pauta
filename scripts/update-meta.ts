import "./load-env";
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
  CampaignRow,
  DatePreset,
  DateRange,
} from "../src/lib/meta/types";
import { appendRows, overwriteTab } from "../src/lib/sheets/writer";
import { readTab } from "../src/lib/sheets/reader";
import { SHEET_TABS } from "../src/lib/sheets/schema";
import type { CampaignRecord } from "../src/lib/dashboard/metrics";
import { buildCampaignAlerts } from "../src/lib/dashboard/alerts";
import {
  buildPacingAlerts,
  computePacing,
  plannedBudgetByAccount,
} from "../src/lib/dashboard/pacing";

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

function resolveRange(args: Record<string, string>): {
  range: DateRange;
  label: string;
  month: string;
  asOf: Date;
} {
  if (args.dateStart && args.dateStop) {
    return {
      range: { dateStart: args.dateStart, dateStop: args.dateStop },
      label: `${args.dateStart}..${args.dateStop}`,
      month: args.dateStart.slice(0, 7),
      asOf: new Date(`${args.dateStop}T12:00:00`),
    };
  }
  const preset = (PRESETS.includes(args.range as DatePreset)
    ? args.range
    : "this_month") as DatePreset;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return { range: { preset }, label: preset, month, asOf: now };
}

// ---------- pull de una cuenta ----------
async function pullAccount(
  client: MetaClient,
  groupKey: AccountGroupKey,
  adAccountId: string,
  range: DateRange,
  pulledAt: string,
): Promise<AccountPullResult> {
  const group = getAccountGroup(groupKey)!;
  try {
    const [campInsights, adsetInsights, adInsights] = await Promise.all([
      fetchInsights(client, adAccountId, "campaign", range),
      fetchInsights(client, adAccountId, "adset", range),
      fetchInsights(client, adAccountId, "ad", range),
    ]);
    const [campMeta, adsetMeta, adMeta] = await Promise.all([
      fetchEntityMeta(client, adAccountId, "campaign"),
      fetchEntityMeta(client, adAccountId, "adset"),
      fetchEntityMeta(client, adAccountId, "ad"),
    ]);
    const adAccountName = campInsights[0]?.account_name ?? group.label;
    return {
      accountGroup: groupKey,
      adAccountId,
      adAccountName,
      ok: true,
      campaigns: campInsights.map((i) =>
        toCampaignRow(i, groupKey, adAccountId, adAccountName, campMeta, pulledAt),
      ),
      adsets: adsetInsights.map((i) =>
        toAdsetRow(i, groupKey, adAccountId, adsetMeta, pulledAt),
      ),
      ads: adInsights.map((i) =>
        toAdRow(i, groupKey, adAccountId, adMeta, pulledAt),
      ),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      accountGroup: groupKey,
      adAccountId,
      adAccountName: group.label,
      ok: false,
      error: message,
      campaigns: [],
      adsets: [],
      ads: [],
    };
  }
}

function campaignRowToRecord(r: CampaignRow): CampaignRecord {
  return {
    account_group: r.account_group,
    ad_account_id: r.ad_account_id,
    ad_account_name: r.ad_account_name,
    campaign_id: r.campaign_id,
    campaign_name: r.campaign_name,
    objective: r.objective,
    buying_type: r.buying_type,
    status: r.status,
    effective_status: r.effective_status,
    spend: r.spend,
    impressions: r.impressions,
    reach: r.reach,
    frequency: r.frequency,
    clicks: r.clicks,
    ctr: r.ctr,
    cpc: r.cpc,
    cpm: r.cpm,
    results_type: r.results_type,
    results: r.results,
    cost_per_result: r.cost_per_result,
    date_start: r.date_start,
    date_stop: r.date_stop,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const updatedBy = args.updatedBy ?? "desconocido";
  const meta = requireMetaEnv();
  requireGoogleEnv();

  const { range, label, month, asOf } = resolveRange(args);
  const startedAt = new Date().toISOString();
  const runId = `run_${Date.now()}`;
  const client = new MetaClient({
    token: meta.token,
    apiVersion: meta.apiVersion,
  });

  console.log(`\n=== meta:update · ${label} · por ${updatedBy} ===`);
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
  const results: AccountPullResult[] = [];
  for (const t of targets) {
    process.stdout.write(`→ ${t.group.label} (${t.adAccountId}) ... `);
    const r = await pullAccount(
      client,
      t.group.key,
      t.adAccountId,
      range,
      startedAt,
    );
    if (r.ok) {
      console.log(
        `ok · ${r.campaigns.length} camp / ${r.adsets.length} adsets / ${r.ads.length} ads`,
      );
    } else {
      console.log(`ERROR: ${r.error}`);
    }
    results.push(r);
  }

  const okResults = results.filter((r) => r.ok);
  const allCampaigns = okResults.flatMap((r) => r.campaigns);
  const allAdsets = okResults.flatMap((r) => r.adsets);
  const allAds = okResults.flatMap((r) => r.ads);

  // Escribir RAW solo si al menos una cuenta tuvo éxito (no borrar histórico si todo falló)
  if (okResults.length > 0) {
    await overwriteTab(SHEET_TABS.campaigns, allCampaigns);
    await overwriteTab(SHEET_TABS.adsets, allAdsets);
    await overwriteTab(SHEET_TABS.ads, allAds);
    console.log("\n✓ Hojas RAW actualizadas.");

    // ----- Pacing -----
    const records = allCampaigns.map(campaignRowToRecord);
    const mediaPlan = await readTab(SHEET_TABS.mediaPlan);
    const plannedByAccount = plannedBudgetByAccount(mediaPlan, month);
    const actualByAccount: Record<string, number> = {};
    for (const rec of records) {
      actualByAccount[rec.account_group] =
        (actualByAccount[rec.account_group] ?? 0) + rec.spend;
    }
    const pacing = computePacing({
      month,
      asOf,
      plannedByAccount,
      actualByAccount,
    });
    await overwriteTab(SHEET_TABS.pacing, pacing);
    console.log("✓ Pacing calculado.");

    // ----- Alertas -----
    const campaignAlerts = buildCampaignAlerts(records, startedAt);
    const pacingAlerts = buildPacingAlerts(
      pacing,
      startedAt,
      (key) => getAccountGroup(key)?.label ?? key,
    );
    const alerts = [...campaignAlerts, ...pacingAlerts];
    await overwriteTab(SHEET_TABS.alerts, alerts);
    console.log(`✓ ${alerts.length} alertas generadas.`);
  } else {
    console.log("\n⚠️  Todas las cuentas fallaron. No se sobrescriben datos.");
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
  console.log(
    `\nTotal escrito: ${allCampaigns.length} campañas · ${allAdsets.length} adsets · ${allAds.length} ads`,
  );
  console.log(`Update log: ${logRows.length} filas añadidas (run ${runId}).\n`);

  if (okResults.length === 0) process.exit(1);
}

main().catch((err) => {
  console.error("\n❌ Error fatal en meta:update:", err.message ?? err);
  process.exit(1);
});
