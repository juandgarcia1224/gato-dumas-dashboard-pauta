# COMPONENT MAP
## Gato Dumas — Centro de Seguimiento Digital

Mapa exacto entre **sección visual del mockup** y **componente React** que Claude Code debe implementar. Las columnas `Props/Datos` y `Notas` son **obligatorias** — no improvisar.

> Tipos referenciados (`Account`, `Alert`, `Campaign`, `Adset`, `Ad`, `ExecBlock`) están definidos al final del documento.

---

## 1. Layout

| Sección visual | Componente React | Props / datos esperados | Notas de implementación |
|---|---|---|---|
| Documento entero | `DashboardShell` | `{ children, mode: 'interno' \| 'cliente', theme: 'light' \| 'dark', density: 'comfortable' \| 'compact' }` | Server component. Setea `<html data-mode data-theme data-density>` y monta tokens CSS. Carga Raleway/Oswald/JetBrains Mono con `next/font/google`. Centra contenido a `max-width: 1480px`, padding `28px 36px 80px`. |
| Banner amarillento de aviso | `MockupBanner` | `{ visible: boolean, mode }` | Visible mientras `process.env.NEXT_PUBLIC_DATA_CONNECTED !== '1'`. Borde discontinuo `--brand-teal-200`, fondo rayado a 45°. Texto: "Mockup visual · No hay datos reales conectados." |

---

## 2. Topbar y filtros

| Sección visual | Componente React | Props / datos esperados | Notas |
|---|---|---|---|
| A. Header superior | `DashboardHeader` | `{ brand: { name, subtitle, kicker }, lastUpdate: string \| null, connection: { status: 'ok' \| 'warn' \| 'crit', label }, onRefresh: () => void, refreshDisabled: boolean }` | Logo: `<Image src="/assets/logo_gato_dumas.png" alt="Instituto Gato Dumas" width={56} height={56} />` (relación 1:1 — el PNG está cuadrado con padding). Botón "Actualizar datos" tipo `primary`. En modo cliente, el botón mantiene visible pero `disabled` (la actualización la hace Claude Code por terminal). |
| Pill de meta (Última actualización / Estado de conexión) | `MetaPill` | `{ label, value, status?: 'ok' \| 'warn' \| 'crit' }` | Reutilizable. Punto de estado de 8px + halo de 3px del mismo color al 15%. |
| B. Filtros principales | `FilterBar` | `{ value: { range, account, level }, onChange, options: { ranges, accounts, levels } }` | Compuesta por 3 `FilterGroup`. En modo cliente, el grupo "Nivel" se oculta (`className="level"` + CSS). |
| Grupo de filtro (Rango / Nivel) | `SegmentedControl` | `{ options: string[], value, onChange }` | Segmented control con thumb deslizante. No usar `<select>`. |
| Chip de cuenta | `AccountChip` | `{ account: 'all' \| 'co' \| 'bga', active, onClick }` | Punto teal para "Gato Colombia", punto warning para "Gato Bucaramanga". |

---

## 3. Resumen ejecutivo (top y bottom)

| Sección visual | Componente React | Props / datos esperados | Notas |
|---|---|---|---|
| J* (top) Tira de resumen | `ExecStrip` | `{ data: { works: ExecBlock, attn: ExecBlock, next: ExecBlock }, mode }` | Grid 4 columnas: header negro 240px + 3 celdas. En tablet/mobile colapsa según RESPONSIVE_RULES. |
| Celda ejecutiva | `ExecCell` | `{ tone: 'ok' \| 'warn' \| 'next', head, body, foot }` | Punto de color en el head. Cuerpo en 13.5px font-weight 500. |
| J (bottom) Resumen presentable | `ClientExecutiveSummary` | `{ data: { works, attn, next } }` | Misma data que ExecStrip pero fondo `--ink`, texto claro. Pensado para captura. **No** ocultar en modo interno (sirve para presentar al cliente desde dentro del modo interno). |

---

## 4. KPIs

| Sección visual | Componente React | Props / datos esperados | Notas |
|---|---|---|---|
| C. Grid de KPIs | `KpiGrid` | `{ items: MetricCard[] }` | Grid 4 cols en desktop, 3 en tablet, 1 en mobile. Gap 20px. |
| Tarjeta KPI | `MetricCard` | `{ id, label, value, unit?, ctx, trend?: { delta, dir: 'up' \| 'down' \| 'flat' \| 'warn' }, status: 'ok' \| 'warn' \| 'crit' \| 'empty', placeholder?: boolean, accent?: boolean, alert?: boolean, tech?: boolean }` | Si `placeholder`, mostrar valor literal `—` o `$—` + footer "Sin datos". Si `accent`, barra teal lateral de 3px. Si `alert`, barra crit lateral de 3px. `tech: true` → la card desaparece en modo cliente vía `.kpi.tech`. |
| Chip de tendencia | `Trend` | `{ delta?: string, dir }` | Pill 11px. Sin signo si dir flat, "+/−" cuando hay delta. |
| Sello "Placeholder" | `ExampleStamp` | `{ children }` | Texto JetBrains Mono 9.5px tracking 0.16em uppercase + bullet circular hueco 6px. |

