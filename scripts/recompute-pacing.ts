import "./load-env";
import { requireGoogleEnv } from "../src/lib/config/env";
import { readTab } from "../src/lib/sheets/reader";
import { overwriteTab } from "../src/lib/sheets/writer";
import { SHEET_TABS } from "../src/lib/sheets/schema";
import {
  computePacing,
  plannedBudgetByAccount,
} from "../src/lib/dashboard/pacing";

/**
 * Recalcula 05_Daily_Pacing desde 01_MediaPlan (presupuesto) + 02_Meta_Campaigns_Raw
 * (gasto real YA cargado). NO llama a Meta, NO usa token. Útil tras editar el
 * MediaPlan sin tener que correr una sincronización completa.
 *
 * Uso: npm run pacing:recompute            (mes actual)
 *      npm run pacing:recompute -- 2026-05 (mes específico)
 */
async function main() {
  requireGoogleEnv();

  const now = new Date();
  const month =
    process.argv[2] && /^\d{4}-\d{2}$/.test(process.argv[2])
      ? process.argv[2]
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [mediaPlan, campaigns] = await Promise.all([
    readTab(SHEET_TABS.mediaPlan),
    readTab(SHEET_TABS.campaigns),
  ]);

  const plannedByAccount = plannedBudgetByAccount(mediaPlan, month);

  // Gasto real acumulado por cuenta desde la data ya cargada.
  const actualByAccount: Record<string, number> = {};
  for (const r of campaigns) {
    const key = r.account_group;
    const spend = Number(r.spend) || 0;
    if (!key) continue;
    actualByAccount[key] = (actualByAccount[key] ?? 0) + spend;
  }

  const pacing = computePacing({ month, asOf: now, plannedByAccount, actualByAccount });
  await overwriteTab(SHEET_TABS.pacing, pacing);

  console.log(`\n=== pacing:recompute · ${month} ===`);
  for (const p of pacing) {
    console.log(
      `  ${p.account_group.padEnd(18)} plan=${p.planned_monthly_budget ?? "—"} ` +
        `esperado=${p.expected_spend_to_date ?? "—"} real=${p.actual_spend_to_date} ` +
        `Δ%=${p.spend_delta_pct ?? "—"} estado=${p.pacing_status}`,
    );
  }
  console.log(`\n✅ 05_Daily_Pacing actualizado (${pacing.length} filas). Sin tocar Meta.\n`);
}

main().catch((e) => {
  console.error("\n❌ Error en pacing:recompute:", e.message ?? e);
  process.exit(1);
});
