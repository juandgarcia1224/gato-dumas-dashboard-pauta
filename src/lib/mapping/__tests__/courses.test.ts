/**
 * Tests del motor de mapeo curso↔campaña (5 Gatos Bucaramanga).
 * Corre sin red: inyecta reglas con el tercer parámetro de matchCampaign.
 *
 *   npm run test:mapping
 */

import { strict as assert } from "node:assert";
import test from "node:test";
import { getFallbackRules, matchCampaign, matchCampaignAgainstRules } from "../courses";
import type { MappingRule } from "../types";

const RULES: MappingRule[] = [
  {
    pattern_regex: "",
    campaign_id_exacto: "120247544621630440",
    tipo: "Curso",
    nombre_normalizado: "Cursos Cortos BUC (id fijo)",
    activo: true,
    notas: "",
  },
  {
    pattern_regex: "cursos?\\s*cortos?",
    campaign_id_exacto: "",
    tipo: "Curso",
    nombre_normalizado: "Cursos Cortos",
    activo: true,
    notas: "",
  },
  {
    pattern_regex: "diplomado",
    campaign_id_exacto: "",
    tipo: "Programa",
    nombre_normalizado: "Diplomados",
    activo: true,
    notas: "",
  },
  {
    pattern_regex: "open\\s*house",
    campaign_id_exacto: "",
    tipo: "Programa",
    nombre_normalizado: "Open House (inactiva)",
    activo: false,
    notas: "Regla apagada: no debe matchear",
  },
];

test("match por campaign_id_exacto gana sobre el regex", async () => {
  const m = await matchCampaign(
    "Ventas | Cursos cortos | BUC 2026",
    "120247544621630440",
    RULES,
  );
  assert.ok(m);
  assert.equal(m.nombre_normalizado, "Cursos Cortos BUC (id fijo)");
  assert.equal(m.tipo, "Curso");
});

test("match por pattern_regex (case-insensitive, orden de la hoja)", async () => {
  const m = await matchCampaign(
    "GDC_Meta_ventas_CUSOS... Diplomado-Pasteleria",
    "999",
    RULES,
  );
  assert.ok(m);
  assert.equal(m.tipo, "Programa");
  assert.equal(m.nombre_normalizado, "Diplomados");

  const m2 = await matchCampaign("ventas | cursos CORTOS | enero", "888", RULES);
  assert.ok(m2);
  assert.equal(m2.nombre_normalizado, "Cursos Cortos");
});

test("sin match → null (y reglas inactivas se ignoran)", async () => {
  const m = await matchCampaign("Open House | Bucaramanga", "777", RULES);
  assert.equal(m, null);
  const m2 = await matchCampaign("Tráfico al perfil | posicionamiento", "666", RULES);
  assert.equal(m2, null);
});

test("regex inválido en la hoja no rompe el matching", () => {
  const rules: MappingRule[] = [
    {
      pattern_regex: "([invalido",
      campaign_id_exacto: "",
      tipo: "Curso",
      nombre_normalizado: "Roto",
      activo: true,
      notas: "",
    },
    ...RULES,
  ];
  const m = matchCampaignAgainstRules(rules, "Ventas | Cursos cortos | BUC", "1");
  assert.ok(m);
  assert.equal(m.nombre_normalizado, "Cursos Cortos");
});

test("fallback.json trae reglas válidas y clasifica nombres reales", () => {
  const rules = getFallbackRules();
  assert.ok(rules.length >= 5);
  const cursos = matchCampaignAgainstRules(rules, "Ventas | Cursos cortos | BUC 2026", "1");
  assert.equal(cursos?.tipo, "Curso");
  const prog = matchCampaignAgainstRules(rules, "Programas | BUC | Mayo 2026", "2");
  assert.equal(prog?.tipo, "Programa");
  const dipl = matchCampaignAgainstRules(rules, "GDC-BGA-Whatsapp-DiplomadoPasteleria", "3");
  assert.equal(dipl?.nombre_normalizado, "Diplomado Pastelería");
});
