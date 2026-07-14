/**
 * Lectura de la PROGRAMACIÓN OFICIAL de cursos · Gato Dumas Bucaramanga.
 *
 * Fuente: Excel del cliente "PROGRAMAC CURSOS CORTOS Y DIP 2026 BGA.xlsx"
 * (owner: ramaya@gatodumas.com), compartido con el service account como Lector.
 * Env: GOOGLE_SHEET_PROGRAMACION_GATO_BGA_ID.
 *
 * ⚠️ El archivo es un .xlsx REAL (Office), NO un Google Sheet nativo:
 *   - `spreadsheets.values.get` devuelve 400 ("must not be an Office file").
 *   - `files.export` de Drive solo aplica a archivos nativos de Google.
 *   → Ruta correcta: Drive API `files.get?alt=media` (descarga los bytes)
 *     y parseo local con SheetJS (`xlsx`, ya es dependencia del repo).
 *
 * Requisitos de acceso (ver docs/PROGRAMACION_GATO_BGA_INTEGRACION.md):
 *   1. API "Google Drive" habilitada en el proyecto GCP del service account.
 *   2. El archivo compartido como Lector con GOOGLE_SERVICE_ACCOUNT_EMAIL.
 *
 * El Excel es "de humanos": celdas merged, notas del staff pegadas al nombre
 * del curso, nombres de profesoras sueltos, secciones históricas (2015/2024)
 * y varios bloques con su propio header dentro de una misma hoja. Todo el
 * parseo de acá es tolerante y explícito sobre lo que descarta.
 */

import { unstable_cache } from "next/cache";
import { google } from "googleapis";
import * as XLSX from "xlsx";
import { getGoogleEnv } from "../config/env";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Estados canónicos observados en el Excel (7 + fallback OTRO). */
export type EstadoCurso =
  | "POR_ABRIR"
  | "INICIO"
  | "FINALIZO"
  | "DETENIDO"
  | "CANCELADO"
  | "SUSPENDIDO"
  | "OTRO";

export interface Curso {
  /** Nombre limpio y en Title Case, sin notas del staff. Ej: "Cocina para Niños". */
  nombre_canonico: string;
  /** Celda original tal cual vino del Excel (auditoría). */
  nombre_original: string;
  /** Texto crudo de la columna FECHA. Ej: "26 julio al 16 Agosto". */
  fecha_texto: string;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  mes: string;
  dia_semana: string;
  horario: string;
  estado: EstadoCurso;
  /** Valor original de la columna ESTADO (auditoría). */
  estado_original: string;
  aula: string | null;
  /** Nº de inscritos vía Groupon (conteo, no dinero). */
  groupon: number;
  /** Nº de inscritos con pago directo. */
  pagos: number;
  /** Total inscritos según el Excel. */
  inscritos: number;
  /** Precio por persona tarifa completa (COP). */
  valor_completo: number;
  /** Precio por persona con descuento Groupon (COP), si la sección lo trae. */
  valor_groupon: number | null;
  /** Facturación total del curso (COP), solo en secciones históricas. */
  total_facturado: number | null;
  tipo: "Curso" | "Programa";
  hoja_origen: string;
  /** Fila 1-based dentro de la hoja (para ubicarla en el Excel). */
  fila_hoja: number;
  /** Notas del staff que venían pegadas al nombre u observaciones de parseo. */
  notas: string | null;
}

// ---------------------------------------------------------------------------
// Constantes / helpers de normalización
// ---------------------------------------------------------------------------

const CACHE_SECONDS = 30 * 60; // 30 minutos
const DOWNLOAD_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

/** Año asumido para fechas sin año explícito (programación 2026). */
export const ANIO_PROGRAMACION = 2026;

function getProgramacionFileId(): string | null {
  const v = process.env.GOOGLE_SHEET_PROGRAMACION_GATO_BGA_ID;
  return v && v.trim().length > 0 ? v.trim() : null;
}

