# Programación oficial de cursos · Gato Dumas Bucaramanga — Integración

Cruce del Excel del cliente (programación mensual de cursos y diplomados)
con los adsets activos de Meta para generar la sección **"Alertas de
programación"** de `/5gatos`.

## 1. La fuente

| | |
|---|---|
| Archivo | `PROGRAMAC CURSOS CORTOS Y DIP 2026 BGA.xlsx` |
| File ID | `1cX7gHcuogtsZuKRYdm3XKB-5wNcgL406` |
| Owner | `ramaya@gatodumas.com` (Ruzmery) |
| Formato | **.xlsx real (Office)** — NO es Google Sheet nativo |
| Env var | `GOOGLE_SHEET_PROGRAMACION_GATO_BGA_ID` |

### Estructura interna observada

El workbook tiene ~5 bloques (algunos comparten hoja, cada bloque con su
propio header):

1. **Cursos cortos activos** — cursos del mes con estado `POR ABRIR` / `INICIO`.
   Columnas: `CURSO | FECHA | DIA | HORARIO | ESTADO | GROUPON | PAGOS | INSCRITOS | VALOR | GRUPON 40% DTO`.
2. **Histórico cursos cortos con facturación** — header
   `VALOR POR PERSONA | CURSO | CONTENIDO | FECHA | MES | DIA | HORARIO | ESTADO | AULA | GROUPON | PAGOS | INSCRITOS | Groupon | Completo | Total`.
   Ojo: `GROUPON` (antes de INSCRITOS) es **conteo**; `Groupon`/`Completo`/`Total`
   (después) son **facturación en COP**.
3. **Diplomados 2026** — GMBR, TBC, TBCPP, Téc. Pastelería, Alimentación
   Consciente, Cocina Bienestar ($1.8M–$2.2M).
4. **Histórico diplomados finalizados** — baseline 2024-2025.
5. **Cursos cortos 2015** — datos viejos, **se descartan** (el parser detecta
   el año en el título de sección y salta el bloque completo).

### Estados canónicos (enum `EstadoCurso`)

| Excel | Canónico |
|---|---|
| `POR ABRIR` | `POR_ABRIR` |
| `INICIO`, `INICIADO` | `INICIO` |
| `FINALIZO`, `FINALIZÓ` | `FINALIZO` |
| `DETENIDO` | `DETENIDO` |
| `CANCELADO` | `CANCELADO` |
| `SUSPENDIDO` | `SUSPENDIDO` |
| cualquier otro | `OTRO` |

### Trampas del Excel que el parser ya maneja

- **Notas del staff pegadas al nombre**: `"COCINA PARA NIÑOS Es el mismo curso
  para jovenes..."` → `nombre_canonico="Cocina para Niños"`,
  `notas="Es el mismo curso..."` (`normalizarNombreCurso`).
- **Nombres de profesoras sueltos** (`NANCY`, `ESTEFANIA`): una palabra en
  mayúsculas sin fecha/estado/horario → fila descartada.
- **Fechas en texto libre**: `"7 al 11 de Julio"`, `"26 julio al 16 Agosto"`,
  `"Abril 21 al 23 de Junio"`, `"9 MAR AL 4 MAYO"`, `"31 ENERO A 21 FEBRERO"`
  → `parseFechaRango` (año asumido: 2026; si trae año explícito ≠ 2026 → null).
- **Dinero como texto**: `" $460,000 "` y `"$ 2.625.000"` → `parseMoneda`
  (quita todo lo que no sea dígito; COP no usa decimales). `" $- "` → null.
- **Marcas de estado sueltas** en columnas sin header (ej. un `DETENIDO` al
  final de la fila que contradice el `ESTADO`): no pisan el estado, se anotan
  en `notas` como "Marca adicional en fila: …".
- **Headers repetidos** a mitad de hoja: cada header re-mapea las columnas de
  su sección.

## 2. Cómo se lee (importante: NO es la ruta estándar de Sheets)

Verificado en vivo:

- `spreadsheets.values.get` → **400** `"The document must not be an Office file"`.
- Drive `files.export` → solo aplica a archivos nativos de Google, no a xlsx.

**Ruta implementada** (`src/lib/sheets/programacion-gato-bga.ts`):

```
Drive API files.get?alt=media  →  Buffer  →  SheetJS (xlsx) parse  →  Curso[]
```

- Timeout 10 s por request, retry 2× con backoff (403/404 no se reintentan).
- Cache 30 min con `unstable_cache` de Next (tag `programacion-gato-bga`);
  fuera del runtime de Next cae a lectura directa.
- `xlsx` (SheetJS) ya era dependencia del repo — no se instaló nada nuevo.

### Acceso del service account (pendiente al momento de escribir esto)

Service account: `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com`

Dos pasos de 1 minuto (Juan):

1. **Habilitar la Drive API** en el proyecto GCP `cookminds-dashboards`
   (verificado: hoy devuelve 403 "API has not been used in project 284881347761"):
   <https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=284881347761>
2. **Compartir el Excel** con el service account como **Lector** (lo hace
   Ruzmery o quien tenga acceso al archivo → Compartir → pegar el email del
   service account → Viewer).

Mientras falte cualquiera de los dos, `readProgramacion()` lanza con un
mensaje accionable y `getAlertasProgramacion()` degrada a una única alerta
`info` ("Programación del cliente no disponible") — el dashboard no se cae.

Smoke test: `npx tsx scripts/probar-programacion.ts` (script local, no
commiteado).

## 3. Reglas de alertas (`src/lib/dashboard/programacion-cross.ts`)

