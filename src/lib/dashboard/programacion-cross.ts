/**
 * Cruce PROGRAMACIÓN OFICIAL (Excel del cliente) ↔ ADSETS de Meta.
 * Genera las alertas de la sección "Alertas de programación" de /5gatos.
 *
 * ⚠️ NOTA DE UNIFICACIÓN: el tipo `AdsetActivo` de este módulo se definió en
 * paralelo al trabajo de migración campañas→adsets. Cuando ese trabajo cierre,
 * unificar con `AdsetStats` de src/lib/fivegatos/data.ts (los campos ya están
 * alineados: id, name, effective_status, spend, spend_lifetime, cpl,
 * start_time, end_time). Este módulo NO importa de allá a propósito para no
 * generar conflictos mientras ambos branches evolucionan.
 *
 * Uso previsto (server component / API route):
 *   const programacion = await readProgramacion();
 *   const alertas = await generarAlertas(adsetsActivos, programacion);
 */

import {
  readProgramacion,
  type Curso,
  type EstadoCurso,
} from "../sheets/programacion-gato-bga";

// ---------------------------------------------------------------------------
// Umbrales configurables
// ---------------------------------------------------------------------------

/** Días de anticipación mínimos: un curso POR ABRIR que inicia en menos de
 *  estos días ya debería tener pauta corriendo. */
export const DIAS_ANTICIPACION = 15;

/** Gasto (COP) a partir del cual "pocos inscritos" se vuelve alerta. */
export const UMBRAL_GASTO_BAJA_CONVERSION = 800_000;

/** Inscritos mínimos esperados para un curso ya iniciado. */
export const INSCRITOS_MINIMOS_ESPERADOS = 8;

/** Score mínimo de similitud (Jaro-Winkler) para dar match curso↔adset. */
export const FUZZY_THRESHOLD = 0.75;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/**
 * Shape mínimo del adset que consume este módulo.
 * spend_* en COP. `spend_month` = mes calendario actual, `spend_lifetime` =
 * histórico del adset. `cpl` = costo por lead del mes (null si 0 leads).
 */
export interface AdsetActivo {
  id: string;
  name: string;
  campaign_name: string;
  /** effective_status de Meta ("ACTIVE", "PAUSED", "CAMPAIGN_PAUSED", ...). */
  effective_status: string;
  spend_lifetime: number;
  spend_month: number;
  start_time: string | null;
  end_time: string | null;
  cpl: number | null;
}

export interface Alerta {
  severidad: "critica" | "atender" | "info";
  titulo: string;
  mensaje: string;
  curso: string | null;
  adset_id: string | null;
  /** Dinero en juego (COP) cuando aplica: gasto acumulado, etc. */
  valor_involucrado: number | null;
  accion_sugerida: string;
}

// ---------------------------------------------------------------------------
// Normalización + fuzzy matching curso↔adset
// ---------------------------------------------------------------------------

/** Siglas usadas por el cliente en Excel y en nombres de adset. */
export const SIGLAS_DIPLOMADOS: Record<string, string> = {
  gmbr: "gerencia y montaje de bares y restaurantes",
  tbc: "tecnicas basicas de cocina",
  tbcp: "tecnicas basicas de cocina pasteleria y panaderia",
  tbcpp: "tecnicas basicas de cocina pasteleria y panaderia",
};

const STOPWORDS = new Set([
  "curso", "cursos", "diplomado", "diplomados", "dip", "taller", "programa",
  "de", "del", "la", "las", "el", "los", "y", "e", "a", "al", "en", "con",
  "para", "por", "o", "u", "un", "una",
  // ruido típico de nombres de adset
  "5gatos", "gato", "gatos", "dumas", "bga", "bucaramanga", "leads", "lead",
  "conversiones", "ventas", "adv", "ads", "2025", "2026",
]);

function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza un nombre (de curso o de adset) para comparación:
 * minúsculas, sin acentos, sin puntuación, sin stopwords, siglas expandidas.
 */
export function normalizarParaMatch(nombre: string): string {
  const base = sinAcentos(String(nombre ?? "").toLowerCase())
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = base
    .split(" ")
    .map((t) => SIGLAS_DIPLOMADOS[t] ?? t)
    .join(" ")
    .split(" ")
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
  return tokens.join(" ");
}

