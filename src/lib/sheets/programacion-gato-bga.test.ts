/**
 * Tests del parser de la programación oficial Gato BGA.
 * Runner: node:test (mismo patrón que src/lib/mapping/__tests__).
 *
 * Correr:  npx tsx --test src/lib/sheets/programacion-gato-bga.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  normalizarNombreCurso,
  parseFechaRango,
  parseMoneda,
  parseConteo,
  normalizarEstado,
  parseWorkbook,
  ANIO_PROGRAMACION,
} from "./programacion-gato-bga";
import {
  normalizarParaMatch,
  scoreMatch,
  mejorMatchCurso,
  dedupeCursosVigentes,
  generarAlertas,
  type AdsetActivo,
} from "../dashboard/programacion-cross";

// ---------------------------------------------------------------------------
// normalizarNombreCurso — ejemplos REALES del Excel del cliente
// ---------------------------------------------------------------------------

describe("normalizarNombreCurso", () => {
  it("separa notas del staff pegadas a nombre en MAYÚSCULAS", () => {
    const r = normalizarNombreCurso(
      "COCINA PARA NIÑOS Es el mismo curso para jovenes, que cambio: Son 5 clases, las primeras 5 que teniamos, de 10:30 am a 1:00 pm, dirigido a niños de 7 a 15 años.",
    );
    assert.equal(r.canonico, "Cocina para Niños");
    assert.ok(r.notas?.startsWith("Es el mismo curso"));
  });

  it("separa notas que arrancan con 'Este tiene' de nombre mixto", () => {
    const r = normalizarNombreCurso(
      "Chocolatería Este tiene inicio el viernes 11 de Julio por necesidades internas nuestras, las siguientes 3 clases se dictan los días martes como se tiene planeado, espeamos completar por lo menos un cupo de 8 personas.",
    );
    assert.equal(r.canonico, "Chocolatería");
    assert.ok(r.notas?.startsWith("Este tiene inicio"));
  });

  it("nombre simple sin notas queda en Title Case y notas null", () => {
    const r = normalizarNombreCurso("Vinos ");
    assert.equal(r.canonico, "Vinos");
    assert.equal(r.notas, null);
  });

  it("diplomado largo sin notas se conserva completo", () => {
    const r = normalizarNombreCurso(
      "Diplomado Gerencia en montaje de Bares y Restaurantes ",
    );
    assert.equal(
      r.canonico,
      "Diplomado Gerencia en Montaje de Bares y Restaurantes",
    );
    assert.equal(r.notas, null);
  });

  it("salto de línea: primera línea es el nombre", () => {
    const r = normalizarNombreCurso("Cocina Italiana\nOJO cambia de aula");
    assert.equal(r.canonico, "Cocina Italiana");
    assert.ok(r.notas?.includes("OJO"));
  });
});

// ---------------------------------------------------------------------------
// parseFechaRango — formatos REALES observados
// ---------------------------------------------------------------------------

describe("parseFechaRango", () => {
  const casos: Array<[string, [number, number] | null, [number, number] | null]> = [
    ["7 al 11 de Julio", [7, 7], [7, 11]],
    ["2 al 23 de julio", [7, 2], [7, 23]],
    ["26 julio al 16 Agosto", [7, 26], [8, 16]],
    ["14 julio al 22 Septiembre", [7, 14], [9, 22]],
    ["Abril 21 al 23 de Junio", [4, 21], [6, 23]],
    ["9 MAR AL 4 MAYO", [3, 9], [5, 4]],
    ["31 ENERO A 21 FEBRERO", [1, 31], [2, 21]],
  ];

  for (const [texto, ini, fin] of casos) {
    it(`parsea "${texto}"`, () => {
      const r = parseFechaRango(texto);
      if (ini) {
        assert.ok(r.inicio, `inicio null para "${texto}"`);
        assert.equal(r.inicio.getFullYear(), ANIO_PROGRAMACION);
        assert.equal(r.inicio.getMonth() + 1, ini[0]);
        assert.equal(r.inicio.getDate(), ini[1]);
      }
      if (fin) {
        assert.ok(r.fin, `fin null para "${texto}"`);
        assert.equal(r.fin.getMonth() + 1, fin[0]);
        assert.equal(r.fin.getDate(), fin[1]);
      }
    });
  }

  it("fecha suelta con texto extra: '25 Septiembre Reposición Clase'", () => {
    const r = parseFechaRango("25 Septiembre Reposición Clase");
    assert.ok(r.inicio);
    assert.equal(r.inicio.getMonth() + 1, 9);
    assert.equal(r.inicio.getDate(), 25);
    assert.equal(r.fin, null);
  });

  it("año explícito distinto de 2026 (histórico 2015) → null", () => {
    const r = parseFechaRango("9 al 30 de Julio 2015");
    assert.equal(r.inicio, null);
    assert.equal(r.fin, null);
  });

  it("texto vacío o sin fecha → null", () => {
    assert.deepEqual(parseFechaRango(""), { inicio: null, fin: null });
    assert.deepEqual(parseFechaRango("POR DEFINIR"), { inicio: null, fin: null });
  });
});

// ---------------------------------------------------------------------------
// Estados y valores monetarios
// ---------------------------------------------------------------------------

describe("normalizarEstado", () => {
  it("'POR ABRIR' con espacio → POR_ABRIR", () => {
    assert.equal(normalizarEstado("POR ABRIR "), "POR_ABRIR");
  });
  it("INICIADO e INICIO → INICIO", () => {
    assert.equal(normalizarEstado("INICIADO "), "INICIO");
    assert.equal(normalizarEstado("INICIO"), "INICIO");
  });
  it("los 7 canónicos + fallback OTRO", () => {
    assert.equal(normalizarEstado("FINALIZO"), "FINALIZO");
    assert.equal(normalizarEstado("FINALIZÓ"), "FINALIZO");
    assert.equal(normalizarEstado("DETENIDO"), "DETENIDO");
    assert.equal(normalizarEstado("CANCELADO"), "CANCELADO");
    assert.equal(normalizarEstado("SUSPENDIDO"), "SUSPENDIDO");
    assert.equal(normalizarEstado("EN VEREMOS"), "OTRO");
    assert.equal(normalizarEstado(""), "OTRO");
  });
});

describe("parseMoneda / parseConteo", () => {
  it("' $460,000 ' → 460000 (comas como miles)", () => {
    assert.equal(parseMoneda(" $460,000 "), 460_000);
  });
  it("'$ 2.625.000' → 2625000 (puntos como miles)", () => {
    assert.equal(parseMoneda("$ 2.625.000"), 2_625_000);
  });
  it("' $- ' y vacío → null", () => {
    assert.equal(parseMoneda(" $- "), null);
    assert.equal(parseMoneda(""), null);
  });
  it("números nativos de Excel pasan directo", () => {
    assert.equal(parseMoneda(460000), 460_000);
  });
  it("conteos: '-' → 0, '5' → 5, 10 → 10", () => {
    assert.equal(parseConteo("-"), 0);
    assert.equal(parseConteo("5"), 5);
    assert.equal(parseConteo(10), 10);
  });
});

// ---------------------------------------------------------------------------
// parseWorkbook — fixture xlsx construido con filas REALES del Excel
// ---------------------------------------------------------------------------

function fixtureWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Hoja 1: bloque activo (header real) + histórico con facturación.
  const activos = [
    ["cursos cortos", "CURSO", "", "FECHA", "", "DIA", "HORARIO", "ESTADO", "", "GROUPON", "PAGOS", "INSCRITOS", "VALOR", "GRUPON 40% DTO", ""],
    ["", "COCINA PARA NIÑOS Es el mismo curso para jovenes, que cambio: Son 5 clases.", "", "7 al 11 de Julio", "", "Lunes a Viernes", "10:30 am a 1:00 pm", "POR ABRIR", "", "", "-", "", " $460,000 ", " $276,000 ", "OK"],
    ["", "Vinos", "", "2 al 23 de julio", "", "miercoles", "7:00 pm a 9:00 pm", "INICIO", "", "", "10", "", " $500,000 ", " $300,000 ", "OK"],
    ["", "Diplomado Alimentación Consciente", "", "14 julio al 13 Agosto", "", "Lunes y Miercoles", "7:30 pm a 9:30 pm", "POR ABRIR", "", "", "2", "", " $1,800,000 ", " $1,080,000 ", "DETENIDO"],
    ["", "NANCY", "", "", "", "", "", "", "", "", "", "", "", "", ""], // profesora → skip
    [],
    ["VALOR POR PERSONA", "CURSO", "CONTENIDO", "FECHA", "MES", "DIA", "HORARIO", "ESTADO", "AULA", "GROUPON", "PAGOS", "INSCRITOS", "Groupon", "Completo", "Total"],
    [" $460,000 ", "Cocina Italiana", "", "26 julio al 16 Agosto", "JULIO -AGOSTO", "Sabados", "10:30 am a 1:00 pm", "FINALIZO", "", "19", "1", "20", " $3,933,000 ", " $460,000 ", " $4,393,000 "],
    [" $480,000 ", "Curso de Cocina Italiana", "OK CONTENIDO", "31 ENERO A 21 FEBRERO", "ENERO", "SABADOS", "10:30 A 1:00 PM", "INICIADO", "IVAN", "3", "8", "11", " $360,000 ", " $5,280,000 ", " $5,640,000 "],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(activos), "Cursos cortos");

  // Hoja 2: sección histórica vieja → debe descartarse completa.
  const viejos = [
    ["cursos cortos 2015", "CURSO", "", "FECHA", "", "DIA", "HORARIO", "ESTADO"],
    ["", "Cocina Italiana", "", "9 al 30 de Julio", "", "jueves", "6 a 9 pm", "FINALIZO"],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(viejos), "Historico 2015");

  return wb;
}

describe("parseWorkbook", () => {
  const cursos = parseWorkbook(fixtureWorkbook());

  it("lee las filas de curso y descarta profesoras y basura", () => {
    const nombres = cursos.map((c) => c.nombre_canonico);
    assert.ok(nombres.includes("Cocina para Niños"));
    assert.ok(nombres.includes("Vinos"));
    assert.ok(!nombres.includes("Nancy"));
  });

  it("descarta secciones de años viejos (2015)", () => {
    assert.ok(!cursos.some((c) => c.hoja_origen === "Historico 2015"));
  });

  it("soporta múltiples secciones con header propio en la misma hoja", () => {
    const italiana = cursos.filter((c) =>
      c.nombre_canonico.includes("Cocina Italiana"),
    );
    assert.equal(italiana.length, 2); // FINALIZO + INICIADO
    const finalizada = italiana.find((c) => c.estado === "FINALIZO")!;
    assert.equal(finalizada.valor_completo, 460_000); // VALOR POR PERSONA
    assert.equal(finalizada.total_facturado, 4_393_000);
    assert.equal(finalizada.inscritos, 20);
    assert.equal(finalizada.groupon, 19); // conteo, no dinero
  });

  it("normaliza INICIADO → INICIO y parsea fechas del bloque activo", () => {
    const vinos = cursos.find((c) => c.nombre_canonico === "Vinos")!;
    assert.equal(vinos.estado, "INICIO");
    assert.equal(vinos.fecha_inicio?.getMonth(), 6); // julio
    assert.equal(vinos.fecha_inicio?.getDate(), 2);
    assert.equal(vinos.fecha_fin?.getDate(), 23);
    assert.equal(vinos.valor_completo, 500_000);
    assert.equal(vinos.valor_groupon, 300_000);
  });

  it("clasifica diplomados como Programa y anota marcas extra", () => {
    const dip = cursos.find((c) =>
      c.nombre_canonico.includes("Alimentación Consciente"),
    )!;
    assert.equal(dip.tipo, "Programa");
    assert.equal(dip.estado, "POR_ABRIR");
    assert.ok(dip.notas?.includes("DETENIDO")); // marca suelta en la fila
  });

  it("separa notas del nombre dentro del workbook", () => {
    const ninos = cursos.find((c) => c.nombre_canonico === "Cocina para Niños")!;
    assert.ok(ninos.notas?.includes("Es el mismo curso"));
    assert.equal(ninos.hoja_origen, "Cursos cortos");
  });
});

// ---------------------------------------------------------------------------
// Fuzzy match y alertas
// ---------------------------------------------------------------------------

describe("fuzzy match curso↔adset", () => {
  it("normaliza quitando stopwords y expandiendo siglas", () => {
    assert.equal(
      normalizarParaMatch("Diplomado GMBR"),
      "gerencia montaje bares restaurantes",
    );
    assert.equal(normalizarParaMatch("Curso de Vinos 2026"), "vinos");
  });

  it("matchea siglas contra nombre completo", () => {
    const s = scoreMatch(
      "Diplomado Gerencia en Montaje de Bares y Restaurantes",
      "GMBR Julio Leads",
    );
    assert.ok(s >= 0.75, `score ${s}`);
  });

  it("matchea por palabra clave compartida (parrilla)", () => {
    const s = scoreMatch("Carnes a la Parrilla", "Parrillas BGA Conversiones");
    assert.ok(s >= 0.75, `score ${s}`);
  });

  it("no matchea cursos sin relación", () => {
    const s = scoreMatch("Vinos", "Sushi Julio");
    assert.ok(s < 0.75, `score ${s}`);
  });
});

function cursoBase(over: Partial<import("./programacion-gato-bga").Curso>): import("./programacion-gato-bga").Curso {
  return {
    nombre_canonico: "Vinos",
    nombre_original: "Vinos",
    fecha_texto: "2 al 23 de julio",
    fecha_inicio: new Date(2026, 6, 2),
    fecha_fin: new Date(2026, 6, 23),
    mes: "JULIO",
    dia_semana: "miercoles",
    horario: "7:00 pm a 9:00 pm",
    estado: "INICIO",
    estado_original: "INICIO",
    aula: null,
    groupon: 0,
    pagos: 10,
    inscritos: 10,
    valor_completo: 500_000,
    valor_groupon: 300_000,
    total_facturado: null,
    tipo: "Curso",
    hoja_origen: "Cursos cortos",
    fila_hoja: 3,
    notas: null,
    ...over,
  };
}

function adsetBase(over: Partial<AdsetActivo>): AdsetActivo {
  return {
    id: "1",
    name: "Vinos Julio",
    campaign_name: "5Gatos BGA Cursos",
    effective_status: "ACTIVE",
    spend_lifetime: 1_000_000,
    spend_month: 400_000,
    start_time: "2026-06-20T00:00:00-0500",
    end_time: null,
    cpl: 25_000,
    ...over,
  };
}

describe("generarAlertas", () => {
  it("regla 3: curso FINALIZO con adset activo → crítica", async () => {
    const alertas = await generarAlertas(
      [adsetBase({ id: "a1", name: "CupCakes Agosto" })],
      [cursoBase({ nombre_canonico: "Cupcakes", estado: "FINALIZO" })],
    );
    const critica = alertas.find((a) => a.severidad === "critica");
    assert.ok(critica);
    assert.equal(critica.adset_id, "a1");
    assert.ok(critica.mensaje.includes("FINALIZO"));
  });

  it("regla 1: curso INICIO sin adset → atender", async () => {
    const alertas = await generarAlertas(
      [],
      [cursoBase({ nombre_canonico: "Sushi", estado: "INICIO" })],
    );
    assert.ok(
      alertas.some(
        (a) => a.severidad === "atender" && a.titulo === "Falta pauta activa",
      ),
    );
  });

  it("regla 4: adset sin curso → info", async () => {
    const alertas = await generarAlertas(
      [adsetBase({ id: "x", name: "Remarketing General Marca" })],
      [cursoBase({})],
    );
    assert.ok(
      alertas.some((a) => a.severidad === "info" && a.adset_id === "x"),
    );
  });

  it("regla 5: INICIO con pocos inscritos y gasto alto → atender", async () => {
    const alertas = await generarAlertas(
      [adsetBase({ id: "g", name: "Vinos Julio", spend_month: 900_000 })],
      [cursoBase({ inscritos: 3 })],
    );
    assert.ok(
      alertas.some(
        (a) => a.titulo === "Alto gasto y baja conversión" && a.adset_id === "g",
      ),
    );
  });

  it("regla 2 (vencido): POR_ABRIR con fecha ya pasada y sin pauta → atender", async () => {
    const alertas = await generarAlertas(
      [],
      [
        cursoBase({
          nombre_canonico: "Mediterranea",
          estado: "POR_ABRIR",
          fecha_inicio: new Date(2026, 0, 5), // enero, ya pasó
          fecha_texto: "5 al 26 de Enero",
        }),
      ],
    );
    assert.ok(
      alertas.some((a) => a.titulo === "Inicio vencido y sigue POR ABRIR"),
    );
  });

  it("dedupe: el registro histórico FINALIZO no pisa al vigente POR_ABRIR", () => {
    const vigentes = dedupeCursosVigentes([
      cursoBase({ estado: "FINALIZO", fila_hoja: 20 }),
      cursoBase({ estado: "POR_ABRIR", fila_hoja: 2 }),
    ]);
    assert.equal(vigentes.length, 1);
    assert.equal(vigentes[0].estado, "POR_ABRIR");
  });

  it("mejorMatchCurso devuelve null sin candidatos que pasen el umbral", () => {
    assert.equal(
      mejorMatchCurso("Remarketing Marca", [cursoBase({})]),
      null,
    );
  });
});
