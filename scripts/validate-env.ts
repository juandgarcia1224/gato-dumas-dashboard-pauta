import "./load-env";
import { getEnvStatus, getAppEnv } from "../src/lib/config/env";
import { ACCOUNT_GROUPS } from "../src/lib/config/clients";

function mark(ok: boolean): string {
  return ok ? "✅" : "❌";
}

function main() {
  const s = getEnvStatus();
  const app = getAppEnv();

  console.log("\n=== Validación de entorno · Gato Dumas Dashboard ===\n");

  console.log("Google Sheets (persistente · requerido):");
  console.log(`  ${mark(s.googleSheetId)} GOOGLE_SHEET_ID`);
  console.log(`  ${mark(s.googleServiceAccount)} GOOGLE_SERVICE_ACCOUNT_EMAIL`);
  console.log(`  ${mark(s.googlePrivateKey)} GOOGLE_PRIVATE_KEY`);

  console.log("\nCuentas Meta (persistente · requerido):");
  for (const g of ACCOUNT_GROUPS) {
    console.log(`  ${mark(s.metaAccounts[g.key])} ${g.envVar} (${g.label})`);
  }

  console.log("\nApp:");
  console.log(`  ✅ NEXT_PUBLIC_CLIENT_NAME = ${app.clientName}`);
  console.log(`  ✅ NEXT_PUBLIC_TIMEZONE = ${app.timezone}`);

  console.log("\nMeta token (TEMPORAL · NO requerido aquí):");
  if (s.metaToken) {
    console.log(
      "  ⚠️  META_ACCESS_TOKEN está presente en el entorno. Recuerda: el token " +
        "no debe guardarse en .env.local; se entrega por corrida.",
    );
  } else {
    console.log(
      "  ℹ️  No configurado (correcto). Se entrega al actualizar:\n" +
        '       META_ACCESS_TOKEN="…" npm run meta:update -- --range this_month --updatedBy Paola\n' +
        "       o bien:  npm run meta:update:manual -- --range this_month --updatedBy Paola",
    );
  }

  const accountsOk = ACCOUNT_GROUPS.every((g) => s.metaAccounts[g.key]);
  const baseReady = s.sheetsReady && accountsOk;

  console.log("\nResumen:");
  console.log(`  Google + cuentas listos: ${mark(baseReady)}`);

  if (!baseReady) {
    console.log(
      "\n⚠️  Falta configuración base. Copia .env.example a .env.local y completa Google + cuentas.",
    );
    console.log("   Ver docs/SETUP.md\n");
    process.exit(1);
  }

  console.log(
    "\n✅ Configuración base completa. Puedes correr sheets:setup y, con token temporal, meta:update.\n",
  );
}

main();
