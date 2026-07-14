/**
 * Tests de la info de pauta (feedback del cliente 5 Gatos):
 * fecha de inicio + días corridos + frecuencia de Meta.
 *
 * Correr: npm run test:pauta
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
  diasCorridos,
  fmtFrecuencia,
  frecuenciaCls,
} from "../constants";
import { frecuenciaDe } from "../data";

// ---------------------------------------------------------------------------
// frecuenciaDe — preferir Meta, fallback impresiones ÷ alcance
// ---------------------------------------------------------------------------

test("frecuenciaDe prefiere la frequency que reporta Meta", () => {
  assert.equal(frecuenciaDe(2.4, 10_000, 1_000), 2.4);
});

test("frecuenciaDe calcula impresiones ÷ alcance si Meta no la reporta", () => {
  assert.equal(frecuenciaDe(null, 10_000, 4_000), 2.5);
  assert.equal(frecuenciaDe(0, 9_000, 3_000), 3); // frequency "0" no es creíble
});

test("frecuenciaDe devuelve null sin entrega en el período", () => {
  assert.equal(frecuenciaDe(null, 0, 0), null);
  assert.equal(frecuenciaDe(null, 1_000, 0), null); // sin alcance no hay frecuencia
});

// ---------------------------------------------------------------------------
// fmtFrecuencia — 1 decimal es-CO
// ---------------------------------------------------------------------------

test("fmtFrecuencia formatea con 1 decimal (es-CO usa coma)", () => {
  assert.equal(fmtFrecuencia(2.44), "2,4");
  assert.equal(fmtFrecuencia(3), "3,0");
  assert.equal(fmtFrecuencia(null), "—");
  assert.equal(fmtFrecuencia(undefined), "—");
});

// ---------------------------------------------------------------------------
// frecuenciaCls — umbrales de saturación (>4 ámbar, >6 rojo)
// ---------------------------------------------------------------------------

test("frecuenciaCls es neutra hasta 4, ámbar >4 y roja >6", () => {
  assert.equal(frecuenciaCls(2.1), "");
  assert.equal(frecuenciaCls(4), "");
  assert.equal(frecuenciaCls(4.1), "text-amber-600 font-medium");
  assert.equal(frecuenciaCls(6), "text-amber-600 font-medium");
  assert.equal(frecuenciaCls(6.1), "text-red-600 font-medium");
  assert.equal(frecuenciaCls(null), "");
});

// ---------------------------------------------------------------------------
// diasCorridos — días desde el inicio de la pauta
// ---------------------------------------------------------------------------

test("diasCorridos cuenta días completos desde el inicio", () => {
  const hace29dias = new Date(Date.now() - 29.5 * 86_400_000).toISOString();
  assert.equal(diasCorridos(hace29dias), 29);
});

test("diasCorridos maneja fechas futuras y nulos", () => {
  const manana = new Date(Date.now() + 86_400_000).toISOString();
  assert.equal(diasCorridos(manana), 0); // nunca negativo
  assert.equal(diasCorridos(null), null);
  assert.equal(diasCorridos("no-es-fecha"), null);
});