function sinAcentos(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function limpiar(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

/** Clave de header normalizada: minúsculas, sin acentos, sin espacios extra. */
function claveHeader(s: unknown): string {
  return sinAcentos(limpiar(s).toLowerCase());
}

const MESES: Record<string, number> = {
  enero: 1, ene: 1,
  febrero: 2, feb: 2,
  marzo: 3, mar: 3,
  abril: 4, abr: 4,
  mayo: 5, may: 5,
  junio: 6, jun: 6,
  julio: 7, jul: 7,
  agosto: 8, ago: 8,
  septiembre: 9, setiembre: 9, sept: 9, sep: 9, set: 9,
  octubre: 10, oct: 10,
  noviembre: 11, nov: 11,
  diciembre: 12, dic: 12,
};

// ---------------------------------------------------------------------------
// Parseo de valores sueltos (exportados para tests)
// ---------------------------------------------------------------------------

/**
 * Dinero COP tolerante: " $460,000 " → 460000 · "$ 2.625.000" → 2625000 ·
 * " $- " / "" / "-" → null. En COP no hay decimales: se quitan todos los
 * símbolos y separadores y quedan solo dígitos.
 */
export function parseMoneda(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : null;
  const s = limpiar(v);
  if (!s || /^\$?\s*-\s*$/.test(s)) return null;
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  return Number(digits);
}

/** Conteos tolerantes: "5" → 5 · "-" / "" → 0. */
export function parseConteo(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : 0;
  const s = limpiar(v).replace(/[^\d]/g, "");
  return s ? Number(s) : 0;
}

/**
 * Normaliza la columna ESTADO a los estados canónicos.
 * "POR ABRIR" → POR_ABRIR · "INICIADO"/"INICIO" → INICIO · "FINALIZÓ" → FINALIZO.
 */
export function normalizarEstado(v: unknown): EstadoCurso {
  const s = sinAcentos(limpiar(v).toUpperCase());
  if (!s) return "OTRO";
  if (/^POR\s*ABRIR/.test(s)) return "POR_ABRIR";
  if (/^INICI/.test(s)) return "INICIO"; // INICIO / INICIADO / INICIA
  if (/^FINALIZ/.test(s)) return "FINALIZO";
  if (/^DETENID/.test(s)) return "DETENIDO";
  if (/^CANCELAD/.test(s)) return "CANCELADO";
  if (/^SUSPENDID/.test(s)) return "SUSPENDIDO";
  return "OTRO";
}

/** ¿El texto es exactamente un estado conocido? (para detectar marcas sueltas). */
function esEstadoConocido(v: unknown): boolean {
  const e = normalizarEstado(v);
  return e !== "OTRO" && limpiar(v).length <= 12;
}

/**
 * Separa el nombre canónico del curso de las notas del staff que a veces
 * vienen pegadas en la misma celda.
 *
 * Ejemplos reales:
 *   "COCINA PARA NIÑOS Es el mismo curso para jovenes, que cambio: ..."
 *     → canonico "Cocina para Niños", notas "Es el mismo curso..."
 *   "Chocolatería Este tiene inicio el viernes 11 de Julio ..."
 *     → canonico "Chocolatería", notas "Este tiene inicio..."
 *
 * Estrategia (en orden):
 *   1. Si hay saltos de línea: primera línea = nombre, resto = notas.
 *   2. Corte por keyword de inicio de nota ("Es el", "Este tiene", ...).
 *   3. Transición MAYÚSCULAS→Mixto: "COCINA PARA NIÑOS Es el..." corta donde
 *      termina la racha de palabras en mayúscula sostenida.
 */
export function normalizarNombreCurso(cell: string): {
  canonico: string;
  notas: string | null;
} {
  const bruto = String(cell ?? "").trim();
  if (!bruto) return { canonico: "", notas: null };

  let nombre = bruto;
  let notas: string | null = null;

  // 1) Saltos de línea: la primera línea manda.
  const nl = bruto.search(/[\n\r]/);
  if (nl > 0) {
    nombre = bruto.slice(0, nl).trim();
    notas = limpiar(bruto.slice(nl));
  } else {
    // 2) Keywords típicos con los que el staff arranca una nota.
    const KEYWORDS =
      /\s(Es el|Es la|Es un|Es una|Este tiene|Este curso|Esta clase|Se dicta|Se abre|Se cambia|Inicia el|OJO|Nota:?|Pendiente|Reposici[oó]n)\b/;
    const m = bruto.match(KEYWORDS);
    if (m && m.index !== undefined && m.index > 2) {
      nombre = bruto.slice(0, m.index).trim();
      notas = bruto.slice(m.index).trim();
    } else {
      // 3) Racha inicial en MAYÚSCULAS seguida de texto mixto largo.
      const mm = bruto.match(/^([A-ZÁÉÍÓÚÑÜ0-9][A-ZÁÉÍÓÚÑÜ0-9\s.,&-]{3,}?)\s+(?=[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü])/);
      if (mm && bruto.length - mm[1].length > 25) {
        nombre = mm[1].trim();
        notas = bruto.slice(mm[1].length).trim();
      }
    }
  }

  // Limpieza final del nombre + Title Case respetando conectores.
  nombre = limpiar(nombre).replace(/[,;:]+$/, "");
  return { canonico: aTitleCase(nombre), notas: notas || null };
}

const PALABRAS_MENORES = new Set([
  "de", "del", "la", "las", "el", "los", "y", "e", "a", "al", "en", "con",
  "para", "por", "o", "u",
]);

/** Title Case es-CO: "COCINA PARA NIÑOS" → "Cocina para Niños". */
export function aTitleCase(s: string): string {
  const palabras = limpiar(s).toLowerCase().split(" ");
  return palabras
    .map((p, i) => {
      if (i > 0 && PALABRAS_MENORES.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(" ");
}

/**
 * Convierte un rango de fechas en texto libre a Dates (año 2026 asumido).
 *
 * Formatos reales cubiertos:
 *   "7 al 11 de Julio" · "2 al 23 de julio" · "26 julio al 16 Agosto"
 *   "14 julio al 22 Septiembre" · "Abril 21 al 23 de Junio"
 *   "9 MAR AL 4 MAYO" · "31 ENERO A 21 FEBRERO" · "25 Septiembre" (solo inicio)
 */
export function parseFechaRango(texto: string): {
  inicio: Date | null;
  fin: Date | null;
} {
  const limpio = sinAcentos(limpiar(texto).toLowerCase())
    .replace(/[–—-]/g, " ")
    .replace(/\bde\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpio) return { inicio: null, fin: null };

  // Si el texto trae un año explícito distinto de 2026 → sección vieja, null.
  const anioExpl = limpio.match(/\b(20\d{2})\b/);
  if (anioExpl && Number(anioExpl[1]) !== ANIO_PROGRAMACION) {
    return { inicio: null, fin: null };
  }

  // Partir por el separador de rango: " al " o " a " (con AL en mayúscula ya bajado).
  const partes = limpio.split(/\s+al?\s+/);

  const izq = extraerDiaMes(partes[0] ?? "");
  const der = partes.length > 1 ? extraerDiaMes(partes.slice(1).join(" ")) : null;

  // "7 al 11 de Julio": la izquierda no trae mes → hereda el de la derecha.
  const mesIzq = izq.mes ?? der?.mes ?? null;
  const mesDer = der ? (der.mes ?? mesIzq) : null;

  const inicio =
    izq.dia !== null && mesIzq !== null
      ? new Date(ANIO_PROGRAMACION, mesIzq - 1, izq.dia)
      : null;
  const fin =
    der && der.dia !== null && mesDer !== null
      ? new Date(ANIO_PROGRAMACION, mesDer - 1, der.dia)
      : null;

  // Sanidad: si fin < inicio el texto era ambiguo → conservar solo inicio.
  if (inicio && fin && fin.getTime() < inicio.getTime()) {
    return { inicio, fin: null };
  }
  return { inicio, fin };
}

/** Extrae {dia, mes} de un fragmento tipo "26 julio", "abril 21", "9 mar". */
function extraerDiaMes(frag: string): { dia: number | null; mes: number | null } {
  const tokens = frag.split(/[\s,.]+/).filter(Boolean);
  let dia: number | null = null;
  let mes: number | null = null;
  for (const t of tokens) {
    if (/^\d{1,2}$/.test(t) && dia === null) {
      const n = Number(t);
      if (n >= 1 && n <= 31) dia = n;
      continue;
    }
    if (mes === null && MESES[t] !== undefined) {
      mes = MESES[t];
    }
  }
  return { dia, mes };
}

// ---------------------------------------------------------------------------
// Parseo del workbook (puro, testeable sin red)
// ---------------------------------------------------------------------------

interface MapaColumnas {
  nombre: number;
  fecha: number | null;
  mes: number | null;
  dia: number | null;
  horario: number | null;
  estado: number | null;
  aula: number | null;
  groupon: number | null; // conteo
  pagos: number | null;
  inscritos: number | null;
  valorCompleto: number | null; // precio por persona
  valorGroupon: number | null; // precio por persona con dto
  total: number | null; // facturación total (histórico)
}

/** ¿Esta fila es un header de sección? (trae "CURSO" + FECHA/ESTADO). */
function detectarHeader(row: unknown[]): MapaColumnas | null {
  const claves = row.map(claveHeader);
  const iCurso = claves.findIndex((c) => c === "curso");
  if (iCurso < 0) return null;
  const tieneFecha = claves.some((c) => c.startsWith("fecha"));
  const tieneEstado = claves.some((c) => c === "estado");
  if (!tieneFecha && !tieneEstado) return null;

  const buscar = (pred: (c: string, i: number) => boolean): number | null => {
    const i = claves.findIndex(pred);
    return i >= 0 ? i : null;
  };
  const iInscritos = buscar((c) => c === "inscritos");

  return {
    nombre: iCurso,
    fecha: buscar((c) => c.startsWith("fecha")),
    mes: buscar((c) => c === "mes"),
    dia: buscar((c) => c === "dia"),
    horario: buscar((c) => c === "horario"),
    estado: buscar((c) => c === "estado"),
    aula: buscar((c) => c === "aula"),
    // "GROUPON" antes de INSCRITOS = conteo de cupos por groupon.
    groupon: buscar((c, i) => c === "groupon" && (iInscritos === null || i < iInscritos)),
    pagos: buscar((c) => c === "pagos"),
    inscritos: iInscritos,
    // Precio por persona: "VALOR" (bloque activo) o "VALOR POR PERSONA"
    // (bloque histórico) o "Completo" del histórico NO (ese es facturación).
    valorCompleto: buscar((c) => c === "valor" || c === "valor por persona"),
    // "GRUPON 40% DTO" / "GROUPON 40% DTO" — precio con descuento.
    valorGroupon: buscar((c) => /gr[ou]pon\s*40/.test(c)),
    total: buscar((c) => c === "total"),
  };
}

/**
 * ¿La fila es basura conocida? Nombres de profesoras sueltos ("NANCY"),
 * listas de precios ("FORMULARIO DE INSCRIPCIÓN"), etc.
 * Regla: sin fecha NI estado NI horario → no es una fila de programación.
 */
function esFilaDescartable(
  nombre: string,
  fechaTexto: string,
  estadoTexto: string,
  horario: string,
): boolean {
  if (!nombre) return true;
  if (!fechaTexto && !estadoTexto && !horario) return true;
  // Una sola palabra en MAYÚSCULAS sin fecha → nombre de profesora.
  if (
    !fechaTexto &&
    /^[A-ZÁÉÍÓÚÑÜ]+$/.test(nombre.trim()) &&
    !nombre.includes(" ")
  ) {
    return true;
  }
  return false;
}

/** Título de sección: celdas del header antes de la columna CURSO. */
function tituloDeSeccion(row: unknown[], colCurso: number): string {
  return row
    .slice(0, colCurso)
    .map(limpiar)
    .filter(Boolean)
    .join(" ")
    .trim();
}

/** ¿La sección es histórico viejo? ("cursos cortos 2015", años ≠ 2026). */
function esSeccionAntigua(titulo: string): boolean {
  const m = titulo.match(/\b(20\d{2})\b/);
  return m !== null && Number(m[1]) !== ANIO_PROGRAMACION;
}

/**
 * Parsea un workbook completo (todas las hojas, todas las secciones).
 * Puro: no toca red ni env. Es lo que testeamos.
 */
export function parseWorkbook(wb: XLSX.WorkBook): Curso[] {
  const cursos: Curso[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    });

    let mapa: MapaColumnas | null = null;
    let seccionAntigua = false;
    let tituloPendiente = "";

    rows.forEach((row, idx) => {
      const header = detectarHeader(row);
      if (header) {
        mapa = header;
        const tituloInline = tituloDeSeccion(row, header.nombre);
        const titulo = tituloInline || tituloPendiente;
        seccionAntigua = esSeccionAntigua(titulo);
        tituloPendiente = "";
        return;
      }

      // Fila corta sin mapa activo puede ser un título de sección suelto.
      const celdasNoVacias = row.map(limpiar).filter(Boolean);
      if (!mapa || celdasNoVacias.length === 0) {
        if (celdasNoVacias.length > 0 && celdasNoVacias.length <= 2) {
          tituloPendiente = celdasNoVacias.join(" ");
        }
        return;
      }
      if (seccionAntigua) return;

      const m: MapaColumnas = mapa;
      const celda = (i: number | null): unknown =>
        i !== null && i < row.length ? row[i] : null;

      const nombreOriginal = limpiar(celda(m.nombre));

      // FECHA puede venir como Date (cellDates) o texto libre.
      const fechaRaw = celda(m.fecha);
      const fechaTexto =
        fechaRaw instanceof Date
          ? fechaRaw.toISOString().slice(0, 10)
          : limpiar(fechaRaw);
      const estadoTexto = limpiar(celda(m.estado));
      const horario = limpiar(celda(m.horario));

      if (esFilaDescartable(nombreOriginal, fechaTexto, estadoTexto, horario)) {
        return;
      }

      const { canonico, notas } = normalizarNombreCurso(nombreOriginal);
      if (!canonico) return;

      let fechas: { inicio: Date | null; fin: Date | null };
      if (fechaRaw instanceof Date) {
        fechas = { inicio: fechaRaw, fin: null };
      } else {
        fechas = parseFechaRango(fechaTexto);
      }
      // Fechas fuera de 2026 (secciones históricas sin título) → registro
      // se conserva pero sin fechas, para no disparar alertas falsas.
      const estado = normalizarEstado(estadoTexto);

      // Marcas de estado sueltas en columnas sin header (ej. "DETENIDO" al
      // final de la fila): no pisan ESTADO, se anotan para revisión humana.
      const marcasExtra = row
        .map((c, i) => ({ c: limpiar(c), i }))
        .filter(
          ({ c, i }) =>
            i !== m.estado &&
            esEstadoConocido(c) &&
            normalizarEstado(c) !== estado,
        )
        .map(({ c }) => c);

      const notasFinales =
        [notas, marcasExtra.length ? `Marca adicional en fila: ${marcasExtra.join(", ")}` : null]
          .filter(Boolean)
          .join(" · ") || null;

      const tituloHoja = claveHeader(sheetName);
      const esPrograma =
        /diplomado|programa/.test(claveHeader(canonico)) ||
        /diplomado|programa/.test(tituloHoja);

      cursos.push({
        nombre_canonico: canonico,
        nombre_original: nombreOriginal,
        fecha_texto: fechaTexto,
        fecha_inicio: fechas.inicio,
        fecha_fin: fechas.fin,
        mes: limpiar(celda(m.mes)),
        dia_semana: limpiar(celda(m.dia)),
        horario,
        estado,
        estado_original: estadoTexto,
        aula: limpiar(celda(m.aula)) || null,
        groupon: parseConteo(celda(m.groupon)),
        pagos: parseConteo(celda(m.pagos)),
        inscritos: parseConteo(celda(m.inscritos)),
        valor_completo: parseMoneda(celda(m.valorCompleto)) ?? 0,
        valor_groupon: parseMoneda(celda(m.valorGroupon)),
        total_facturado: parseMoneda(celda(m.total)),
        tipo: esPrograma ? "Programa" : "Curso",
        hoja_origen: sheetName,
        fila_hoja: idx + 1,
        notas: notasFinales,
      });
    });
  }

  return cursos;
}

// ---------------------------------------------------------------------------
// Descarga vía Drive API (files.get alt=media) con timeout + retry
// ---------------------------------------------------------------------------

function getDriveClient() {
  const { serviceAccountEmail, privateKey } = getGoogleEnv();
  if (!serviceAccountEmail || !privateKey) {
    throw new Error(
      "Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY en el entorno.",
    );
  }
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return google.drive({ version: "v3", auth });
}

async function descargarXlsx(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();
  let ultimoError: unknown = null;

  for (let intento = 0; intento <= MAX_RETRIES; intento++) {
    try {
      const res = await drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer", timeout: DOWNLOAD_TIMEOUT_MS },
      );
      return Buffer.from(res.data as ArrayBuffer);
    } catch (err) {
      ultimoError = err;
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 403/404 no se arreglan reintentando (permisos / API deshabilitada).
      if (status === 403 || status === 404) break;
      if (intento < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** intento));
      }
    }
  }

  const msg = ultimoError instanceof Error ? ultimoError.message : String(ultimoError);
  throw new Error(
    `No se pudo descargar la programación (fileId=${fileId}): ${msg}. ` +
      "Verifica: (1) Drive API habilitada en el proyecto GCP del service account, " +
      "(2) el Excel compartido como Lector con el service account. " +
      "Ver docs/PROGRAMACION_GATO_BGA_INTEGRACION.md.",
  );
}

