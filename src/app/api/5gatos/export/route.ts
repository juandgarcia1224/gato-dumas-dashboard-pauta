/**
 * GET /api/5gatos/export?month=YYYY-MM
 * Genera el Excel mensual para 5 Gatos · Bucaramanga (NIVEL ADSET):
 *   Hoja 1: Resumen por Curso
 *   Hoja 2: Resumen por Programa
 *   Hoja 3: Adsets Detallados (activos hoy, con fechas y consumo lifetime)
 *   Hoja 4: Sin Clasificar (solo si hay)
 * Celdas de dinero con formato COP. Protegida por middleware (login Google).
 */

import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  currentMonthBogota,
  getFiveGatosMonth,
  isValidMonth,
  type AdsetStats,
  type GroupSummaryRow,
} from "@/lib/fivegatos/data";

export const dynamic = "force-dynamic";

const COP_Z = '"$" #,##0';

/** Aplica formato a columnas de una hoja: money (COP) o int. */
function formatColumns(
  ws: XLSX.WorkSheet,
  moneyCols: number[],
  intCols: number[] = [],
) {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    for (const c of moneyCols) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "number") cell.z = COP_Z;
    }
    for (const c of intCols) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "number") cell.z = "#,##0";
    }
  }
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function summarySheet(rows: GroupSummaryRow[], firstCol: string): XLSX.WorkSheet {
  const header = [
    firstCol,
    "Inversión mes (COP)",
    "Desde inicio (COP)",
    "Impresiones",
    "Clicks",
    "Leads",
    "CPL (COP)",
    "Adsets",
    "Adsets activos",
  ];
  const body = rows.map((r) => [
    r.nombre,
    r.inversion,
    r.inversionLifetime,
    r.impressions,
    r.clicks,
    r.leads,
    r.cpl ?? "",
    r.adsets,
    r.adsetsActivos,
  ]);
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0);
  const totalInv = rows.reduce((s, r) => s + r.inversion, 0);
  const total = [
    "TOTAL",
    totalInv,
    rows.reduce((s, r) => s + r.inversionLifetime, 0),
    rows.reduce((s, r) => s + r.impressions, 0),
    rows.reduce((s, r) => s + r.clicks, 0),
    totalLeads,
    totalLeads > 0 ? totalInv / totalLeads : "",
    rows.reduce((s, r) => s + r.adsets, 0),
    rows.reduce((s, r) => s + r.adsetsActivos, 0),
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, ...body, total]);
  ws["!cols"] = [
    { wch: 34 }, { wch: 17 }, { wch: 17 }, { wch: 14 },
    { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 14 },
  ];
  formatColumns(ws, [1, 2, 6], [3, 4, 5, 7, 8]);
  return ws;
}

function adsetsSheet(rows: AdsetStats[]): XLSX.WorkSheet {
  const header = [
    "Adset", "Campaña (contenedor)", "Curso/Programa", "Tipo", "Estado",
    "Inicio", "Fin planeado",
    "Consumo desde inicio (COP)", "Gasto mes (COP)",
    "Impresiones", "Clicks", "CTR %", "CPC (COP)", "CPM (COP)",
    "Leads (mes)", "CPL (COP)", "Semáforo CPL",
  ];
  const body = rows.map((a) => [
    a.adset_name,
    a.campaign_name,
    a.nombre_normalizado ?? "Sin clasificar",
    a.tipo ?? "",
    a.effective_status || a.status,
    fechaCorta(a.start_time),
    a.end_time ? fechaCorta(a.end_time) : "sin fecha fin",
    a.spend_lifetime,
    a.spend,
    a.impressions,
    a.clicks,
    a.ctr,
    a.cpc ?? "",
    a.cpm ?? "",
    a.leads,
    a.cpl ?? "",
    a.semaforo === "sin_datos" ? "sin leads" : a.semaforo,
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  ws["!cols"] = [
    { wch: 44 }, { wch: 34 }, { wch: 28 }, { wch: 10 }, { wch: 10 },
    { wch: 11 }, { wch: 12 },
    { wch: 20 }, { wch: 14 },
    { wch: 12 }, { wch: 9 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
    { wch: 11 }, { wch: 12 }, { wch: 12 },
  ];
  formatColumns(ws, [7, 8, 12, 13, 15], [9, 10, 14]);
  return ws;
}

export async function GET(req: NextRequest) {
  const monthParam = req.nextUrl.searchParams.get("month") ?? "";
  const month = isValidMonth(monthParam) ? monthParam : currentMonthBogota();

  const result = await getFiveGatosMonth(month);
  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          "Estamos actualizando los datos, vuelve en unos minutos.",
      },
      { status: 503 },
    );
  }
  const d = result.data;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet(d.cursos, "Curso"), "Resumen por Curso");
  XLSX.utils.book_append_sheet(wb, summarySheet(d.programas, "Programa"), "Resumen por Programa");
  XLSX.utils.book_append_sheet(
    wb,
    adsetsSheet(d.activos),
    "Adsets Detallados",
  );
  if (d.sinClasificar.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      adsetsSheet(d.sinClasificar),
      "Sin Clasificar",
    );
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx", compression: true }) as Buffer;
  const filename = `5Gatos_Bucaramanga_${month}.xlsx`;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
