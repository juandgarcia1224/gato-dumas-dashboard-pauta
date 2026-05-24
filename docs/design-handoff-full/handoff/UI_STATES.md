# UI STATES
## Gato Dumas — Centro de Seguimiento Digital

Catálogo de estados de la interfaz. **Cada estado define textos exactos en español, colores y componentes a usar.** No improvisar copy.

Convenciones:
- Iconos referenciados (`alert-triangle`, `info`, `check-circle`, `plug`, `clock`, `refresh-cw`, `link-2`, `cloud-off`, `database`) son nombres canónicos compatibles con Lucide.
- Color tokens vienen de `DESIGN_TOKENS.json`.

---

## 1. Loading

| Aspecto | Valor |
|---|---|
| Texto | "Cargando…" (visible sólo si tarda > 500ms) |
| Color | `--text-muted` (`#6E7378`) |
| Ícono | Spinner SVG con stroke `--primary` (`#28808D`). Tamaño 18px en cards, 24px en secciones. |
| Ubicación | Centrado dentro del componente que está cargando. |
| Comportamiento | Mostrar **skeleton** del componente para los primeros 500ms. Después, swap a spinner + texto si sigue cargando. Nunca freeze el layout: el wrapper del componente mantiene su altura. |
| Componente | `Skeleton` para 0–500ms; `Spinner` + texto si > 500ms; ambos dentro de un wrapper con `aria-busy="true"`. |

**Skeletons específicos**:
- `MetricCard`: dos barras grises (label 70% width, value 50% width) usando `--backgroundDeep` con `animation: pulse 1.4s infinite`.
- Tabla: 5 filas con 6 barras cada una.
- `PacingLineChart`: una barra horizontal de 200px de alto.

---

## 2. Sin datos

| Aspecto | Valor |
|---|---|
| Texto principal | "Sin datos cargados" |
| Texto secundario | "Conecta Meta Ads para empezar a ver tu pauta." |
| Color del texto principal | `--text-primary` |
| Color del texto secundario | `--text-muted` |
| Ícono | `database` con stroke `--text-muted`, 22px. |
| Ubicación | `EmptyState` centrado dentro del cuerpo de la sección. |
| Comportamiento | La estructura de la sección permanece visible (header con título). Solo el body es reemplazado por el `EmptyState`. |
| Componente | `<EmptyState kind="no-data" title="Sin datos cargados" body="Conecta Meta Ads para empezar a ver tu pauta." />` |

**Cards individuales (MetricCard)**: en lugar de `EmptyState` muestran:
- Valor: `—` o `$—` (según unidad).
- Contexto: `"Sin datos cargados"`.
- Footer: badge ghost `"Sin datos"`.

---

## 3. Error de conexión

| Aspecto | Valor |
|---|---|
| Texto principal | "No fue posible conectar con Meta Ads" |
| Texto secundario | "Reintenta o verifica el estado del token." |
| Color del texto principal | `--text-primary` |
| Color del badge / barra | `--danger` (`#B23A48`) |
| Ícono | `cloud-off`, 22px, color `--danger`. |
| Ubicación | Banner superior reemplaza al `MockupBanner` + `EmptyState` en cada sección que dependa de Meta. |
| Comportamiento | `DashboardHeader` muestra `connection: 'crit'` con label `"Sin conexión con Meta Ads"`. Botón "Actualizar datos" sigue habilitado y dispara reintento. |
| Componente | `<EmptyState kind="error" title="No fue posible conectar con Meta Ads" body="Reintenta o verifica el estado del token." action={{ label: 'Reintentar', onClick }}/>` |

---

## 4. Token no configurado

| Aspecto | Valor |
|---|---|
| Texto principal | "Token de Meta Ads no configurado" |
| Texto secundario | "Configura el token desde el servidor para conectar las cuentas Gato Colombia y Gato Bucaramanga." |
| Color | `--warning` (`#B8862B`) |
| Ícono | `link-2`, 22px, color `--warning`. |
| Ubicación | Banner persistente debajo del header + chip en `DashboardHeader > MetaPill[Estado de conexión]` con label `"Meta Ads · token no configurado"` y status `warn`. |
| Comportamiento | Botón "Actualizar datos" permanece habilitado pero al click se muestra tooltip: `"Configura primero el token."`. Todas las secciones muestran estado **Sin datos** debajo. |
| Componente | `<ConfigBanner severity="warn" icon="link-2" title="Token de Meta Ads no configurado" body="Configura el token desde el servidor."/>` (variante de `MockupBanner`) |

---

## 5. Sheet no configurado

