/**
 * Agregación de filas DIARIAS (date_start === date_stop) por entidad dentro de
 * un rango [start, stop]. Devuelve una fila por entidad con los acumulados del
 * rango, recalculando métricas derivadas. Las filas de SNAPSHOT agregado
 * (date_start !== date_stop) se EXCLUYEN (no sirven para filtrar por fecha).
 */

const SUM_FIELDS = ["spend", "impressions", "reach", "clicks", "inline_link_clicks"];

export function isDailyRow(r: Record<string, string>): boolean {
  return Boolean(r.date_start) && r.date_start === r.date_stop;
}

/** Meses (YYYY-MM) con datos diarios disponibles. */
export function availableMonthsFrom(rows: Record<string, string>[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    if (isDailyRow(r)) set.add(r.date_start.slice(0, 7));
  }
  return [...set].sort();
}

export function aggregateDailyByEntity(
  rows: Record<string, string>[],
  idField: string,
  start: string,
  stop: string,
): Record<string, string>[] {
  const daily = rows.filter(
    (r) => isDailyRow(r) && r.date_start >= start && r.date_start <= stop,
  );
  const groups = new Map<string, Record<string, string>[]>();
  for (const r of daily) {
    const id = r[idField];
    if (!id) continue;
    const arr = groups.get(id) ?? [];
    arr.push(r);
    groups.set(id, arr);
  }

  const out: Record<string, string>[] = [];
  for (const rs of groups.values()) {
    const latest = rs.reduce((a, b) => (a.date_start >= b.date_start ? a : b));
    const agg: Record<string, string> = { ...latest };
    const sum = (f: string) => rs.reduce((a, r) => a + (Number(r[f]) || 0), 0);

    for (const f of SUM_FIELDS) agg[f] = String(sum(f));

    const hasRes = rs.some((r) => r.results !== "" && r.results != null);
    const resSum = rs.reduce((a, r) => a + (Number(r.results) || 0), 0);
    agg.results = hasRes ? String(resSum) : "";

    const spend = sum("spend");
    const imp = sum("impressions");
    const reach = sum("reach");
    const clicks = sum("clicks");

    agg.ctr = imp > 0 ? String((clicks / imp) * 100) : "0";
    agg.cpc = clicks > 0 ? String(spend / clicks) : "0";
    agg.cpm = imp > 0 ? String((spend / imp) * 1000) : "0";
    // Frecuencia: aproximación (suma de reach diario sobreestima alcance único).
    agg.frequency = reach > 0 ? String(imp / reach) : "0";
    agg.cost_per_result = hasRes && resSum > 0 ? String(spend / resSum) : "";

    agg.date_start = start;
    agg.date_stop = stop;
    out.push(agg);
  }
  return out;
}

/** Suma de gasto diario por account_group dentro del rango (para pacing). */
export function spendByAccountInRange(
  rows: Record<string, string>[],
  start: string,
  stop: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (!isDailyRow(r) || r.date_start < start || r.date_start > stop) continue;
    const k = r.account_group;
    if (!k) continue;
    out[k] = (out[k] ?? 0) + (Number(r.spend) || 0);
  }
  return out;
}
