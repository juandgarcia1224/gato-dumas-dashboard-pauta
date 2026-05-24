# MediaPlan Gato Dumas — Cómo llenar `01_MediaPlan`

La hoja **`01_MediaPlan`** del Sheet PROD alimenta el **pacing** y el **% consumido**
del dashboard. Es **editable manualmente** por Juan/Paola. No requiere token de Meta.

> El dashboard compara el **gasto real** (que llega de Meta) contra el
> **presupuesto planeado** que tú escribes aquí. Sin presupuesto, el pacing muestra
> "Sin plan mensual".

---

## Columnas

| Columna | Qué poner | Obligatorio para pacing |
|---|---|---|
| `month` | Mes en formato `YYYY-MM` (ej. `2026-05`) | ✅ |
| `platform` | `Meta` | ✅ |
| `account_group` | **`gato_colombia`** o **`gato_bucaramanga`** (en minúscula, con guion bajo — así lo cruza el sistema) | ✅ |
| `campaign_name` | Etiqueta libre (ej. `PROGRAMAS_META`, `GENERAL_ACCOUNT_BUDGET`) | — |
| `sede` | `Bogotá/Barranquilla` o `Bucaramanga` | — |
| `objective` | Ej. `Mensajes/Conversaciones` | — |
| `start_date` / `end_date` | `YYYY-MM-DD` (inicio/fin del mes) | — |
| `planned_budget` | **Presupuesto del mes en COP, como número** (ej. `19000000`, sin `$` ni puntos de miles) | ✅ (activa pacing) |
| `planned_result_type` | Tipo de resultado esperado (ej. `onsite_conversion.messaging_conversation_started_7d`) | — |
| `planned_results` | Meta de resultados del mes (número) — opcional | — |
| `planned_cpa` | Costo por resultado objetivo (COP) — opcional | — |
| `notes` | Nota libre / fuente del dato | — |

> ⚠️ **No cambies los encabezados (fila 1)** ni el orden de columnas. No uses símbolos
> de moneda ni separadores de miles en `planned_budget` (escribe `19000000`, no `$19.000.000`).
> Varias filas del mismo `account_group`+`month` se **suman** (puedes desglosar por categoría).

---

## Qué pasa según lo que llenes

- **Solo `planned_budget`** → se activa el **pacing** y el **% consumido**:
  - `% consumido = gasto real ÷ presupuesto planeado`.
  - `esperado a la fecha = presupuesto × (día del mes ÷ días del mes)`.
  - estado: `on_track`, `overpacing` (>+15%), `underpacing` (<−20%).
  - Es lo **mínimo** para que el dashboard calcule pacing.
- **`planned_results`** (opcional) → meta de resultados de referencia. *(Hoy es informativo; no altera el pacing.)*
- **`planned_cpa`** (opcional) → costo objetivo por resultado. Si no lo tienes, se puede derivar como
  `planned_budget ÷ planned_results`. *(Hoy es informativo.)*

> Para el pacing, lo único imprescindible es **`planned_budget`** por `account_group` + `month`.

---

## Cómo activar / refrescar el pacing

1. Llena/edita `planned_budget` en `01_MediaPlan` (en el Sheet, a mano).
2. Recalcula sin tocar Meta:
   ```bash
   npm run pacing:recompute -- 2026-05
   ```
   Esto lee `01_MediaPlan` + el gasto real ya cargado y reescribe `05_Daily_Pacing`.
   *(También se recalcula automáticamente en cada `npm run meta:update`.)*
3. Abre el dashboard (`npm run dev`): pacing y % consumido aparecen para esa cuenta.

---

## Estado actual (mayo 2026)

| Cuenta | `planned_budget` mayo | Fuente | Estado pacing |
|---|---|---|---|
| **Gato Colombia** | **$30.500.000** (Posicionamiento 2.0M + Programas 19.0M + Diplomados&Cursos 9.5M) | Canon `METAS_Y_PRESUPUESTO_PAUTA` / `PRESUPUESTO_PRIORIDAD_COLOMBIA` §5.1 (firma Juan 2026-05-21) | ✅ Activo (on_track, ~73% consumido) |
| **Gato Bucaramanga** | **PENDIENTE** | Canon BUC ($14.4M) es **anual/período sin confirmar** y **excluye cursos cortos** → no hay cifra mensual confirmada | ⚠️ "Sin plan mensual" hasta confirmar |

### Para activar Bucaramanga
Reemplaza el `planned_budget` vacío de la fila `gato_bucaramanga` / `2026-05` con el
**presupuesto mensual Meta real de Bucaramanga** (incluyendo cursos cortos si aplica),
y corre `npm run pacing:recompute -- 2026-05`. **No usar el $14.4M anual como si fuera mensual.**

---

## Reglas anti-daño
- No borres ni renombres encabezados.
- `account_group` siempre en clave (`gato_colombia` / `gato_bucaramanga`).
- `planned_budget` como número plano.
- No escribas en `02/03/04` (RAW de Meta) ni en `05_Daily_Pacing` (se calculan solos).
- Si dudas de una cifra, déjala vacía con nota — **mejor vacío que inventado**.
