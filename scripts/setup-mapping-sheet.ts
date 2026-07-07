/**
 * Crea el Google Sheet `Mapeo_Cursos_5Gatos_Bucaramanga` (mapeo curso↔campaña
 * del dashboard cliente 5 Gatos), siembra las reglas iniciales desde
 * `src/lib/mapping/fallback.json` y lo comparte con Juan como Editor.
 *
 * Uso:
 *   npx tsx scripts/setup-mapping-sheet.ts
 *
 * Requiere en .env.local:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
 *
 * Al terminar imprime el ID del Sheet → copiarlo a .env.local como
 * GOOGLE_SHEET_MAPEO_5GATOS_ID (y a Vercel).
 *
 * Idempotencia: si GOOGLE_SHEET_MAPEO_5GATOS_ID ya está definido, NO crea un
 * sheet nuevo; solo garantiza hojas/headers y el permiso de Juan.
 */
import "./load-env";

import { google } from "googleapis";
import { getGoogleEnv } from "../src/lib/config/env";
import { getFallbackRules } from "../src/lib/mapping/courses";
import { MAPPING_HEADERS, MAPPING_TABS } from "../src/lib/mapping/types";

const SHEET_TITLE = "Mapeo_Cursos_5Gatos_Bucaramanga";
const SHARE_WITH = "juandgarcia1224@gmail.com";

async function main() {
  const g = getGoogleEnv();
  if (!g.serviceAccountEmail || !g.privateKey) {
    console.error(
      "❌ Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY en .env.local.\n" +
        "   Juan: usa el service account de cookminds-dashboards y vuelve a correr:\n" +
        "   npx tsx scripts/setup-mapping-sheet.ts",
    );
    process.exit(1);
  }

  const auth = new google.auth.JWT({
    email: g.serviceAccountEmail,
    key: g.privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      // drive.file: solo archivos creados por esta app (necesario para compartir)
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const drive = google.drive({ version: "v3", auth });

  let spreadsheetId = process.env.GOOGLE_SHEET_MAPEO_5GATOS_ID?.trim() || null;
  const tabs = Object.values(MAPPING_TABS);

  if (!spreadsheetId) {
    console.log(`Creando spreadsheet "${SHEET_TITLE}"…`);
    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: SHEET_TITLE,
          locale: "es_CO",
          timeZone: "America/Bogota",
        },
        sheets: tabs.map((title, i) => ({
          properties: { title, index: i },
        })),
      },
    });
    spreadsheetId = created.data.spreadsheetId!;
    console.log(`✅ Creado: ${spreadsheetId}`);
  } else {
    console.log(`Sheet ya configurado (${spreadsheetId}); asegurando hojas…`);
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const present = new Set(
      (meta.data.sheets ?? []).map((s) => s.properties?.title),
    );
    const missing = tabs.filter((t) => !present.has(t));
    if (missing.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
        },
      });
      console.log(`  + hojas creadas: ${missing.join(", ")}`);
    }
  }

  // Headers (idempotente: fija la fila 1 de cada hoja).
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: tabs.map((tab) => ({
        range: `${tab}!A1`,
        values: [MAPPING_HEADERS[tab]],
      })),
    },
  });
  console.log("✅ Headers escritos en Mapeo / Historial / Sin_Clasificar");

  // Sembrar reglas iniciales SOLO si la hoja Mapeo está vacía (no pisar a Ruzmery).
  const current = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${MAPPING_TABS.mapeo}!A2:F`,
  });
  if (!current.data.values || current.data.values.length === 0) {
    const rules = getFallbackRules();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${MAPPING_TABS.mapeo}!A2`,
      valueInputOption: "RAW",
      requestBody: {
        values: rules.map((r) => [
          r.pattern_regex,
          r.campaign_id_exacto,
          r.tipo,
          r.nombre_normalizado,
          r.activo ? "TRUE" : "FALSE",
          r.notas,
        ]),
      },
    });
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${MAPPING_TABS.historial}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            "seed_inicial",
            "(fallback.json)",
            `${rules.length} reglas sembradas`,
            "setup-mapping-sheet.ts",
          ],
        ],
      },
    });
    console.log(`✅ ${rules.length} reglas iniciales sembradas en Mapeo`);
  } else {
    console.log("↷ Hoja Mapeo ya tiene reglas; no se siembra nada.");
  }

  // Compartir con Juan como Editor.
  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      sendNotificationEmail: false,
      requestBody: { type: "user", role: "writer", emailAddress: SHARE_WITH },
    });
    console.log(`✅ Compartido como Editor con ${SHARE_WITH}`);
  } catch (err) {
    console.error(
      `⚠️  No se pudo compartir automáticamente con ${SHARE_WITH}: ` +
        (err instanceof Error ? err.message : String(err)),
    );
    console.error(
      "   Posible causa: Drive API deshabilitada en el proyecto cookminds-dashboards.\n" +
        "   Solución: habilitar Drive API en Google Cloud Console y volver a correr el script,\n" +
        "   o compartir manualmente desde la UI del Sheet.",
    );
  }

  console.log("\n──────────────────────────────────────────────");
  console.log(`Sheet ID: ${spreadsheetId}`);
  console.log(`URL:      https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
  console.log("Copiar a .env.local y Vercel:");
  console.log(`GOOGLE_SHEET_MAPEO_5GATOS_ID=${spreadsheetId}`);
}

main().catch((err) => {
  console.error("❌ setup-mapping-sheet falló:", err instanceof Error ? err.message : err);
  process.exit(1);
});