/** Jaro-Winkler clásico (0..1). Implementación local, sin dependencias. */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const ventana = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const matchA = new Array<boolean>(a.length).fill(false);
  const matchB = new Array<boolean>(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const desde = Math.max(0, i - ventana);
    const hasta = Math.min(b.length - 1, i + ventana);
    for (let j = desde; j <= hasta; j++) {
      if (!matchB[j] && a[i] === b[j]) {
        matchA[i] = true;
        matchB[j] = true;
        matches++;
        break;
      }
    }
  }
  if (matches === 0) return 0;
  let k = 0;
  let transposiciones = 0;
  for (let i = 0; i < a.length; i++) {
    if (!matchA[i]) continue;
    while (!matchB[k]) k++;
    if (a[i] !== b[k]) transposiciones++;
    k++;
  }
  const jaro =
    (matches / a.length +
      matches / b.length +
      (matches - transposiciones / 2) / matches) /
    3;
  // Prefijo común (máx 4) — boost Winkler estándar p=0.1.
  let prefijo = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefijo++;
    else break;
  }
  return jaro + prefijo * 0.1 * (1 - jaro);
}

/**
 * Score de match curso↔adset combinando:
 *   1. Jaro-Winkler sobre los strings normalizados completos.
 *   2. Empate por palabra clave: si comparten un token significativo
 *      (≥5 letras, ej. "parrilla", "chocolateria"), score mínimo 0.8.
 */
export function scoreMatch(nombreCurso: string, nombreAdset: string): number {
  const c = normalizarParaMatch(nombreCurso);
  const a = normalizarParaMatch(nombreAdset);
  if (!c || !a) return 0;
  let score = jaroWinkler(c, a);
  // Contención total: "vinos" dentro de "vinos julio noche" → match fuerte.
  if (a.includes(c) || c.includes(a)) score = Math.max(score, 0.9);
  // Empate por token significativo tolerante a plural/typos:
  // "parrilla" ↔ "parrillas" cuenta como palabra compartida.
  const singular = (t: string) => t.replace(/(es|s)$/, "");
  const tokensCurso = c.split(" ").filter((t) => t.length >= 5);
  const tokensAdset = a.split(" ").filter((t) => t.length >= 5);
  const hayCompartido = tokensAdset.some((ta) =>
    tokensCurso.some(
      (tc) =>
        tc === ta ||
        singular(tc) === singular(ta) ||
        jaroWinkler(tc, ta) >= 0.9,
    ),
  );
  if (hayCompartido) score = Math.max(score, 0.8);
  return score;
}

/** Encuentra el mejor curso para un adset (o null si nadie pasa el umbral). */
export function mejorMatchCurso(
  adsetName: string,
  cursos: Curso[],
): { curso: Curso; score: number } | null {
  let mejor: { curso: Curso; score: number } | null = null;
  for (const curso of cursos) {
    const score = scoreMatch(curso.nombre_canonico, adsetName);
    if (score >= FUZZY_THRESHOLD && (!mejor || score > mejor.score)) {
      mejor = { curso, score };
    }
  }
  return mejor;
}

// ---------------------------------------------------------------------------
// Generación de alertas
// ---------------------------------------------------------------------------

const ESTADOS_VIVOS: EstadoCurso[] = ["POR_ABRIR", "INICIO"];
const ESTADOS_CERRADOS: EstadoCurso[] = [
  "FINALIZO",
  "DETENIDO",
  "CANCELADO",
  "SUSPENDIDO",
];

const fmtCOP = (n: number): string =>
  `$${Math.round(n).toLocaleString("es-CO")}`;

function hoyBogota(): Date {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
  }).format(new Date()); // YYYY-MM-DD
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diasHasta(fecha: Date, hoy: Date): number {
  return Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000);
}

/**
 * El Excel repite el mismo curso en varias secciones (activos + histórico).
 * Para alertas nos quedamos con el registro "vigente" por nombre: se prefiere
 * estado vivo (INICIO/POR_ABRIR) y, a igualdad, la fecha_inicio más reciente.
 */
