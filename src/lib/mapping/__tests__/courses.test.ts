/**
 * Tests del motor de mapeo curso↔ADSET (5 Gatos Bucaramanga).
 * Corre sin red: inyecta reglas con el tercer parámetro de matchAdset.
 *
 *   npm run test:mapping
 */

import { strict as assert } from "node:assert";
import test from "node:test";
import { getFallbackRules, matchAdset, matchAdsetAgainstRules } from "../courses";
import type { MappingRule } from "../types";

const RULES: MappingRule[] = [
  {
    pattern_regex: "",
    adset_id_exacto: "120251920110490440",
    tipo: "Curso",
    nombre_normalizado: "New York Cookies (id fijo)",
    activo: true,
    notas: "",
    legacy_campaign: false,
  },
  {
    pattern_regex: "new\\s*york\\s*cookies",
    adset_id_exacto: "",
    tipo: "Curso",
    nombre_normalizado: "New York Cookies",
    activo: true,
    notas: "",
    legacy_campaign: false,
  },
  {
    pattern_regex: "triple\\s*titulaci[oó]n",
    adset_id_exacto: "",
    tipo: "Programa",
    nombre_normalizado: "Programa Triple Titulación",
    activo: true,
    notas: "",
    legacy_campaign: false,
  },
  {
    pattern_regex: "open\\s*house",
    adset_id_exacto: "",
    tipo: "Programa",
    nombre_normalizado: "Open House (inactiva)",
    activo: false,
    notas: "Regla apagada: no debe matchear",
    legacy_campaign: false,
  },
  {
    pattern_regex: "cursos?\\s*cortos?",
    adset_id_exacto: "",
    tipo: "Curso",
    nombre_normalizado: "Cursos Cortos (LEGACY campaña)",
    activo: true,
    notas: "Regla del modelo viejo: regexeaba nombres de campaña",
    legacy_campaign: true,
  },
];

test("match por adset_id_exacto gana sobre el regex", async () => {
  const m = await matchAdset(
    "BUC_CC_New York Cookies_Advantage",
    "120251920110490440",
    RULES,
  );
  assert.ok(m);
  assert.equal(m.nombre_normalizado, "New York Cookies (id fijo)");
  assert.equal(m.tipo, "Curso");
});

test("match por pattern_regex sobre adset_name (case-insensitive)", async () => {
  const m = await matchAdset("buc_cc_NEW YORK cookies_advantage", "999", RULES);
  assert.ok(m);
  assert.equal(m.tipo, "Curso");
  assert.equal(m.nombre_normalizado, "New York Cookies");

  const m2 = await matchAdset("BUC | Triple Titulación | Interés", "888", RULES);
  assert.ok(m2);
  assert.equal(m2.tipo, "Programa");
  assert.equal(m2.nombre_normalizado, "Programa Triple Titulación");
});

test("sin match → null (reglas inactivas y legacy_campaign se ignoran)", async () => {
  // Regla inactiva no matchea:
  const m = await matchAdset("Open House | Bucaramanga", "777", RULES);
  assert.equal(m, null);
  // Regla legacy_campaign=TRUE NO se aplica aunque el regex matchee:
  const m2 = await matchAdset("Cursos cortos | Panadería Dulce | BUC", "666", RULES);
  assert.equal(m2, null);
  // Adset sin patrón conocido:
  const m3 = await matchAdset("Tráfico al perfil | posicionamiento", "555", RULES);
  assert.equal(m3, null);
});

test("regex inválido en la hoja no rompe el matching", () => {
  const rules: MappingRule[] = [
    {
      pattern_regex: "([invalido",
      adset_id_exacto: "",
      tipo: "Curso",
      nombre_normalizado: "Roto",
      activo: true,
      notas: "",
      legacy_campaign: false,
    },
    ...RULES,
  ];
  const m = matchAdsetAgainstRules(rules, "BUC_CC_New York Cookies_Adv", "1");
  assert.ok(m);
  assert.equal(m.nombre_normalizado, "New York Cookies");
});

test("fallback.json trae reglas válidas y clasifica adsets reales", () => {
  const rules = getFallbackRules();
  assert.ok(rules.length >= 8);
  const curso = matchAdsetAgainstRules(rules, "BUC_CC_Cocina Asiática_Advantage", "1");
  assert.equal(curso?.tipo, "Curso");
  assert.equal(curso?.nombre_normalizado, "Cocina Asiática");
  const prog = matchAdsetAgainstRules(rules, "BUC | Pastelería y Panadería | Interés", "2");
  assert.equal(prog?.tipo, "Programa");
  assert.equal(prog?.nombre_normalizado, "Programa Pastelería y Panadería");
  const progCocina = matchAdsetAgainstRules(rules, "BUC | Cocina | Interés", "3");
  assert.equal(progCocina?.nombre_normalizado, "Programa Cocina");
  // Un curso específico de cocina NO debe caer en "Programa Cocina":
  const mex = matchAdsetAgainstRules(rules, "BUC_CC_COCINA_MEXICANA_JUN26", "4");
  assert.equal(mex?.nombre_normalizado, "Cocina Mexicana");
});
