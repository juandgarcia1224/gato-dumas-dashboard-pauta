import "./load-env";
import { getEnvStatus } from "../src/lib/config/env";
import { ACCOUNT_GROUPS } from "../src/lib/config/clients";

function mark(ok: boolean): string {
  return ok ? "✅" : "❌";
}

function main() {
  const s = getEnvStatus();
  console.log("\n=== Validación de entorno · Gato Dumas Dashboard ===\n");

  console.log("Meta Ads:");
  console.log(`  ${mark(s.metaToken)} META_ACCESS_TOKEN`);
  for (const g of ACCOUNT_GROUPS) {
    console.log(`  ${mark(s.metaAccounts[g.key])} ${g.envVar} (${g.label})`);
  }

  console.log("\nGoogle Sheets:");
  console.log(`  ${mark(s.googleSheetId)} GOOGLE_SHEET_ID`);
  console.log(`  ${mark(s.googleServiceAccount)} GOOGLE_SERVICE_ACCOUNT_EMAIL`);
  console.log(`  ${mark(s.googlePrivateKey)} GOOGLE_PRIVATE_KEY`);

  console.log("\nResumen:");
  console.log(`  Meta listo:   ${mark(s.metaReady)}`);
  console.log(`  Sheets listo: ${mark(s.sheetsReady)}`);

  if (!s.metaReady || !s.sheetsReady) {
    console.log(
      "\n⚠️  Faltan variables. Copia .env.example a .env.local y complétalas.",
    );
    console.log("   Ver docs/SETUP.md y docs/SEGURIDAD_TOKENS.md\n");
    process.exit(1);
  }
  console.log("\n✅ Entorno completo. Puedes correr sheets:setup y meta:update.\n");
}

main();
