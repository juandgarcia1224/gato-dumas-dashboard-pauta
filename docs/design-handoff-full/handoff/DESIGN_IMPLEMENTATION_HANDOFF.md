# DESIGN IMPLEMENTATION HANDOFF
## Gato Dumas — Centro de Seguimiento Digital

Documento principal de entrega. Léelo de arriba hacia abajo antes de escribir cualquier línea de código. **Ninguna decisión queda abierta a interpretación.**

---

## 0. Origen y archivos de referencia

| Archivo | Rol |
|---|---|
| `Dashboard.html` | Mockup HTML/React de referencia. Fidelidad pixel a pixel. |
| `styles.css` | Estilos completos. Tokens declarados como CSS custom properties en `:root`. |
| `data.js` | Mock de datos. Marca explícita de placeholders. **NO conectar a fuentes reales aquí.** |
| `components-1.jsx` · `components-2.jsx` · `app.jsx` | Composición React de referencia. Estructura, props y orden de secciones definitivos. |
| `handoff/DESIGN_TOKENS.json` | Tokens canónicos. Fuente de verdad. |
| `handoff/COMPONENT_MAP.md` | Mapa componente ↔ React. |
| `handoff/RESPONSIVE_RULES.md` | Reglas exactas de breakpoints. |
| `handoff/UI_STATES.md` | Catálogo de estados. |
| `assets/logo_gato_dumas.png` | Logotipo oficial. No re-dibujar. |

---

## 1. Visión general

Dashboard ejecutivo de **una sola pantalla** (scroll vertical) para seguimiento de pauta digital de Meta Ads de **Instituto Gato Dumas**, operado por **CookMinds**. Cubre dos cuentas: **Gato Colombia** (Bogotá + Barranquilla) y **Gato Bucaramanga / Cinco Gatos**.

**Dos audiencias en la misma pantalla**:
1. **Modo Interno** (trafficker, operación): todas las secciones visibles.
2. **Modo Cliente** (presentación a Gato Dumas): se ocultan tablas operativas, recomendaciones internas y filtros técnicos. Mismo layout, menos densidad.

El cambio entre modos es un **toggle visible** (panel "Tweaks"). No son dos páginas distintas.

**No se conectan datos reales.** Todos los valores son placeholders. Marcadores permitidos (textualmente):
- `$—` — moneda vacía.
- `—` — número/porcentaje vacío.
- `Sin datos cargados`
- `Última actualización pendiente`
- `Ejemplo visual`
- `Placeholder`
- `Datos de ejemplo` (cuando se usa una curva ilustrativa, como la del pacing).

---

## 2. Arquitectura visual de la página

Orden vertical fijo. **No alterar.**

```
┌─────────────────────────────────────────────────────────────┐
│ A. TopBar (DashboardHeader)                                 │  72–96px alto
├─────────────────────────────────────────────────────────────┤
│ Banner mockup (visible mientras no haya datos reales)       │  ~44px
├─────────────────────────────────────────────────────────────┤
│ B. FilterBar                                                │  ~64px
├─────────────────────────────────────────────────────────────┤
│ J*. ExecStrip (Resumen ejecutivo — versión arriba)          │  ~180px
├─────────────────────────────────────────────────────────────┤
│ C. KPI Grid                                                 │  4 cols × 138px
├─────────────────────────────────────────────────────────────┤
│ D. Account Summary (Gato Colombia | Gato Bucaramanga)       │  ~360px
├─────────────────────────────────────────────────────────────┤
│ E. Pacing block (chart + panel)                             │  ~360px
├─────────────────────────────────────────────────────────────┤
│ F. Alerts Panel                                             │  variable
├─────────────────────────────────────────────────────────────┤
│ G/H/I. Performance Tables (tabs: Camp · Conj · Anuncios)    │  variable
├─────────────────────────────────────────────────────────────┤
│ J. ClientExecutiveSummary (fondo oscuro — cierre)           │  ~220px
├─────────────────────────────────────────────────────────────┤
│ Footer rule                                                 │  ~48px
└─────────────────────────────────────────────────────────────┘
```

> *El bloque ejecutivo aparece **dos veces**: una versión superior (`ExecStrip`) sirve de resumen rápido para la trafficker; la versión inferior (`ClientExecutiveSummary`, fondo oscuro) es la pieza presentable para cliente, fácil de capturar.

---

## 3. Layout desktop (≥1180px)

- Ancho máximo del contenido: **1480px**, centrado, padding lateral **36px**.
- Color de fondo del documento: `--bg` = `#F4F1EB` (Editorial Cream).
- Toda card / sección usa borde **1px `--hairline`** + `border-radius: 8px` + sombra `0 1px 0 rgba(21,24,27,.04), 0 1px 2px rgba(21,24,27,.04)`.
- Grid principal de KPIs: **4 columnas** equidistantes, gap **20px**.
- Grid de cuentas: **2 columnas** dentro de un mismo `Section`, separadas por un divisor vertical de 1px `--hairline` (no gap visual).
- Pacing: **2 columnas** internas, 1.6fr (chart) / 1fr (panel numérico). Divisor 1px.
- Tablas: **scroll horizontal** dentro del contenedor cuando exceden el ancho. Nunca colapsar columnas en desktop.

