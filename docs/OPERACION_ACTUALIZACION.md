# OPERACIÓN — Actualización de datos

Cómo actualizar el dashboard día a día. La actualización es **manual desde
terminal** (Fase 1). No hay automatización programada todavía.

## Comando base

```bash
npm run meta:update -- --range <rango> --updatedBy <nombre>
```

### Rangos disponibles
| Rango | Uso |
|---|---|
| `this_month` | Mes en curso (default). Recomendado para revisión general. |
| `last_7d` | Últimos 7 días. Bueno para tendencia reciente. |
| `today` | Solo hoy. |
| `yesterday` | Solo ayer. |
| `--dateStart / --dateStop` | Rango exacto (`YYYY-MM-DD`). |

### Ejemplos
```bash
# Mes actual (Juan)
npm run meta:update -- --range this_month --updatedBy Juan

# Últimos 7 días (Paola)
npm run meta:update -- --range last_7d --updatedBy Paola

# Rango custom
npm run meta:update -- --dateStart 2026-05-01 --dateStop 2026-05-24 --updatedBy Juan
```

## Qué hace cada corrida

1. Valida variables de entorno (Meta + Google).
2. Consulta **las dos cuentas** (Colombia y Bucaramanga) por separado.
3. Descarga insights a nivel **campaña / conjunto / anuncio** + estados.
4. Interpreta resultados (mensajes, leads, etc.).
5. **Sobrescribe** las hojas RAW (`02`, `03`, `04`).
6. Calcula **pacing** (`05`) usando `01_MediaPlan`.
7. Genera **alertas** (`06`).
8. Añade filas al **log** (`07`).
9. Imprime un resumen en consola.

## Tolerancia a fallos

- Si **una cuenta falla**, la otra se procesa igual; el error queda en `07_Update_Log`.
- Si **ambas fallan**, NO se sobrescriben datos (se conserva la última carga buena).

## Rutina recomendada

| Frecuencia | Acción |
|---|---|
| Diario (mañana) | `meta:update --range this_month` para ver pacing del mes. |
| Ad-hoc | `--range last_7d` para revisar fatiga/CTR reciente. |
| Inicio de mes | Actualizar `01_MediaPlan` con los presupuestos del mes nuevo. |

## Ver resultados

```bash
npm run dev      # http://localhost:3000
```
La tarjeta "Última actualización" muestra cuándo y quién corrió la última carga.

## Notas

- Mantén `01_MediaPlan` al día: sin presupuesto planeado, el pacing aparece como `no_plan`.
- El rango de la UI lo determina la última corrida de `meta:update` (no hay selector de fechas en el front aún).