export function dedupeCursosVigentes(programacion: Curso[]): Curso[] {
  const porNombre = new Map<string, Curso>();
  for (const c of programacion) {
    const clave = normalizarParaMatch(c.nombre_canonico) || c.nombre_canonico.toLowerCase();
    const actual = porNombre.get(clave);
    if (!actual) {
      porNombre.set(clave, c);
      continue;
    }
    const cVivo = ESTADOS_VIVOS.includes(c.estado);
    const actualVivo = ESTADOS_VIVOS.includes(actual.estado);
    if (cVivo && !actualVivo) {
      porNombre.set(clave, c);
    } else if (cVivo === actualVivo) {
      const tC = c.fecha_inicio?.getTime() ?? 0;
      const tA = actual.fecha_inicio?.getTime() ?? 0;
      if (tC > tA) porNombre.set(clave, c);
    }
  }
  return [...porNombre.values()];
}

/**
 * Cruza adsets ACTIVOS con la programación oficial y devuelve alertas
 * accionables ordenadas por severidad (critica → atender → info).
 *
 * Pura respecto a sus argumentos (no lee red): pásale los adsets ya
 * filtrados a effective_status=ACTIVE y la programación de readProgramacion().
 */
export async function generarAlertas(
  adsets: AdsetActivo[],
  programacion: Curso[],
): Promise<Alerta[]> {
  const alertas: Alerta[] = [];
  const hoy = hoyBogota();
  const activos = adsets.filter((a) => a.effective_status === "ACTIVE");
  const cursosVigentes = dedupeCursosVigentes(programacion);

  // Índice: cada adset activo → mejor curso vigente (o null).
  const matchPorAdset = new Map<string, Curso | null>();
  const adsetsPorCurso = new Map<string, AdsetActivo[]>();
  for (const adset of activos) {
    const match = mejorMatchCurso(adset.name, cursosVigentes);
    matchPorAdset.set(adset.id, match?.curso ?? null);
    if (match) {
      const clave = match.curso.nombre_canonico;
      adsetsPorCurso.set(clave, [...(adsetsPorCurso.get(clave) ?? []), adset]);
    }
  }

  for (const curso of cursosVigentes) {
    const adsetsDelCurso = adsetsPorCurso.get(curso.nombre_canonico) ?? [];
    const tienePauta = adsetsDelCurso.length > 0;

    // Regla 1 · Curso INICIO sin adset activo.
    if (curso.estado === "INICIO" && !tienePauta) {
      alertas.push({
        severidad: "atender",
        titulo: "Falta pauta activa",
        mensaje: `El curso "${curso.nombre_canonico}" figura INICIADO en la programación (${curso.fecha_texto || "sin fecha"}) y no tiene ningún adset activo en Meta.`,
        curso: curso.nombre_canonico,
        adset_id: null,
        valor_involucrado: null,
        accion_sugerida:
          "Confirmar con el cliente si aún hay cupos; si sí, activar/crear el adset del curso.",
      });
    }

    // Regla 2 · Curso POR ABRIR que inicia en <15 días sin adset activo.
    // Incluye el caso vencido: la fecha de inicio ya pasó y sigue POR ABRIR.
    if (curso.estado === "POR_ABRIR" && !tienePauta && curso.fecha_inicio) {
      const dias = diasHasta(curso.fecha_inicio, hoy);
      if (dias < 0) {
        alertas.push({
          severidad: "atender",
          titulo: "Inicio vencido y sigue POR ABRIR",
          mensaje: `"${curso.nombre_canonico}" debía abrir el ${curso.fecha_texto || curso.fecha_inicio.toLocaleDateString("es-CO")} (hace ${Math.abs(dias)} días), sigue POR ABRIR y no tiene adset activo.`,
          curso: curso.nombre_canonico,
          adset_id: null,
          valor_involucrado: curso.valor_completo || null,
          accion_sugerida:
            "Confirmar con el cliente si el curso se pospuso, se canceló o ya arrancó sin actualizar el Excel.",
        });
      } else if (dias < DIAS_ANTICIPACION) {
        alertas.push({
          severidad: "atender",
          titulo: `Faltan ${dias} día${dias === 1 ? "" : "s"} y sin pauta`,
          mensaje: `"${curso.nombre_canonico}" abre el ${curso.fecha_texto || curso.fecha_inicio.toLocaleDateString("es-CO")} (en ${dias} días) y no tiene adset activo. Ventana de captación crítica.`,
          curso: curso.nombre_canonico,
          adset_id: null,
          valor_involucrado: curso.valor_completo || null,
          accion_sugerida:
            "Lanzar pauta ya o pedir al cliente decisión de abrir/posponer el curso.",
        });
      }
    }

    // Regla 5 · Curso INICIO con pocos inscritos + gasto alto.
    if (curso.estado === "INICIO" && curso.inscritos < INSCRITOS_MINIMOS_ESPERADOS) {
      for (const adset of adsetsDelCurso) {
        const gasto = adset.spend_month > 0 ? adset.spend_month : adset.spend_lifetime;
        if (gasto > UMBRAL_GASTO_BAJA_CONVERSION) {
          alertas.push({
            severidad: "atender",
            titulo: "Alto gasto y baja conversión",
            mensaje: `"${curso.nombre_canonico}" lleva ${curso.inscritos} inscrito${curso.inscritos === 1 ? "" : "s"} (mínimo esperado: ${INSCRITOS_MINIMOS_ESPERADOS}) y el adset "${adset.name}" ya gastó ${fmtCOP(gasto)}${adset.cpl ? ` (CPL ${fmtCOP(adset.cpl)})` : ""}.`,
            curso: curso.nombre_canonico,
            adset_id: adset.id,
            valor_involucrado: gasto,
            accion_sugerida:
              "Evaluar creative y segmentación; revisar seguimiento comercial de los leads antes de subir presupuesto.",
          });
        }
      }
    }
  }

  // Reglas 3 y 4 · por adset.
  for (const adset of activos) {
    const curso = matchPorAdset.get(adset.id) ?? null;

    // Regla 4 · Adset activo que no matchea ningún curso.
    if (!curso) {
      alertas.push({
        severidad: "info",
        titulo: "Adset sin curso identificado",
        mensaje: `El adset activo "${adset.name}" (campaña "${adset.campaign_name}") no coincide con ningún curso de la programación oficial.`,
        curso: null,
        adset_id: adset.id,
        valor_involucrado: adset.spend_month || null,
        accion_sugerida:
          "Revisar el mapeo curso↔adset o confirmar con el cliente si es una campaña genérica/marca.",
      });
      continue;
    }

    // Regla 3 · Curso cerrado (FINALIZO/DETENIDO/CANCELADO/SUSPENDIDO) con
    // adset ACTIVO → plata quemándose.
    if (ESTADOS_CERRADOS.includes(curso.estado)) {
      const gasto = adset.spend_lifetime || adset.spend_month;
      alertas.push({
        severidad: "critica",
        titulo: "Adset debe pausarse ya",
        mensaje: `"${curso.nombre_canonico}" figura ${curso.estado.replace("_", " ")} en la programación, pero el adset "${adset.name}" sigue ACTIVO. Gasto acumulado: ${fmtCOP(gasto)}.`,
        curso: curso.nombre_canonico,
        adset_id: adset.id,
        valor_involucrado: gasto,
        accion_sugerida:
          "Pausar el adset en Meta hoy mismo y confirmar con el cliente el estado real del curso.",
      });
    }
  }

  const orden: Record<Alerta["severidad"], number> = {
    critica: 0,
    atender: 1,
    info: 2,
  };
  return alertas.sort((a, b) => orden[a.severidad] - orden[b.severidad]);
}

