/**
 * Crea/actualiza el Google Sheet `Mapeo_Cursos_5Gatos_Bucaramanga` (mapeo
 * curso↔ADSET del dashboard cliente 5 Gatos), siembra reglas iniciales desde
 * `src/lib/mapping/fallback.json` y lo comparte con Juan como Editor.
 *
 * Uso:
 *   npx tsx scripts/setup-mapping-sheet.ts
 *
 * Requiere en .env.local:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
 *   (y GOOGLE_SHEET_MAPEO_5GATOS_ID si el Sheet ya existe)
 *
 * IDEMPOTENTE + MIGRACIÓN campaña→adset (julio 2026):
 *   - Renombra el header `campaign_id_exacto` → `adset_id_exacto` (los
 *     valores de la columna se conservan).
 *   - Agrega la columna `legacy_campaign`; las filas que existían con el
 *     modelo viejo (regex sobre nombre de CAMPAÑA) se marcan TRUE para que
 *     el matcher las ignore hasta que Ruzmery las revise. NO se borra nada.
 *   - Siembra las reglas nuevas a nivel adset (fallback.json) que falten.
 *   - Reescribe el header de Sin_Clasificar al esquema adset (solo si la
 *     hoja está vacía; si tiene datos, los preserva y solo agrega columnas).
 *   - Crea/actualiza la hoja README con la documentación del esquema.
 */
import "./load-env";

import { google } from "googleapis";
import { getGoogleEnv } from "../src/lib/config/env";
import { getFallbackRules } from "../src/lib/mapping/courses";
import { MAPPING_HEADERS, MAPPING_TABS } from "../src/lib/mapping/types";

const SHEET_TITLE = "Mapeo_Cursos_5Gatos_Bucaramanga";
const SHARE_WITH = "juandgarcia1224@gmail.com";

