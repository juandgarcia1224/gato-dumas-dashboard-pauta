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
  const msg = String(err?.message ?? err);
  console.error("\n❌ Error en setup-sheets:", msg);

  // Hints accionables para los errores de configuración más comunes.
  if (/has not been used in project|api.*disabled|SERVICE_DISABLED/i.test(msg)) {
    const m = msg.match(/project (\d+)/);
    const proj = m ? m[1] : "tu-proyecto";
    console.error(
      "\n💡 La Google Sheets API no está habilitada en el proyecto del service account.\n" +
        `   Habilítala aquí y reintenta (espera 1–2 min para que propague):\n` +
        `   https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=${proj}\n`,
    );
  } else if (/caller does not have permission|PERMISSION_DENIED|The caller/i.test(msg)) {
    console.error(
      "\n💡 El service account no tiene acceso al Sheet.\n" +
        "   Comparte el Sheet (GOOGLE_SHEET_ID) como EDITOR con el GOOGLE_SERVICE_ACCOUNT_EMAIL.\n",
    );
  }
  process.exit(1);
});