### Espaciado vertical entre bloques principales
- Entre cualquier sección y la siguiente: **24px** (`margin-bottom: 24px` en `.row` / spacers explícitos).
- Dentro de una sección (entre `section-head` y contenido): **0** (la cabecera define su propio padding).

---

## 4. Layout tablet (≥760px y <1180px)

- Ancho del contenedor: **100%** con padding lateral **24px**.
- KPI Grid: pasa de 4 a **3 columnas**.
- Pacing block: las dos columnas internas se **apilan** (chart arriba, panel debajo). El divisor pasa a ser un borde superior.
- Exec strip: el bloque negro de la izquierda ocupa todo el ancho (fila propia); abajo, 2 columnas con las 3 celdas ejecutivas → la tercera celda baja a fila propia.
- Tablas: mantienen scroll horizontal.
- TopBar: mantiene su layout horizontal mientras quepa; debajo de 980px puede romper la fila de meta-pills a 2×2.

---

## 5. Layout mobile (<760px)

- Ancho del contenedor: **100%** con padding lateral **18px**.
- TopBar pasa a 2 filas: marca arriba, meta + botones abajo con `flex-wrap`.
- FilterBar: cada `filter-group` ocupa fila propia.
- KPI Grid: **1 columna**. Prioridad de KPIs (orden visible primero, los demás se siguen mostrando pero los primeros 3 son los hero):
  1. Inversión total
  2. % consumido
  3. Costo por resultado
  4. Resultados
  5. Campañas activas
  6. Alertas críticas
  7. (Ocultos en modo cliente: Frecuencia, CTR)
  8. Presupuesto planeado
- Account Summary: las dos cuentas se apilan (una columna). Divisor pasa a borde superior.
- Pacing: igual que tablet, apilado.
- Alerts: cada `alert-row` se reorganiza:
  - Fila 1: severidad + qué + cuenta + target
  - Fila 2: métrica + recomendación
  - Fila 3: acción "Ver detalle"
- **Tablas en mobile**: se transforman en **tarjetas (card list)**. Cada fila se renderiza como una tarjeta vertical con:
  - Header: thumb 36px + nombre + cuenta
  - Stats en grid 2×2 (Inversión, Resultados, CPR, CTR)
  - Footer: estado + alerta
- Exec strip y Client exec: **1 columna**, celdas apiladas.

---

## 6. Qué componente va en cada sección

Ver detalle completo en `COMPONENT_MAP.md`. Resumen:

| Sección | Componente |
|---|---|
| A | `DashboardHeader` |
| Banner | `MockupBanner` |
| B | `FilterBar` |
| J* (top) | `ExecStrip` |
| C | `KpiGrid` (lista de `MetricCard`) |
| D | `AccountSummary` (dos `AccountCard` lado a lado) |
| E | `PacingChart` (envuelve SVG line + `PacingPanel`) |
| F | `AlertsPanel` (lista de `AlertRow` con `SeverityBadge`) |
| G/H/I | `PerformanceTables` (tabs) que renderiza `CampaignTable`, `AdsetTable`, `AdsTable` |
| J | `ClientExecutiveSummary` |
| Footer | `FooterRule` |

---

## 7. Datos que consume cada componente

```ts
DashboardHeader        ← { brandName, title, subtitle, lastUpdate, connection: 'ok'|'warn'|'crit', connectionLabel }
FilterBar              ← { range, accounts[], levels[], value, onChange }
ExecStrip              ← { works, attn, next } (cada uno: { head, body, foot })
KpiGrid                ← MetricCard[] (id, label, value, unit, ctx, trend, status, placeholder, alert, tech)
AccountSummary         ← Account[] (id, name, cities, status, statusLabel, stats[], pacing{spent, expected, fill})
PacingChart            ← { isExample, days, expectedLine[], realLine[], spentToday, expectedToday, deltaToday, deltaSeverity, statusToday }
AlertsPanel            ← Alert[] (sev: 'crit'|'warn'|'info', label, what, account, target, targetType, metric, metricLabel, reco)
CampaignTable          ← Campaign[] (name, acct, status, spend, results, cpr, freq, ctr, cpc, cpm, alert)
AdsetTable             ← Adset[] (name, camp, acct, status, spend, results, cpr, freq, ctr, alert)
AdsTable               ← Ad[] (name, camp, acct, format, status, spend, results, cpr, ctr, alert)
ClientExecutiveSummary ← { works, attn, next }
```

---

## 8. Estados de cada componente

Ver detalle exacto en `UI_STATES.md`. Cada componente debe implementar como mínimo:

- `loading`, `empty`, `error`, `ok`, `warn`, `crit`.

`MetricCard` añade: `placeholder` (cuando `value === '—'`).
`AlertRow` añade: `dismissed`.
`PacingChart` añade: `noPlan` (sin presupuesto planeado).

---

## 9. Qué NO debe hacer Claude Code