async function fetchProgramacion(): Promise<Curso[]> {
  const fileId = getProgramacionFileId();
  if (!fileId) {
    console.error(
      "[programacion-bga] GOOGLE_SHEET_PROGRAMACION_GATO_BGA_ID no configurado; devolviendo [].",
    );
    return [];
  }
  const buf = await descargarXlsx(fileId);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  return parseWorkbook(wb);
}

const readProgramacionCached = unstable_cache(
  async () => {
    // unstable_cache serializa a JSON: las Dates vuelven como string.
    const cursos = await fetchProgramacion();
    return cursos.map((c) => ({
      ...c,
      fecha_inicio: c.fecha_inicio?.toISOString() ?? null,
      fecha_fin: c.fecha_fin?.toISOString() ?? null,
    }));
  },
  ["programacion-gato-bga"],
  { revalidate: CACHE_SECONDS, tags: ["programacion-gato-bga"] },
);

/**
 * Lee la programación oficial completa (todas las hojas), cacheada 30 min.
 * Fuera del runtime de Next (scripts/tests) cae a lectura directa.
 * Si el Sheet no es accesible LANZA con mensaje accionable (el caller decide
 * si degrada la UI o muestra el error).
 */
export async function readProgramacion(): Promise<Curso[]> {
  try {
    const serializados = await readProgramacionCached();
    return serializados.map((c) => ({
      ...c,
      fecha_inicio: c.fecha_inicio ? new Date(c.fecha_inicio) : null,
      fecha_fin: c.fecha_fin ? new Date(c.fecha_fin) : null,
    }));
  } catch {
    // Fuera del runtime de Next (scripts/tests) unstable_cache puede fallar:
    // caemos a la lectura directa (mismo patrón que src/lib/mapping/courses.ts).
    // Si el problema real es de acceso al Sheet, fetchProgramacion() vuelve
    // a lanzar con el mensaje accionable.
    return fetchProgramacion();
  }
}

/** URL del Excel fuente (para links "ver programación" en la UI). */
export function getProgramacionSheetUrl(): string | null {
  const id = getProgramacionFileId();
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null;
}