Umbrales configurables al inicio del archivo:
`DIAS_ANTICIPACION = 15` · `UMBRAL_GASTO_BAJA_CONVERSION = 800_000` ·
`INSCRITOS_MINIMOS_ESPERADOS = 8` · `FUZZY_THRESHOLD = 0.75`.

| # | Condición | Severidad | Título |
|---|---|---|---|
| 1 | Curso `INICIO` sin adset activo | atender | "Falta pauta activa" |
| 2 | Curso `POR_ABRIR` que abre en <15 días sin adset | atender | "Faltan N días y sin pauta" |
| 2b | Curso `POR_ABRIR` cuya fecha de inicio **ya pasó** sin adset | atender | "Inicio vencido y sigue POR ABRIR" |
| 3 | Curso `FINALIZO/DETENIDO/CANCELADO/SUSPENDIDO` con adset ACTIVO | **crítica** | "Adset debe pausarse ya" (+ gasto acumulado) |
| 4 | Adset activo que no matchea ningún curso | info | "Adset sin curso identificado" |
| 5 | Curso `INICIO` con <8 inscritos y gasto > $800.000 | atender | "Alto gasto y baja conversión" |

Antes de aplicar reglas se hace **dedupe** (`dedupeCursosVigentes`): el Excel
repite cursos entre bloque activo e histórico; por nombre gana el registro con
estado vivo (`INICIO`/`POR_ABRIR`) y fecha más reciente. Así "Cocina Italiana
FINALIZO (histórico)" no dispara falsa crítica si existe "Cocina Italiana
POR_ABRIR (vigente)".

### Fuzzy match curso↔adset

- Normalización: minúsculas, sin acentos, sin puntuación, sin stopwords
  ("curso", "diplomado", "bga", "leads", conectores…).
- **Siglas** del cliente expandidas antes de comparar (`SIGLAS_DIPLOMADOS`):
  `GMBR`, `TBC`, `TBCP`, `TBCPP`.
- Score: Jaro-Winkler sobre el string completo + contención total (0.9) +
  token significativo compartido tolerante a plural/typo ("parrilla" ↔
  "parrillas") (0.8). Umbral: **0.75**.

## 4. Integración en la UI (para el dev que cierre la migración a adsets)

El tipo `AdsetActivo` de `programacion-cross.ts` se definió en paralelo a la
migración campañas→adsets. **Unificar** con `AdsetStats` de
`src/lib/fivegatos/data.ts` cuando esa rama cierre (campos ya alineados:
`id, name, effective_status, spend, spend_lifetime, cpl, start_time, end_time`;
solo mapear `spend` → `spend_month` y agregar `campaign_name`).

En el server component / API de `/5gatos`:

```ts
import { getAlertasProgramacion } from "@/lib/dashboard/programacion-cross";

// adsets = los AdsetStats activos que ya carga el dashboard, mapeados:
const { alertas, programacionDisponible } = await getAlertasProgramacion(
  adsetsActivos.map((a) => ({
    id: a.id,
    name: a.name,
    campaign_name: a.campaign_name ?? "",
    effective_status: a.effective_status,
    spend_lifetime: a.spend_lifetime,
    spend_month: a.spend,
    start_time: a.start_time,
    end_time: a.end_time,
    cpl: a.cpl,
  })),
);
// Render: sección "Alertas de programación" al final de page.tsx,
// agrupando por severidad (critica roja, atender ámbar, info gris).
// `getAlertasProgramacion` NUNCA lanza: si el Excel no responde devuelve
// una alerta info y programacionDisponible=false.
```

`generarAlertas(adsets, programacion)` es la variante pura (sin red) si la
página ya tiene la programación cargada, y `readProgramacion()` expone los
`Curso[]` completos por si se quiere pintar la programación como tabla.

## 5. Ejemplos de output reales (fixture con filas literales del Excel)

`readProgramacion()` → `Curso`:

```json
{
  "nombre_canonico": "Cocina para Niños",
  "nombre_original": "COCINA PARA NIÑOS Es el mismo curso para jovenes, que cambio: Son 5 clases...",
  "fecha_texto": "7 al 11 de Julio",
  "fecha_inicio": "2026-07-07T00:00:00",
  "fecha_fin": "2026-07-11T00:00:00",
  "mes": "", "dia_semana": "Lunes a Viernes",
  "horario": "10:30 am a 1:00 pm",
  "estado": "POR_ABRIR", "estado_original": "POR ABRIR",
  "aula": null, "groupon": 0, "pagos": 0, "inscritos": 0,
  "valor_completo": 460000, "valor_groupon": 276000,
  "total_facturado": null, "tipo": "Curso",
  "hoja_origen": "Cursos cortos", "fila_hoja": 2,
  "notas": "Es el mismo curso para jovenes, que cambio: Son 5 clases..."
}
```

`generarAlertas()` → `Alerta`:

```json
{
  "severidad": "critica",
  "titulo": "Adset debe pausarse ya",
  "mensaje": "\"Carnes Ala Parrilla\" figura FINALIZO en la programación, pero el adset \"Parrillas BGA\" sigue ACTIVO. Gasto acumulado: $800.000.",
  "curso": "Carnes Ala Parrilla",
  "adset_id": "demo_3",
  "valor_involucrado": 800000,
  "accion_sugerida": "Pausar el adset en Meta hoy mismo y confirmar con el cliente el estado real del curso."
}
```

## 6. Tests

```
npx tsx --test src/lib/sheets/programacion-gato-bga.test.ts
```

40 tests (node:test, mismo runner que `test:mapping`): nombres con notas,
7 formatos de fecha reales, estados, dinero con comas y puntos, workbook
fixture con secciones múltiples/profesoras/histórico 2015, fuzzy match con
siglas y plurales, y las 6 reglas de alertas.