1. **No** inventar datos. Cualquier valor sin fuente debe ser `—` o `$—`.
2. **No** reordenar las secciones.
3. **No** cambiar la tipografía. Raleway (UI) + Oswald (display numérico) son del manual de marca.
4. **No** alterar la paleta. El acento es `#28808D` (institucional Gato Dumas). Si necesitas más colores, úsalos solo dentro de la familia de status (`--ok`, `--warn`, `--crit`, `--info`).
5. **No** introducir gradientes coloridos, sombras pronunciadas, glassmorphism ni iconos coloridos. Estética **editorial / instituto**, no SaaS genérico.
6. **No** usar emojis.
7. **No** romper el motivo gráfico: hairline `1px`, bordes finos, separación por borde antes que por gap grande, marca tipográfica tipo "manual impreso".
8. **No** intentar dibujar el logo en SVG. Usar `assets/logo_gato_dumas.png`.
9. **No** crear pantallas separadas para modo interno y cliente. Es la **misma página** con `[data-mode]` en `<html>` y reglas CSS que ocultan/muestran.
10. **No** usar librerías de gráficas pesadas (Recharts, Chart.js, etc.). El chart de pacing es un SVG plano de ~30 líneas que ya está en `components-1.jsx`. Mantenerlo así.
11. **No** sustituir Raleway/Oswald por Inter, Roboto, system-ui, etc.
12. **No** convertir el dashboard en multi-página. Es **una sola ruta**.

---

## 10. Implementación sugerida (React / Next.js / Tailwind)

### Estructura de carpetas

```
src/
  app/
    (dashboard)/
      page.tsx                  → composición de secciones
      layout.tsx                → fuentes Raleway + Oswald, tokens CSS
  components/
    dashboard/
      DashboardHeader.tsx
      MockupBanner.tsx
      FilterBar.tsx
      ExecStrip.tsx
      KpiGrid.tsx
      MetricCard.tsx
      AccountSummary.tsx
      AccountCard.tsx
      PacingChart.tsx
      PacingPanel.tsx
      AlertsPanel.tsx
      AlertRow.tsx
      PerformanceTables.tsx
      CampaignTable.tsx
      AdsetTable.tsx
      AdsTable.tsx
      ClientExecutiveSummary.tsx
      FooterRule.tsx
      ui/
        StatusBadge.tsx
        SeverityBadge.tsx
        EmptyState.tsx
        Trend.tsx
        Meter.tsx
  styles/
    tokens.css                  ← copiar de DESIGN_TOKENS.json
    globals.css
  data/
    mock.ts                     ← portar data.js, con tipos
  types/
    dashboard.ts
```

### Tailwind

- Configurar tokens en `tailwind.config.ts` extendiendo `theme.colors`, `theme.fontFamily`, `theme.boxShadow`, `theme.borderRadius` desde `DESIGN_TOKENS.json`.
- Habilitar `@layer base` para tipografía Raleway global.
- Fuentes con `next/font/google`: Raleway (400, 500, 600, 700, 800) + Oswald (300, 400, 500, 600) + JetBrains Mono (400, 500).

### Modo Interno vs Cliente

- Estado en server component vía cookie `gd_mode` o local state. Aplicar atributo en `<html data-mode="interno|cliente">`.
- Las reglas de ocultación están en `styles.css` (`[data-mode="cliente"] .internal-only { display:none }`). **Mantener exactamente esa convención**.
- Elementos con `className="internal-only"` desaparecen en modo cliente. KPIs marcados `tech` también (`.kpi.tech`). Sección de tablas operativas entera está envuelta en `.internal-only`.

### Tema claro / oscuro

- `<html data-theme="light|dark">`. Tokens ya están duplicados en `:root` y `[data-theme="dark"]`. No cambiar nombres de tokens.

---

## 11. Aceptación visual

La implementación se considera fiel cuando:

1. Tipografía Raleway en UI y Oswald en todos los números de display (`.value`, `.stat-v`, `td.num`).
2. Fondo `#F4F1EB`, superficies `#FFFFFF`, acento `#28808D`.
3. Ningún número real visible — todos `—`, `$—` o etiquetados `Datos de ejemplo`.
4. Toggle Interno/Cliente cambia visibilidad sin recargar la página y sin cambiar de ruta.
5. En 1440px, KPI grid muestra 4 columnas. En 1024px, 3. En 768px, 1.
6. Las alertas críticas muestran barra lateral roja (`#B23A48`) de 3px.
7. La tabla con 11 columnas hace scroll horizontal sin desbordar la página.
8. El bloque ejecutivo inferior tiene fondo `--ink` (`#15181B`) y texto claro.
9. La marca aparece como imagen, nunca redibujada.
10. No hay sombras gruesas ni gradientes coloridos en ninguna parte.

---

## 12. Glosario rápido

- **CPR**: Costo por resultado
- **CPM**: Costo por mil impresiones
- **CPC**: Costo por clic
- **CTR**: Click-through rate
- **Pacing**: Velocidad de consumo del presupuesto vs lo planeado
- **Subconsumo / Sobreconsumo**: Estado del pacing fuera del rango ±10 puntos esperado.
- **Trafficker**: Operadora de pauta (Paola / Juan en CookMinds).
