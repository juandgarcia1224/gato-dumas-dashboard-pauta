# Mapeo curso↔ADSET — Dashboard 5 Gatos · Bucaramanga

Migrado el **2026-07-12** del modelo campaña al modelo **adset**.

## El modelo

Juan (agencia) organiza las campañas de Meta así:

- **1 adset = 1 curso o programa.** El nombre del adset lleva el nombre del
  curso (ej. `BUC_CC_New York Cookies_Advantage`, `BUC | Cocina | Interés`).
- **Las campañas son contenedores** que agrupan varios adsets (ej.
  `Ventas | Cursos cortos | BUC 2026` con un adset por curso corto).

Por eso el dashboard `/5gatos` clasifica, agrupa y muestra **ADSETS**:

- Tablas "Resumen por Curso" / "Resumen por Programa" → suman adsets.
- Grid "Adsets activos ahora" → una card por adset, con la campaña padre
  como eyebrow, fechas de inicio/fin, días corridos y **consumo lifetime**
  (gasto acumulado desde el inicio real del adset) como métrica destacada,
  más el gasto del mes en curso como métrica secundaria.

## Fuente de datos (Meta, SOLO lectura)

Módulo: `src/lib/meta/adsets.ts` · cuenta `act_248616958293893` · API v22.0.

| Llamada | Qué trae |
| --- | --- |
| `GET /act_…/adsets?fields=id,name,campaign_id,campaign{id,name},effective_status,status,start_time,end_time,daily_budget,lifetime_budget,created_time` | Metadatos. Se filtra por **`effective_status=ACTIVE`** (no por `status`: una campaña PAUSED también pausa sus adsets vía effective_status). |
| `GET /act_…/insights?level=adset&date_preset=maximum` | **Lifetime** por adset (equivale a "desde inicio"): spend, impressions, clicks, ctr, cpc, cpm, actions, cost_per_action_type. |
| `GET /act_…/insights?level=adset&time_range={mes}` | Métricas del mes seleccionado (para el mes en curso equivale a `date_preset=this_month`). |

Rate limit: si Meta responde `code 17` (User request limit reached) —o los
afines 4/32/613— se reintenta con **backoff exponencial** (2 s, 4 s; máximo
3 intentos) vía `withRateLimitRetry`.

**Restricción dura: el dashboard JAMÁS modifica campañas, adsets,
presupuestos ni creativos. Solo GET.**

## El Sheet de mapeo

`Mapeo_Cursos_5Gatos_Bucaramanga` · ID `1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs`
(env `GOOGLE_SHEET_MAPEO_5GATOS_ID`). Lo mantiene **Ruzmery**. Respaldo si el
Sheet no responde: `src/lib/mapping/fallback.json`.

### Hoja `Mapeo`

| Columna | Significado |
| --- | --- |
| `pattern_regex` | Regex (case-insensitive) contra el **nombre del ADSET**. |
| `adset_id_exacto` | Match literal por id de adset. **Gana sobre el regex.** (Antes se llamaba `campaign_id_exacto`.) |
| `tipo` | `Curso` o `Programa`. |
| `nombre_normalizado` | Nombre que ve el cliente en tablas, cards y Excel. |
| `activo` | `TRUE` aplica la regla; `FALSE` la apaga sin borrarla. |
| `notas` | Libre (ejemplos de nombres que cubre). |
| `legacy_campaign` | `TRUE` = regla del modelo viejo (regexeaba nombres de **campaña**). El matcher la **ignora** hasta que Ruzmery la revise: si el patrón también sirve para adsets, cambiarla a `FALSE`; si no, dejarla como registro histórico. **No borrar.** |

Orden de matching: primero `adset_id_exacto`, luego cada regex **en el orden
de la hoja** (la primera que matchea gana). Reglas específicas (ej. `Cocina
Asiática`) van ANTES que comodines (ej. `Programa Cocina`, `diplomado`).

Ejemplo de fila vigente:

```
pattern_regex: new\s*york\s*cookies
adset_id_exacto: (vacío)
tipo: Curso
nombre_normalizado: New York Cookies
activo: TRUE
notas: Ej: 'BUC_CC_New York Cookies_Advantage'
legacy_campaign: FALSE
```

### Hoja `Sin_Clasificar`

El dashboard y el cron registran aquí (máx. 1 vez/día por adset) los adsets
con gasto o activos que ninguna regla clasifica:

`fecha_iso | adset_id | adset_name | campaign_id | campaign_name | account_id | status | notas`

La UI muestra "N adsets sin curso o programa asignado" con link directo a
esta hoja (gid en `SIN_CLASIFICAR_GID`, `src/lib/mapping/types.ts`;
override: env `GOOGLE_SHEET_MAPEO_5GATOS_SINCLASIFICAR_GID`).

Para corregir: agregar una fila en `Mapeo` con el patrón o el `adset_id` y
`activo=TRUE`. El caché de reglas dura 15 min (el de datos, 10 min).

### Hojas `Historial` y `README`

- `Historial`: log de siembras y de la migración (append-only).
- `README`: la misma guía de columnas, dentro del propio Sheet, para Ruzmery.

## Qué pasó en la migración (2026-07-12)

Ejecutada con `npx tsx scripts/setup-mapping-sheet.ts` (idempotente):

1. Header `campaign_id_exacto` → `adset_id_exacto` (valores intactos).
2. Columna nueva `legacy_campaign`; las **8 reglas originales** (nivel
   campaña) quedaron marcadas `TRUE` y con sufijo `[LEGACY…]` en notas.
   **No se borró ninguna fila.**
3. Se sembraron **13 reglas nuevas a nivel adset** (cursos: New York
   Cookies, Cocina Asiática, Iniciación en Pastelería, Mesa de Postres,
   Master Brunch, Papá Parrillero, Cocina Mexicana; programas: Triple
   Titulación, Pastelería y Panadería, Supervisor, Cocina; comodines:
   diplomado y cursos cortos) — verificadas contra los 8 adsets activos
   reales: **0 sin clasificar**.
4. `Sin_Clasificar` reescrita al esquema adset (estaba vacía).
5. Hoja `README` creada.

## Snapshot del cron

`/api/cron/refresh-5gatos` escribe ahora en **`13_5Gatos_Adsets_Snapshot`**
del Sheet PROD (una fila por adset y mes, últimos 90 días, upsert por
`month+adset_id`, incluye `spend_lifetime`). La hoja `11_5Gatos_Snapshot`
(nivel campaña) queda como **histórico legacy**: no se escribe más y no debe
borrarse.

## Tests

```bash
npm run test:mapping   # matcher: id exacto, regex, no-match, legacy ignorada, fallback
```
