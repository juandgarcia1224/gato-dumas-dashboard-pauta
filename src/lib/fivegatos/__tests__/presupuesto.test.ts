/**
 * Tests del cálculo de presupuesto planeado vs consumido (5 Gatos).
 * Corre sin red: funciones puras de presupuesto.ts.
 *
 *   npm run test:presupuesto
 */

import { strict as assert } from "node:assert";
import test from "node:test";
import {
  budgetOrNull,
  buildPresupuesto,
  diasInclusivos,
  fechaCreible,
  planeadoDe,
  rangoMes,
  rangoVida,
  semaforoPresupuesto,
  sumarPlaneados,
} from "../presupuesto";

// ── budgetOrNull: "0" de Meta es placeholder, no presupuesto ─────────────

test("budgetOrNull descarta 0, null y valores no finitos", () => {
  assert.equal(budgetOrNull(0), null);
  assert.equal(budgetOrNull(null), null);
  assert.equal(budgetOrNull(undefined), null);
  assert.equal(budgetOrNull(NaN), null);
  assert.equal(budgetOrNull(150000), 150000);
});

// ── fechaCreible: Meta reporta epoch 1969 en algunas campañas CBO ────────

test("fechaCreible descarta epoch y basura", () => {
  assert.equal(fechaCreible("1969-12-31T18:59:59-0500"), null);
  assert.equal(fechaCreible("no-fecha"), null);
  assert.equal(fechaCreible(null), null);
  assert.ok(fechaCreible("2026-06-23T14:54:29-0500") instanceof Date);
});

// ── días ─────────────────────────────────────────────────────────────────

test("diasInclusivos cuenta ambos extremos", () => {
  const a = new Date("2026-07-01T00:00:00Z");
  const b = new Date("2026-07-13T00:00:00Z");
  assert.equal(diasInclusivos(a, b), 13);
  assert.equal(diasInclusivos(a, a), 1);
  assert.equal(diasInclusivos(b, a), 0); // rango invertido
});

test("rangoVida usa el end programado como plan y hoy como transcurrido", () => {
  const hoy = new Date("2026-07-13T12:00:00Z");
  // Adset 2026-07-01 → 2026-07-31 (fin futuro): plan 31 días, corridos 13.
  const r = rangoVida("2026-07-01T00:00:00Z", "2026-07-31T00:00:00Z", hoy);
  assert.equal(r.diasPlan, 31);
  assert.equal(r.diasTranscurridos, 13);
  // Sin end (hasta que se pause): plan = días corridos.
  const r2 = rangoVida("2026-07-01T00:00:00Z", null, hoy);
  assert.equal(r2.diasPlan, 13);
  assert.equal(r2.diasTranscurridos, 13);
});

test("rangoMes recorta el schedule al mes seleccionado", () => {
  // Adset 23 jun → 15 jul, mes julio recortado a hoy (13 jul):
  // solapamiento 1–13 jul = 13 días.
  const r = rangoMes(
    "2026-06-23T14:40:09-0500",
    "2026-07-15T15:59:00-0500",
    "2026-07-01",
    "2026-07-13",
  );
  assert.equal(r.diasPlan, 13);
  // Adset que terminó antes del mes: 0 días.
  const r2 = rangoMes(
    "2026-05-01T00:00:00Z",
    "2026-05-30T00:00:00Z",
    "2026-07-01",
    "2026-07-13",
  );
  assert.equal(r2.diasPlan, 0);
});

// ── planeadoDe: lifetime manda; si no, daily × días ──────────────────────

test("planeadoDe prioriza lifetime_budget", () => {
  const p = planeadoDe({ lifetimeBudget: 450000, dailyBudget: 20000, diasPlan: 10 });
  assert.deepEqual(p, { planeado: 450000, fuente: "lifetime_budget" });
});

test("planeadoDe usa daily × días cuando no hay lifetime", () => {
  // Caso real: BUC | Cocina | Interés → daily 35.500, 13 días de julio.
  const p = planeadoDe({ lifetimeBudget: 0, dailyBudget: 35500, diasPlan: 13 });
  assert.deepEqual(p, { planeado: 461500, fuente: "daily_budget" });
});

test("planeadoDe sin budget → n/a", () => {
  const p = planeadoDe({ lifetimeBudget: null, dailyBudget: 0, diasPlan: 13 });
  assert.deepEqual(p, { planeado: null, fuente: "n/a" });
});

// ── semáforo: <70 verde · 70–90 ámbar · >90 rojo ─────────────────────────

test("semaforoPresupuesto respeta los cortes del cliente", () => {
  assert.equal(semaforoPresupuesto(69.9), "verde");
  assert.equal(semaforoPresupuesto(70), "ambar");
  assert.equal(semaforoPresupuesto(90), "ambar");
  assert.equal(semaforoPresupuesto(90.1), "rojo");
  assert.equal(semaforoPresupuesto(115), "rojo");
  assert.equal(semaforoPresupuesto(null), "na");
});

// ── buildPresupuesto: números finales ────────────────────────────────────

test("buildPresupuesto arma restante, porcentaje y ritmo", () => {
  const p = buildPresupuesto(2_500_000, "lifetime_budget", 1_720_000, 32);
  assert.equal(p.planeado, 2_500_000);
  assert.equal(p.consumido, 1_720_000);
  assert.equal(p.restante, 780_000);
  assert.equal(Math.round(p.porcentaje!), 69);
  assert.equal(Math.round(p.ritmoDiario!), 53_750);
  assert.equal(p.semaforo, "verde");
});

test("buildPresupuesto marca excedido (>100%) en rojo", () => {
  const p = buildPresupuesto(100_000, "lifetime_budget", 130_000, 10);
  assert.equal(p.restante, -30_000);
  assert.equal(p.semaforo, "rojo");
  assert.ok(p.porcentaje! > 100);
});

test("buildPresupuesto sin plan → fuente n/a, sin barra", () => {
  const p = buildPresupuesto(null, "n/a", 50_000, 5);
  assert.equal(p.planeado, null);
  assert.equal(p.restante, null);
  assert.equal(p.porcentaje, null);
  assert.equal(p.semaforo, "na");
  assert.equal(p.ritmoDiario, 10_000);
});

// ── sumarPlaneados: total de campaña sin CBO ─────────────────────────────

test("sumarPlaneados suma adsets y elige la fuente dominante", () => {
  const total = sumarPlaneados([
    { planeado: 450000, fuente: "lifetime_budget" },
    { planeado: 300000, fuente: "lifetime_budget" },
    { planeado: 150000, fuente: "lifetime_budget" },
    { planeado: null, fuente: "n/a" },
  ]);
  assert.deepEqual(total, { planeado: 900000, fuente: "lifetime_budget" });

  const daily = sumarPlaneados([
    { planeado: 461500, fuente: "daily_budget" },
    { planeado: 100000, fuente: "lifetime_budget" },
  ]);
  assert.equal(daily.planeado, 561500);
  assert.equal(daily.fuente, "daily_budget");

  assert.deepEqual(sumarPlaneados([{ planeado: null, fuente: "n/a" }]), {
    planeado: null,
    fuente: "n/a",
  });
});