### Orden y composición de KPIs

| # | id | label | accent | tech | alert |
|---|---|---|---|---|---|
| 1 | `spend`   | Inversión total | ✓ | | |
| 2 | `budget`  | Presupuesto planeado | | | |
| 3 | `pct`     | % consumido | | | |
| 4 | `results` | Resultados | | | |
| 5 | `cpr`     | Costo por resultado | | | |
| 6 | `freq`    | Frecuencia promedio | | ✓ | |
| 7 | `ctr`     | CTR promedio | | ✓ | |
| 8 | `active`  | Campañas activas | | | |
| 9 | `alerts`  | Alertas críticas | | | ✓ |

---

## 5. Resumen por cuenta

| Sección visual | Componente React | Props / datos esperados | Notas |
|---|---|---|---|
| D. Bloque comparativo | `AccountSummary` | `{ accounts: Account[] }` | Espera **exactamente 2** cuentas. Renderiza `AccountCard` lado a lado en desktop. |
| Card de cuenta | `AccountCard` | `{ account: Account }` | Header: pill "CTA" en `instituto-frame` + nombre + ciudades + `StatusBadge`. Grid 4×2 de `Stat`. Meter de pacing al pie. |
| Mini estadística | `Stat` | `{ k, v, u?, d? }` | Etiqueta 9.5px tracking 0.18em, valor Oswald 22px. |
| Barra de pacing | `Meter` | `{ value: 0–100, marker?: 0–100, tone: 'ok' \| 'warn' \| 'crit' }` | 4px alto, fill teal/warn/crit. Tick vertical de 1px en `marker` (gasto esperado). |

---

## 6. Pacing

| Sección visual | Componente React | Props / datos esperados | Notas |
|---|---|---|---|
| E. Bloque de pacing | `PacingChart` | `{ data: PacingData }` | Wrapper con header de sección + grid interno 1.6fr / 1fr. |
| Gráfica SVG | `PacingLineChart` | `{ expected: number[], real: number[], todayIndex: number }` | SVG plano. Sin librería externa. Líneas: expected punteada gris, real teal sólida + área teal 8%. Marca vertical "HOY" en el último punto real. Eje Y en 5 ticks 0/25/50/75/100%. |
| Panel numérico | `PacingPanel` | `{ spentToday, expectedToday, deltaToday, deltaSeverity, statusToday }` | Grid 2×2 de `Stat`. Meter inferior con marker. |

---

## 7. Alertas

| Sección visual | Componente React | Props / datos esperados | Notas |
|---|---|---|---|
| F. Panel completo | `AlertsPanel` | `{ alerts: Alert[], mode }` | Header con conteo por severidad usando `SeverityBadge`. Lista de `AlertRow`. |
| Fila de alerta | `AlertRow` | `{ alert: Alert, mode }` | Grid 6 columnas: `sev | what+account | target | metric | reco (oculta en cliente) | action`. Barra lateral 3px del color de severidad. |
| Badge de severidad | `SeverityBadge` | `{ sev: 'crit' \| 'warn' \| 'info' \| 'ok', label?, count? }` | Pill estandarizado. Si `count`, muestra "{count} críticas" etc. |
| Badge de estado (acción concluida) | `StatusBadge` | `{ status: 'active' \| 'paused' \| 'draft' \| 'archived' }` | Mapea a `ok/ghost/info/ghost` con etiquetas en español. |

---

## 8. Tablas de performance

| Sección visual | Componente React | Props / datos esperados | Notas |
|---|---|---|---|
| G/H/I. Contenedor con tabs | `PerformanceTables` | `{ initialTab?: 'Campañas' \| 'Conjuntos' \| 'Anuncios' }` | Tabs en `section-head`. La tab "Conjuntos" tiene clase `tech-only` → oculta en cliente. Botón "Exportar CSV" a la derecha. |
| Tab | `Tab` | `{ id, count, active, onClick }` | Borde inferior `--brand-teal` 2px en active. Pill numérico al lado del texto. |
| Tabla de campañas | `CampaignTable` | `{ rows: Campaign[] }` | 11 columnas: Campaña / Cuenta / Estado / Inversión / Resultados / CPR / Frec. / CTR / CPC / CPM / Alerta. Numéricas alineadas a la derecha + `Oswald` 13.5px. |
| Tabla de conjuntos | `AdsetTable` | `{ rows: Adset[] }` | 10 columnas: Conjunto / Campaña / Cuenta / Estado / Inversión / Resultados / CPR / Frec. / CTR / Alerta. |
| Tabla de anuncios | `AdsTable` | `{ rows: Ad[] }` | 10 columnas: Anuncio / Campaña / Cuenta / Formato / Estado / Inversión / Resultados / CPR / CTR / Alerta. |
| Celda primera (nombre) | `EntityCell` | `{ thumbLabel: 'CMP' \| 'CJ' \| 'AD', name, sub? }` | Thumb 36px con patrón rayado diagonal (placeholder). Sin imágenes reales hasta que existan. |
| Celda de alerta en tabla | `AlertCell` | `{ alert: 'crit' \| 'warn' \| 'info' \| null }` | Pill compacto. `null` → "Sin alerta" verde. |

