# RESPONSIVE RULES
## Gato Dumas — Centro de Seguimiento Digital

Reglas exactas por breakpoint. **No** improvisar. **No** introducir un breakpoint extra. **No** cambiar el max-width.

---

## Breakpoints canónicos

| Token | Min width | Caso |
|---|---|---|
| `xl` | 1480px | Hero — desktop de trabajo de la trafficker. |
| `lg` | 1180px–1479px | Desktop estándar. |
| `md` | 760px–1179px | Tablet. |
| `sm` | 480px–759px | Mobile grande. |
| `xs` | < 480px  | Mobile compacto. |

> Implementar con media queries `min-width` (mobile-first) **o** Tailwind `lg:` `md:` `sm:` — pero los anchos deben coincidir con los listados.

---

## DESKTOP (≥1180px)

### Contenedor

- Ancho máximo: **1480px** (`token: spacing.appMaxWidth`).
- Padding lateral: **36px** (`token: spacing.appPadX`).
- Padding vertical: **28px arriba**, **80px abajo**.
- Background del documento: `--background` (`#F4F1EB`).
- Toda página es **un solo scroll vertical**. No usar paneles con scroll interno excepto las tablas (overflow-x).

### Grid principal

| Bloque | Grid | Notas |
|---|---|---|
| TopBar | `flex` horizontal con `gap: 24px` | Marca a la izquierda + meta-pills + 2 botones. |
| FilterBar | `flex-wrap` con `gap: 20px 28px` | Acomoda hasta 3 grupos + chip de cuentas. |
| ExecStrip | `grid-template-columns: 240px 1fr 1fr 1fr` | Header negro fijo 240px. |
| KPI Grid | `grid-template-columns: repeat(4, 1fr); gap: 20px` | Siempre 4 columnas. |
| Account Summary | `grid-template-columns: 1fr 1fr; gap: 0` | Divisor vertical 1px. |
| Pacing | `grid-template-columns: 1.6fr 1fr; gap: 0` | Chart + panel numérico. Divisor vertical 1px. |
| Alerts | filas de `display: grid; grid-template-columns: 80px 1.4fr 1.5fr 100px 1fr auto` | Las 6 columnas son fijas. |
| Tables | `<table>` con `min-width` igual al ancho calculado de columnas. Wrapper `overflow-x: auto`. | No colapsar columnas en desktop. |
| Client Exec | `grid-template-columns: repeat(3, 1fr)` | Mismas 3 celdas que ExecStrip. |

### Cards

- Border-radius: **8px**.
- Border: **1px solid `--border`**.
- Sombra: **`shadows.card`** (sutil, sin profundidad). No introducir sombras de elevación grandes.
- Hover en cards: **sin transformación**, sin levantamiento. La superficie es plana editorial. Cambiar solo `border-color` a `--borderStrong` si es interactiva.

### Tablas

- Cabecera sticky: **NO** en v1.
- Padding celda: **14px y / 14px x**.
- Border-bottom de fila: **1px solid `--border`**. Última fila sin borde.
- Fila hover: fondo `--backgroundDeep`.
- Columnas numéricas: alineadas a la derecha, fuente Oswald 13.5px.
- Ancho mínimo de columna "Campaña/Conjunto/Anuncio": **220px**.
- Cuando la suma de columnas excede el ancho del contenedor, scroll horizontal con scrollbar visible (no auto-hide).

---

## TABLET (760px–1179px)

### Cambios respecto a Desktop

