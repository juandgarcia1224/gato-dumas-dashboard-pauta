import "./load-env";
import { requireGoogleEnv } from "../src/lib/config/env";
import { getMetaEnv } from "../src/lib/config/env";
import { ACCOUNT_GROUPS, CLIENT } from "../src/lib/config/clients";
import { ensureTabs, overwriteTab } from "../src/lib/sheets/writer";
import { readTab } from "../src/lib/sheets/reader";
import { SHEET_TABS } from "../src/lib/sheets/schema";

async function main() {
  requireGoogleEnv(); // lanza con mensaje claro si faltan credenciales

  console.log("\n=== Setup de Google Sheets · Gato Dumas ===\n");

  const { created, existing } = await ensureTabs();
  console.log(`Hojas existentes: ${existing.join(", ") || "(ninguna)"}`);
  console.log(`Hojas creadas:    ${created.join(", ") || "(ninguna)"}`);

  // Sembrar 00_Config con las dos cuentas SOLO si está vacío (no pisar manual).
  const configRows = await readTab(SHEET_TABS.config);
  if (configRows.length === 0) {
    const meta = getMetaEnv();
    const seed = ACCOUNT_GROUPS.map((g) => ({
      client_id: CLIENT.id,
      client_name: CLIENT.name,
      account_group: g.key,
      platform: g.platform,
      ad_account_id: meta.accounts[g.key] ?? "",
      ad_account_name: g.label,
      sede: g.sede,
      active: true,
      notes: g.notes,
    }));
    await overwriteTab(SHEET_TABS.config, seed);
    console.log(`\n✅ 00_Config sembrado con ${seed.length} cuentas.`);
  } else {
    console.log(
      `\nℹ️  00_Config ya tiene ${configRows.length} filas. No se modifica.`,
    );
  }

  console.log(
    "\n✅ Setup completo. 01_MediaPlan queda lista para llenar manualmente.\n",
  );
}

main().catch((err) => {
  console.error("\n❌ Error en setup-sheets:", err.message ?? err);
  process.exit(1);
});
