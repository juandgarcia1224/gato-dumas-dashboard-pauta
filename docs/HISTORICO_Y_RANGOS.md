# Histórico diario y rangos — Dashboard Gato Dumas

Desde el Bloque 11 el dashboard guarda **histórico diario** y permite filtrar por
mes / semana / día / rango personalizado, manteniendo el pacing mensual.

## 1. Cómo se guarda el histórico
- `meta:update` consulta Meta con **`time_increment=1`** → una fila **por día** por
  campaña/conjunto/anuncio (cada fila tiene `date_start === date_stop`).
- Se escribe con **UPSERT** (no se borra histórico): clave única por
  `platform + account_group + ad_account_id + date_start + date_stop + ids`.
  Si la fila del día ya existe, se actualiza; si no, se agrega. Sin duplicados.
- El dashboard **agrega** las filas diarias del rango seleccionado y calcula
  KPIs, alertas y pacing **en vivo**.

## 2. Cargar histórico marzo–mayo (backfill)
Una sola vez, con token temporal (en tu terminal):
```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --dateStart 2026-03-01 --dateStop 2026-05-25 --updatedBy Juan
```
> Carga muchas filas (día×entidad). Si es muy pesado o lento, puedes cargar
> **mes por mes** (el upsert acumula sin borrar):
> ```bash
> META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --dateStart 2026-03-01 --dateStop 2026-03-31 --updatedBy Juan
> META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --dateStart 2026-04-01 --dateStop 2026-04-30 --updatedBy Juan
> META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --dateStart 2026-05-01 --dateStop 2026-05-31 --updatedBy Juan
> ```

## 3. Actualizar el mes actual (rutina)
```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --range this_month --updatedBy Juan
# o interactivo:
npm run meta:update:manual -- --range this_month --updatedBy Juan
```
Reescribe (upsert) los días del mes actual; los meses anteriores quedan intactos.

## 4. Cómo se evitan duplicados
El upsert deduplica por clave única que incluye `date_start`. Recargar un día/mes
**actualiza** esas filas, no las duplica. Histórico de otros días: intacto.

## 5. Qué hace el dashboard si no hay datos para un rango
- Si **no hay histórico diario** (solo un snapshot agregado viejo): muestra
  "Solo hay un snapshot agregado" + el comando para cargar histórico. No inventa.
- Si hay histórico pero el rango pedido no tiene datos: "No hay datos para [rango]"
  + comando + botón para ver el último mes con datos.

## 5b. Resultados y CPR exactos (range summaries)
Los métricos con **ventana de atribución** (ej. `messaging_conversation_started_7d`)
**no son aditivos**: sumar filas diarias los infla (mayo daba ~20.416 vs ~5.132 reales).

Por eso `meta:update` hace **doble carga**:
1. **Daily** (`time_increment=1`) → hojas `02/03/04` → spend, impresiones, clics,
   CTR, frecuencia, filtros por fecha y pacing (todo aditivo/correcto).
2. **Range agregado** (sin `time_increment`, mismas fechas) → hoja
   **`10_Meta_Range_Summaries`** → **results y cost_per_result exactos** del rango.

El dashboard, para el rango seleccionado:
- Si existe un **range summary exacto** (mismo `date_start..date_stop`) → usa results/CPR exactos (badge "Resultados exactos").
- Si NO existe → muestra spend y filtros (de daily) y deja **results/CPR en "—"**
  con aviso "Resultados pendientes de sincronización exacta" + comando. **No suma
  daily de messaging como oficial** (no infla, no inventa).

`range_key` = `date_start..date_stop`. Los **meses** usan mes completo
(`2026-05-01..2026-05-31`), así que el chip "Mayo" casa con el summary cargado con
esas fechas. Para que un mes tenga results exactos, cárgalo con fechas de mes completo
(`--dateStart 2026-05-01 --dateStop 2026-05-31`).

## 6. Pacing mensual
- **Mes actual / un mes específico (Marzo/Abril/Mayo):** si `01_MediaPlan` tiene
  presupuesto de ese mes y cuenta → pacing real (esperado vs real, % consumido).
- **Bogotá / Barranquilla:** el presupuesto está a nivel Gato Colombia, no por
  sede → "El presupuesto está cargado a nivel Gato Colombia, no por sede."
- **Bucaramanga sin presupuesto:** "Sin plan mensual".
- **Últimos 7 días / Hoy / Personalizado (no-mes):** "Pacing mensual no disponible
  para este rango. Selecciona un mes."
- Para que cada mes tenga pacing, carga su presupuesto en `01_MediaPlan` (filas con
  `month` = `2026-03`, `2026-04`, etc.). Ver [`MEDIAPLAN_GATO_DUMAS.md`](MEDIAPLAN_GATO_DUMAS.md).

## 7. Filtros disponibles
- **Vista:** Consolidado · Gato Colombia · Bogotá · Barranquilla · Gato Bucaramanga.
- **Rango:** Mes actual · Últimos 7 días · Hoy · Personalizado.
- **Mes:** chips por cada mes con datos (Marzo/Abril/Mayo…), generados desde el histórico.
- Combinables (ej. Abril 2026 + Barranquilla).

## 8. Limitaciones conocidas
- **Frecuencia** en rangos multi-día es una aproximación (suma de alcance diario
  sobreestima el alcance único real del periodo).
- El **snapshot agregado** viejo (mar–may, `date_start≠date_stop`) queda en la hoja
  pero se **ignora** para filtros por fecha (no se borra). Una vez cargado el
  histórico diario, ese snapshot es redundante.
- Pacing por **sede** (Bogotá/Barranquilla) requiere presupuesto por sede en
  `01_MediaPlan` (hoy es por cuenta). El canon §5.2 tiene BOG/BAQ si se quiere desglosar.
- Cargas muy grandes (3 meses, nivel anuncio) pueden ser lentas; usar carga mensual.