/**
 * Conveniencia para la UI: lee la programación (cacheada 30 min) y cruza.
 * Nunca lanza: si el Excel no es accesible devuelve una única alerta info
 * explicando el problema (el dashboard no debe caerse por el Sheet del cliente).
 */
export async function getAlertasProgramacion(
  adsets: AdsetActivo[],
): Promise<{ alertas: Alerta[]; programacionDisponible: boolean }> {
  try {
    const programacion = await readProgramacion();
    const alertas = await generarAlertas(adsets, programacion);
    return { alertas, programacionDisponible: true };
  } catch (err) {
    console.error(
      "[programacion-cross] No se pudo leer la programación:",
      err instanceof Error ? err.message : err,
    );
    return {
      alertas: [
        {
          severidad: "info",
          titulo: "Programación del cliente no disponible",
          mensaje:
            "No se pudo leer el Excel de programación de Gato BGA. Las alertas de cruce curso↔pauta están pausadas hasta restablecer el acceso.",
          curso: null,
          adset_id: null,
          valor_involucrado: null,
          accion_sugerida:
            "Verificar Drive API habilitada y el Excel compartido con el service account (docs/PROGRAMACION_GATO_BGA_INTEGRACION.md).",
        },
      ],
      programacionDisponible: false,
    };
  }
}