| Aspecto | Valor |
|---|---|
| Texto principal | "Sheet de planes no configurado" |
| Texto secundario | "Conecta el Sheet de presupuesto mensual para calcular pacing y % consumido." |
| Color | `--warning` |
| Ícono | `database`, 22px, color `--warning`. |
| Ubicación | Sólo afecta a `PacingChart` y al KPI "% consumido" + "Presupuesto planeado". Esos tres componentes muestran `EmptyState` específico. |
| Comportamiento | El resto del dashboard funciona normal con los datos de Meta. Los componentes afectados muestran su `EmptyState` y un link "Conectar Sheet". |
| Componente | `<EmptyState kind="sheet" title="Sheet de planes no configurado" body="Conecta el Sheet de presupuesto mensual para calcular pacing." action={{ label: 'Conectar Sheet', onClick }}/>` |

---

## 6. Última actualización no disponible

| Aspecto | Valor |
|---|---|
| Texto | "Pendiente · sin sincronizar" |
| Color | `--warning` (punto amarillo) |
| Ícono | Punto de estado en `MetaPill`, sin ícono adicional. |
| Ubicación | `DashboardHeader > MetaPill[Última actualización]`. |
| Comportamiento | Cuando hay timestamp, mostrarlo con formato `"Hace X minutos"` o `"Hoy, 09:42"` según rango. Si timestamp > 24h: status pasa a `warn`. Si > 72h: status pasa a `crit` con label `"Última sincronización hace más de 3 días"`. |

---

## 7. Cuenta sin gasto

Aplica a un `AccountCard` cuando la cuenta existe pero no ha gastado nada en el rango activo.

| Aspecto | Valor |
|---|---|
| Texto principal | "Sin gasto en este rango" |
| Texto secundario | "No hubo entrega en el período seleccionado." |
| Color del badge | `--text-muted` con bg `--backgroundDeep` (badge ghost) |
| Ícono | `cloud-off`, 16px, en el header del card. |
| Ubicación | El header del `AccountCard` muestra el `StatusBadge` con tono ghost y label `"Sin gasto"`. El cuerpo conserva los `Stat` pero con valores `$—` / `—`. El meter de pacing muestra `value: 0` con marker en `--expected%`. |
| Comportamiento | No bloquear la card. Sigue siendo clickable. |

---

## 8. Campaña activa sin resultados

Aplica a una fila de `CampaignTable` / `AdsetTable` / `AdsTable` que tiene gasto > 0 pero `results = 0`.

| Aspecto | Valor |
|---|---|
| Texto en la columna Resultados | `0` (no `—`) en Oswald 13.5px. |
| Texto secundario en `<small>` debajo del nombre | "Sin conversiones" en `--warning`, 10.5px. |
| Color | Fila con un `AlertCell` `warn` ("Atención") en la última columna. |
| Ícono | Sin ícono extra en la fila; el `AlertCell` ya lleva su punto de severidad. |
| Ubicación | Fila normal de la tabla. |
| Comportamiento | Si la condición se sostiene > 48h, el motor de alertas debe levantar también una alerta en `AlertsPanel` con `what: "Campaña con gasto sin conversiones"`. |

---

## 9. Alerta crítica

| Aspecto | Valor |
|---|---|
| Texto en `SeverityBadge` | "Crítica" / "Críticas" (plural cuando count > 1) |
| Texto en `AlertRow > .sev` | "Crítico" (uppercase, tracking 0.18em) |
| Color | `--danger` (`#B23A48`) para barra lateral 3px, etiqueta de severidad, badge y pill. Soft bg: `--danger-soft` (`#F4DBDF`). |
| Ícono sugerido | `alert-triangle`, 14px, color `--danger`. (En v1 omitible; la barra lateral y el color del texto bastan.) |
| Ubicación | Lista de alertas (`AlertsPanel`) + KPI "Alertas críticas" muestra count + tabla muestra `AlertCell` con `crit`. |
| Comportamiento | Crítica ordena al inicio del panel. Si hay ≥ 1 crítica, el banner superior muestra un punto rojo. |

**Recomendaciones críticas por tipo** (texto exacto sugerido):

| Trigger | `reco` |
|---|---|
| Sobreconsumo | "Reducir presupuesto diario o pausar conjuntos con CPR alto." |
| Frecuencia alta | "Refrescar creativos o ampliar audiencia para evitar fatiga." |
| Campaña sin gasto 48h | "Verificar estado de entrega y configuración de presupuesto." |
| CPM crítico | "Revisar segmentación y solapamiento con otros conjuntos." |

