/**
 * GET /api/5gatos/adsets?month=YYYY-MM
 *
 * JSON agregado a NIVEL ADSET para 5 Gatos · Bucaramanga:
 *   - totales del mes seleccionado
 *   - total lifetime de los adsets activos hoy
 *   - resumen por curso y por programa (suma spend lifetime y mes)
 *   - lista de adsets activos con todos sus campos
 *   - adsets sin clasificar
 *
 * Protegida por middleware (login Google + allowlist). SOLO lectura de Meta.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  currentMonthBogota,
  getFiveGatosMonth,
  isValidMonth,
} from "@/lib/fivegatos/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const monthParam = req.nextUrl.searchParams.get("month") ?? "";
  const month = isValidMonth(monthParam) ? monthParam : currentMonthBogota();

  const result = await getFiveGatosMonth(month);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Estamos actualizando los datos, vuelve en unos minutos." },
      { status: 503 },
    );
  }
  const d = result.data;

  return NextResponse.json({
    month: d.month,
    rango: { desde: d.dateStart, hasta: d.dateStop },
    actualizado: d.updatedAt,
    totales: {
      inversion_mes: d.kpis.inversion,
      leads_mes: d.kpis.leads,
      cpl_mes: d.kpis.cpl,
      adsets_activos: d.kpis.adsetsActivos,
      inversion_lifetime_activos: d.kpis.inversionLifetimeActivos,
    },
    resumen_cursos: d.cursos,
    resumen_programas: d.programas,
    adsets_activos: d.activos,
    sin_clasificar: d.sinClasificar,
  });
}