---

## 9. Estado y utilitarios

| Componente | Props | Uso |
|---|---|---|
| `EmptyState` | `{ kind: 'no-data' \| 'error' \| 'token' \| 'sheet', title, body, action? }` | Placeholder centrado dentro de una `Section`. Ver UI_STATES.md por mensajes exactos. |
| `Skeleton` | `{ w?, h?, radius? }` | Bloques de carga. Color `--bg-deep`. |
| `Spinner` | `{ size?: 14 \| 18 \| 24 }` | SVG con stroke `--brand-teal`. |
| `Section` | `{ title, sub?, actions?, children }` | Wrapper estándar con header + body. Tokens en `cardStyles.section`. |
| `SectionHeading` | `{ title, sub? }` | Heading con regla horizontal 28×1px antes del título. |
| `MockupBanner` | `{ visible, mode }` | Ver §1. |
| `FooterRule` | `{ }` | Pie de página con marca y versión. |
| `Trend` | `{ delta, dir }` | Pill numérico. |
| `Meter` | `{ value, marker?, tone }` | Barra horizontal 4px. |
| `ExampleStamp` | `{ children }` | Sello tipográfico. |

---

## 10. Modo Interno vs Cliente — Reglas de visibilidad

Estas reglas viven en `styles.css`. **No** crear branches en JSX para ocultar.

| Selector | Resultado en `data-mode="cliente"` |
|---|---|
| `.internal-only` | `display: none` |
| `.kpi.tech` | `display: none` (Frecuencia y CTR fuera de la grid) |
| `.alert-row .reco` | `display: none` (las recomendaciones internas no se muestran al cliente) |
| `.filter-bar .filter-group.level` | `display: none` |
| `.tabs .tab.tech-only` | `display: none` (esconde la tab "Conjuntos") |

> El bloque entero de `PerformanceTables` está envuelto en un `<div className="internal-only">`. Eso se mantiene.

---

## 11. Tipos (TypeScript canónicos)

```ts
export type Severity = 'crit' | 'warn' | 'info' | 'ok';
export type Status   = 'active' | 'paused' | 'draft' | 'archived';

export interface ExecBlock {
  head: string;
  body: string;
  foot?: string;
}

export interface MetricCard {
  id: 'spend' | 'budget' | 'pct' | 'results' | 'cpr' | 'freq' | 'ctr' | 'active' | 'alerts';
  label: string;
  value: string;          // siempre string para soportar '—' / '$—'
  unit?: string;
  ctx?: string;
  trend?: { delta?: string; dir: 'up' | 'down' | 'flat' | 'warn' };
  status: 'ok' | 'warn' | 'crit' | 'empty';
  placeholder?: boolean;
  accent?: boolean;
  alert?: boolean;
  tech?: boolean;
}

export interface AccountStat { k: string; v: string; u?: string; d?: string; }

export interface Account {
  id: 'gato-co' | 'gato-bga';
  name: string;
  cities: string;
  status: Severity;
  statusLabel: string;
  stats: AccountStat[];   // exactamente 8 entradas, en este orden:
  // Inversión, Presupuesto, % consumo, Resultados, Costo / res., Frecuencia, CTR, Campañas
  pacing: { spent: number; expected: number; fill: number };
}

export interface PacingData {
  isExample: boolean;
  days: number;
  expectedLine: number[];
  realLine: number[];
  spentToday: string;       // "62%"
  expectedToday: string;    // "83%"
  deltaToday: string;       // "−21 pts"
  deltaSeverity: Severity;
  statusToday: string;      // "Bajo consumo"
}

export interface Alert {
  sev: Severity;
  label: string;
  what: string;
  account: string;
  target: string;
  targetType: 'Campaña' | 'Conjunto' | 'Anuncio';
  metric: string;
  metricLabel: string;
  reco: string;
}

export interface Campaign {
  name: string; acct: string; status: Status;
  spend: string; results: string; cpr: string; freq: string;
  ctr: string; cpc: string; cpm: string;
  alert: 'crit' | 'warn' | 'info' | null;
}
export interface Adset {
  name: string; camp: string; acct: string; status: Status;
  spend: string; results: string; cpr: string; freq: string; ctr: string;
  alert: 'crit' | 'warn' | 'info' | null;
}
export interface Ad {
  name: string; camp: string; acct: string;
  format: 'Carrusel' | 'Reel' | 'Imagen' | 'Video';
  status: Status;
  spend: string; results: string; cpr: string; ctr: string;
  alert: 'crit' | 'warn' | 'info' | null;
}
```