---

## 10. Warning

| Aspecto | Valor |
|---|---|
| Texto en `SeverityBadge` | "Atención" |
| Color | `--warning` (`#B8862B`), soft bg `--warning-soft` (`#F4EBD6`). |
| Ícono | `alert-circle`, 14px, color `--warning`. |
| Ubicación | Idéntica a crítica pero un tono abajo. |
| Comportamiento | Ordena tras las críticas. No dispara halo en el banner superior. |

---

## 11. Estado sano

| Aspecto | Valor |
|---|---|
| Texto en `StatusBadge` | "Sano" o "Estado sano" (en titulares). |
| Texto en `AccountCard` cuando está sano | "Pacing dentro del umbral" |
| Color | `--success` (`#3F7D5C`), soft bg `--success-soft` (`#E6EFE9`). |
| Ícono | `check-circle`, 14px, color `--success`. |
| Ubicación | `AccountCard > StatusBadge`, `AlertsPanel` header cuando no hay alertas, KPI status. |
| Comportamiento | Cuando una cuenta pasa de warn/crit a ok, mostrar transición sutil de color de badge (180ms). No usar toasts. |

**Estado sin alertas en `AlertsPanel`**:
```
Título: "Todo bajo control"
Body:   "No hay alertas operativas en este rango."
Icono:  check-circle, 22px, color --success
```

---

## 12. Estados adicionales (cobertura completa)

### 12.1 Rango personalizado abierto

- `range = 'Personalizado'` muestra debajo del segmented control un campo de fechas con dos inputs `Desde` / `Hasta` y un botón "Aplicar".
- Mientras no se aplique, el resto del dashboard mantiene los datos del rango anterior.

### 12.2 Vista "Cliente" activa

- En el `MockupBanner`, el texto cambia a: "Vista cliente · resumen presentable para Gato Dumas."
- El botón "Actualizar datos" queda como `secondary` (no `primary`).

### 12.3 Sincronización en curso

- Al pulsar "Actualizar datos", el botón muestra spinner + label "Sincronizando…".
- `MetaPill[Última actualización]` cambia su punto a azul (`--info`) y el label a "Sincronizando…".
- Bloquea filtros con `aria-busy="true"`; no se pueden cambiar mientras está corriendo.

### 12.4 Datos parciales

- Si solo una de las dos cuentas se sincronizó:
  - El `MetaPill[Estado de conexión]` queda `warn` con label "Sincronización parcial · 1 de 2 cuentas".
  - El `AccountCard` no sincronizado muestra `EmptyState` interno con texto "Cuenta no sincronizada · reintentar".

### 12.5 Sin presupuesto planeado

- `PacingChart` muestra `EmptyState` con texto "Sin plan mensual · conecta el Sheet" (idéntico a §5).
- KPI "Presupuesto planeado" muestra valor `$—` y ctx "Por definir en plan mensual".
- KPI "% consumido" muestra `—` y ctx "Pacing sin calcular".

### 12.6 Sin creativos en una campaña

- `AdsTable` filtrada por campaña sin anuncios muestra fila única con `EmptyState` colapsado y texto "Sin anuncios activos en esta campaña."

---

## Resumen rápido (semáforo)

| Estado | Color barra | Color label | Bg suave | Ícono |
|---|---|---|---|---|
| Crítico | `#B23A48` | `#B23A48` | `#F4DBDF` | `alert-triangle` |
| Atención | `#B8862B` | `#B8862B` | `#F4EBD6` | `alert-circle` |
| Aviso | `#28808D` | `#28808D` | `#ECF3F4` | `info` |
| Sano | `#3F7D5C` | `#3F7D5C` | `#E6EFE9` | `check-circle` |
| Sin datos | — | `#6E7378` | `#ECE8E0` | `database` (ghost) |

---

## Reglas transversales

1. **Toda card mantiene su altura mínima incluso en estado vacío.** No colapsar.
2. **Toda sección mantiene su header.** Solo el body se reemplaza por `EmptyState` o `Skeleton`.
3. **Nunca usar toasts.** Errores y avisos viven en banners, badges y `EmptyState`.
4. **Nunca esconder alertas por modo.** Cliente también las ve, sin recomendaciones internas.
5. **Sin datos ≠ Error.** Diferenciar: `--text-muted` para sin datos; `--danger` para error real.
6. **El placeholder textual debe ser explícito.** `—`, `$—`, `Sin datos cargados`, `Última actualización pendiente`, `Ejemplo visual`, `Placeholder`, `Datos de ejemplo`.