const README_CONTENT: string[][] = [
  ["Mapeo curso↔ADSET · 5 Gatos Bucaramanga"],
  [""],
  ["MODELO (desde julio 2026): 1 adset = 1 curso o programa."],
  ["El nombre del adset lleva el nombre del curso. Las campañas de Meta son"],
  ["solo contenedores (ej: 'Conversiones Julio' con 5 adsets, uno por curso)."],
  ["El dashboard /5gatos clasifica ADSETS, no campañas."],
  [""],
  ["Hoja 'Mapeo' — columnas:"],
  ["  pattern_regex      → regex (case-insensitive) contra el NOMBRE DEL ADSET."],
  ["  adset_id_exacto    → match exacto por id de adset de Meta. Gana sobre el regex."],
  ["  tipo               → Curso | Programa."],
  ["  nombre_normalizado → nombre que se muestra en el dashboard y el Excel."],
  ["  activo             → TRUE para aplicar la regla; FALSE la apaga sin borrarla."],
  ["  notas              → libre (ejemplos de nombres que cubre)."],
  ["  legacy_campaign    → TRUE = regla del modelo viejo (regexeaba nombres de"],
  ["                       CAMPAÑA). El matcher la IGNORA. Revisar y convertir:"],
  ["                       si el patrón también aplica al nombre del adset,"],
  ["                       cambiar legacy_campaign a FALSE; si no, dejar TRUE."],
  [""],
  ["Orden importa: la primera regla que matchea gana. Reglas específicas"],
  ["(ej. 'Cocina Asiática') van ANTES que comodines (ej. 'Programa Cocina')."],
  [""],
  ["Hoja 'Sin_Clasificar': el dashboard registra aquí (máx. 1 vez/día por"],
  ["adset) los adsets con gasto que ninguna regla clasifica. Para corregir:"],
  ["agregar una fila en 'Mapeo' con el patrón o el adset_id y activo=TRUE."],
  [""],
  ["Mantenimiento: Ruzmery. Dudas: Juan (juandgarcia1224@gmail.com)."],
];

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
    const sinClasificarGid = (meta.data.sheets ?? []).find(
      (s) => s.properties?.title === MAPPING_TABS.sinClasificar,
    )?.properties?.sheetId;
    if (sinClasificarGid !== undefined && sinClasificarGid !== null) {
      console.log(`  gid de Sin_Clasificar: ${sinClasificarGid} (SIN_CLASIFICAR_GID en src/lib/mapping/types.ts)`);
    }
  }

  // ── MIGRACIÓN campaña→adset en la hoja Mapeo ──────────────────────────
  const historyEntries: string[][] = [];
  const mapeoRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${MAPPING_TABS.mapeo}!A1:G`,
  });
  const mapeoValues = (mapeoRes.data.values ?? []) as string[][];
  const oldHeader = mapeoValues[0] ?? [];
  const dataRows = mapeoValues.slice(1);
  const hadOldSchema = oldHeader[1] === "campaign_id_exacto";
  const hadLegacyCol = oldHeader[6] === "legacy_campaign";

  if (hadOldSchema && !hadLegacyCol && dataRows.length > 0) {
    // Primera migración: marcar TODAS las filas existentes como legacy
    // (eran reglas sobre nombres de CAMPAÑA). No se borra nada.
    const legacyMarks = dataRows.map((row, i) => {
      const notas = String(row[5] ?? "");
      const suffix = " [LEGACY: regla del modelo campaña, revisar para adsets]";
      return {
        range: `${MAPPING_TABS.mapeo}!F${i + 2}:G${i + 2}`,
        values: [[notas.includes("[LEGACY") ? notas : notas + suffix, "TRUE"]],
      };
    });
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "RAW", data: legacyMarks },
    });
    console.log(`✅ Migración: ${dataRows.length} reglas viejas marcadas legacy_campaign=TRUE`);
    historyEntries.push([
      new Date().toISOString(),
      "migracion_adset",
      "(header campaign_id_exacto → adset_id_exacto)",
      `${dataRows.length} reglas de campaña marcadas legacy_campaign=TRUE`,
      "setup-mapping-sheet.ts",
    ]);
  }

  // Headers (idempotente: fija la fila 1 de cada hoja de datos).
  // Esto también renombra campaign_id_exacto → adset_id_exacto en Mapeo.
  const dataTabs = [MAPPING_TABS.mapeo, MAPPING_TABS.historial, MAPPING_TABS.sinClasificar];
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: dataTabs.map((tab) => ({
        range: `${tab}!A1`,
        values: [MAPPING_HEADERS[tab]],
      })),
    },
  });
  console.log("✅ Headers (esquema adset) escritos en Mapeo / Historial / Sin_Clasificar");

  // README (se reescribe completo: es documentación, no datos).
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${MAPPING_TABS.readme}!A1:Z`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${MAPPING_TABS.readme}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: README_CONTENT },
  });
  console.log("✅ Hoja README actualizada (esquema adset documentado)");

  // ── Sembrar reglas adset que falten (no pisa filas de Ruzmery) ─────────
  const currentRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${MAPPING_TABS.mapeo}!A2:G`,
  });
  const currentRows = (currentRes.data.values ?? []) as string[][];
  // Solo cuentan como "presentes" las reglas vigentes (no legacy): una regla
  // legacy con el mismo patrón NO reemplaza a su versión adset.
  const existingPatterns = new Set(
    currentRows
      .filter((r) => String(r[6] ?? "").trim().toUpperCase() !== "TRUE")
      .map((r) => `${String(r[0] ?? "").trim()}§${String(r[3] ?? "").trim()}`),
  );
  const seeds = getFallbackRules().filter(
    (r) => !existingPatterns.has(`${r.pattern_regex}§${r.nombre_normalizado}`),
  );
  if (seeds.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${MAPPING_TABS.mapeo}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: seeds.map((r) => [
          r.pattern_regex,
          r.adset_id_exacto,
          r.tipo,
          r.nombre_normalizado,
          r.activo ? "TRUE" : "FALSE",
          r.notas,
          r.legacy_campaign ? "TRUE" : "FALSE",
        ]),
      },
    });
    console.log(`✅ ${seeds.length} reglas adset sembradas en Mapeo`);
    historyEntries.push([
      new Date().toISOString(),
      "seed_adsets",
      "(fallback.json nivel adset)",
      `${seeds.length} reglas adset sembradas`,
      "setup-mapping-sheet.ts",
    ]);
  } else {
    console.log("↷ Reglas adset ya presentes; no se siembra nada.");
  }

  if (historyEntries.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${MAPPING_TABS.historial}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: historyEntries },
    });
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