| Bloque | Cambio |
|---|---|
| Contenedor | Padding lateral **24px**. |
| KPI Grid | `repeat(3, 1fr)`. El último KPI (#9 Alertas críticas) ocupa una celda más; la grid mantiene aspecto. |
| Account Summary | Se mantiene en **2 columnas** mientras quepa. Apilarse solo bajo 880px (ver Mobile). |
| Pacing | Las dos columnas internas (chart / panel) **se apilan** verticalmente. El divisor pasa a ser borde superior del panel. |
| ExecStrip | El header negro toma `grid-column: 1 / -1` (fila propia). Las 3 celdas quedan en 2 columnas; la tercera baja a fila propia. |
| Tables | Mantienen scroll horizontal. **No** colapsar a tarjetas todavía. |
| TopBar | Cuando los meta-pills + botones no caben, `flex-wrap`. Los botones permanecen a la derecha. |
| AlertRow | Sin cambios. La columna "Recomendación" puede comprimirse pero no oculta. |

### Qué se apila y qué no

- **Sí se apila**: pacing chart + panel; tercera celda ejecutiva.
- **No se apila**: KPI grid (se reduce a 3 cols), cuentas (siguen lado a lado), alertas, tablas.

---

## MOBILE (<760px)

### Contenedor

- Padding lateral: **18px**.
- Padding vertical: **18px**.

### TopBar

- Pasa a 2 filas:
  1. Marca (logo + nombre + subtítulo) — ocupa fila completa.
  2. Meta-pills (Última actualización / Estado de conexión) en 2 columnas + botones debajo o a la derecha si caben.
- El divisor vertical entre marca y meta se convierte en `border-bottom: 1px solid --border` debajo de la marca.

### FilterBar

- Cada `filter-group` ocupa una fila propia.
- El chip de cuentas hace `flex-wrap`.
- El grupo "Nivel" (escondido en modo cliente) permanece visible en interno.

### ExecStrip y Client Exec

- **1 columna**. Header negro ocupa fila propia. Las 3 celdas se apilan.
- Cada celda mantiene su padding `22px 22px`. Divisor pasa a borde superior.

### KPI Grid

- **1 columna**.
- Orden de prioridad (los primeros aparecen primero — pero **todos** se siguen mostrando):
  1. Inversión total
  2. % consumido
  3. Costo por resultado
  4. Resultados
  5. Campañas activas
  6. Alertas críticas
  7. Frecuencia (oculta en cliente)
  8. CTR (oculta en cliente)
  9. Presupuesto planeado
- En modo cliente, los KPIs `tech` (Frecuencia + CTR) están ocultos siempre.

### Account Summary

- Cuentas **apiladas** (1 columna).
- El divisor vertical pasa a `border-top: 1px solid --border`.
- El grid interno `grid-stats` pasa de 4×2 a **2×4**.

### Pacing

- Igual que en tablet (apilado), pero el chart reduce su altura intrínseca a **180px** (no menos).
- El panel numérico mantiene su grid 2×2.

### Alerts

`AlertRow` se reorganiza en 3 filas dentro de la card:

```
┌──────────────────────────────────────────────┐
│ [SEV badge]  Frecuencia alta                 │
│              Gato Bucaramanga                │
├──────────────────────────────────────────────┤
│ CJ · Remarketing 30d Brunch    [Frecuencia]  │
│                                  —           │
├──────────────────────────────────────────────┤
│ Refrescar creativos o ampliar audiencia…    │
│                          [ Ver detalle ]    │
└──────────────────────────────────────────────┘
```

- En **modo cliente**, la última fila (reco) sigue ocultándose.

### Tablas → tarjetas

- A partir de **<760px**, las 3 tablas (`CampaignTable`, `AdsetTable`, `AdsTable`) se convierten en lista de **tarjetas verticales**.
- Cada tarjeta:
  - Header: thumb 36px + nombre (Raleway 13px bold) + cuenta (eyebrow 10.5px tracking 0.04em).
  - Estado: `StatusBadge`.
  - Stats: **grid 2×2** con las 4 métricas hero por tipo:
    - Campañas: Inversión / Resultados / CPR / CTR.
    - Conjuntos: Inversión / Resultados / CPR / CTR.
    - Anuncios: Inversión / Resultados / CPR / CTR.
  - Footer: `AlertCell`.
- La tab activa controla qué lista se muestra. Las tabs siguen visibles arriba en horizontal scroll si no caben.

---

## Qué se OCULTA en mobile (independiente de modo)

- Botón "Exportar CSV" → se conserva pero se mueve al pie de la sección de tablas.
- Columnas secundarias de tablas (Frec., CPC, CPM, Formato) → no se renderizan en la versión card.
- La tira `MockupBanner` permanece pero su segunda mitad ("Vista actual: Interna") se oculta.

---

## Qué se OCULTA en modo Cliente (independiente de breakpoint)

| Elemento | Razón |
|---|---|
| Filtro "Nivel" | El cliente no analiza por nivel; ya lo lleva curado. |
| KPIs `tech` (Frecuencia, CTR) | Métricas operativas. |
| Recomendaciones en `AlertRow` | Acciones internas. |
| Tab "Conjuntos" en `PerformanceTables` | Detalle operativo. |
| Sección entera de "Análisis por nivel" / tablas | Lleva `.internal-only`. Solo se ve el resumen y las alertas. |
| Sello "Vista mockup · datos no conectados" en el banner | Más sobrio. (Mantener el banner si los datos no están conectados, pero el subtítulo "Vista actual: Interna" se reemplaza por "Borrador para revisión".) |

---

## Reglas para tablas — checklist

1. Cabecera siempre presente, no sticky.
2. Numéricas a la derecha.
3. Nombre de la entidad con thumb a la izquierda. Thumb 36×36, border-radius 6px, patrón rayado en placeholder.
4. Status badge con punto interior.
5. Última columna siempre = alerta de la fila (`AlertCell`).
6. Hover: fondo `--backgroundDeep`. No cambio de cursor a menos que sea fila clickable.
7. En mobile, transformar a card list (ver arriba).
8. **No** introducir sticky columns en v1.

---

## Reglas para alertas — checklist

1. Severidad indicada por 3 señales redundantes: barra lateral 3px, etiqueta de severidad coloreada, pill del SeverityBadge en el header del panel.
2. Cuenta visible siempre.
3. Tipo de target (Campaña / Conjunto / Anuncio) en `<small>` debajo del target.
4. Recomendación oculta en modo cliente.
5. **Nunca** ocultar la alerta entera por modo. Cliente también ve qué está pasando, solo no ve qué hacer.

---

## Reglas para estados vacíos — checklist

1. Toda card sin datos muestra valor literal `—` o `$—` y badge `Sin datos`.
2. Toda sección sin datos muestra `EmptyState` centrado dentro del cuerpo, con título + body + acción opcional. Ver `UI_STATES.md`.
3. Nunca ocultar la sección entera. La estructura debe permanecer visible para que la trafficker sepa qué falta conectar.
