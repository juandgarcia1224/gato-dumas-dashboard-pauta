# DESIGN INTEGRATION NOTES — Bloque 3

Integración del diseño de **Cloud Design** sobre el dashboard técnico existente,
**sin tocar la arquitectura de datos**:

```
Meta Graph API → transform → Google Sheets → /api/dashboard → DashboardPayload
        → (NUEVO) viewmodel.buildDashboardVM → componentes de Cloud Design
```

## 1. Archivos del ZIP leídos

Todos copiados a `docs/design-handoff-full/` (estructura original preservada):

- `handoff/DESIGN_IMPLEMENTATION_HANDOFF.md`, `DESIGN_TOKENS.json`, `COMPONENT_MAP.md`,
  `RESPONSIVE_RULES.md`, `UI_STATES.md`, `INSTRUCCIONES_CLAUDE_CODE.md`, `README.md`
- `Dashboard.html`, `styles.css`, `app.jsx`, `components-1.jsx`, `components-2.jsx`,
  `tweaks-panel.jsx`, `data.js`
- `assets/logo_gato_dumas.png`, `screenshots/`, `visual-reference/`, `uploads/` (manual de marca)

## 2. Referencia visual principal

- **`styles.css`** + **`DESIGN_TOKENS.json`** → fidelidad de estilo (portados tal cual).
- **`components-1.jsx` / `components-2.jsx` / `app.jsx`** → estructura DOM y orden de secciones.
- **`COMPONENT_MAP.md` / `UI_STATES.md` / `RESPONSIVE_RULES.md`** → props, estados y breakpoints.
- `Dashboard.html` y `screenshots/` → referencia visual del resultado esperado.

## 3. Mapeo Cloud Design → componentes reales del proyecto

| Cloud Design | Implementado en | Fuente de datos |
|---|---|---|
| `DashboardShell` | `src/components/DashboardShell.tsx` | fetch `/api/dashboard` → `buildDashboardVM` |
| `TopBar` / `DashboardHeader` + `MetaPill` | `DashboardHeader.tsx` | `vm.header` |
| `MockupBanner` → **banners de estado real** | `StatusBanners.tsx` | `vm.banners` (de `status.notices`) |
| `FilterBar` / `SegmentedControl` / `AccountChip` | `FilterBar.tsx` | `status.accounts`, filtro de cuenta real |
| `ExecStrip` / `ExecCell` | `ExecStrip.tsx` | `vm.exec` (derivado de datos reales) |
| `ClientExecutiveSummary` | `ClientExecutiveSummary.tsx` | `vm.exec` |
| `KpiGrid` / `MetricCard` / `Trend` / `ExampleStamp` | `KpiGrid.tsx` | `vm.kpis` (9 KPIs) |
| `AccountSummary` / `AccountCard` / `Stat` / `Meter` / `StatusBadge` | `AccountSummary.tsx` | `vm.accounts` + pacing |
| `PacingChart` / `PacingLineChart` / `PacingPanel` | `PacingChart.tsx` (SVG inline, sin librerías) | `vm.pacing` |
| `AlertsPanel` / `AlertRow` / `SeverityBadge` | `AlertsPanel.tsx` | `vm.alerts` + `vm.alertCounts` |
| `PerformanceTables` / `CampaignTable` / `AdsetTable` / `AdsTable` / `AlertCell` / `EntityCell` / `CardList` | `PerformanceTables.tsx` | `vm.campaigns/adsets/ads` |
| `EmptyState` | `EmptyState.tsx` | estados vacíos UI_STATES |
| `FooterRule` | `FooterRule.tsx` | — |

- Tokens: `DESIGN_TOKENS.json` → CSS custom properties en `src/app/globals.css`
  (`:root` + `[data-theme="dark"]`) y `tailwind.config.ts`.
- Fuentes: **Raleway / Oswald / JetBrains Mono** vía `next/font/google` en `layout.tsx`.
- Logo: `public/assets/logo_gato_dumas.png` (copiado del ZIP, no redibujado), vía `next/image`.

## 4. Implementado fielmente

- Paleta institucional (cream `#F4F1EB`, teal `#28808D`, ink `#15181B`), tipografías y radios.
- CSS del diseño portado **clase por clase** (`.kpi`, `.section`, `.exec-strip`, `.alert-row`, `.tbl`, `.meter`, etc.).
- Orden de secciones del PASO 7 (Header → Banner → FilterBar → ExecStrip → KPIs → Cuentas → Pacing → Alertas → Tablas → Resumen cliente → Footer).
- Modo **Interno/Cliente** por `data-mode` en `<html>` + reglas CSS (`.internal-only`, `.kpi.tech`, `.alert-row .reco`, `.filter-group.level`, `.tab.tech-only`). Sin branches en JSX, sin rutas separadas.
- Tema claro/oscuro (`data-theme`), densidad (`data-density`).
- Responsive (breakpoints 480/760/1180/1480; tablas → card list en `<760px`).
- Estados de UI_STATES: loading (skeleton), sin datos, error, token/sheet no configurado, última actualización pendiente, cuenta sin gasto, campaña sin conversiones, severidades.

## 5. Adaptado por la arquitectura real (con justificación)

| Diseño asumía | Realidad del proyecto | Adaptación |
|---|---|---|
| `data.js` / mock como fuente | Fuente real es `/api/dashboard` | Se creó `viewmodel.ts` que mapea `DashboardPayload` → view-models. `data.js` **no se importa**. |
| Banner "Mockup visual" | Hay estados reales de conexión | Reemplazado por `StatusBanners` que muestra `status.notices` reales (token/sheet/no-data). |
| Botón "Actualizar" sin acción | La sync real es por terminal | El botón **recarga la vista** desde el API; la sync con Meta sigue siendo `npm run meta:update` (tooltip lo aclara). |
| Curva de pacing diaria | No guardamos historial diario | El gráfico usa los % reales de hoy/esperado (endpoints reales) con interpolación lineal **declarada** ("proyección lineal · historial diario pendiente"). Sin inventar trayectoria. |
| Filtro de Rango interactivo | El rango lo fija `meta:update` | El segmented refleja el rango cargado; las otras opciones quedan deshabilitadas con tooltip. |
| Exportar CSV | No implementado en Fase 3 | Botón presente pero deshabilitado (tooltip). |
| Trend "vs período anterior" | No hay histórico comparativo | Se muestra "— vs período ant." (sin inventar deltas). |
| Columna "Formato" en Anuncios | No viene de Insights básicos | Omitida de la tabla de anuncios (no inventar formato). |

## 6. No implementado (y por qué)

- **TweaksPanel** (`tweaks-panel.jsx`): herramienta de diseño/preview, fuera de alcance productivo.
- **Exportar CSV / Exportar**: deshabilitado (Fase futura; export por terminal).
- **Acento configurable / densidad UI completa**: el toggle de densidad existe vía `data-density` pero no se expuso control en UI (no requerido por Bloque 3).
- **Tab "Conjuntos" en cliente**: oculta por diseño (`tech-only`).

## 7. Confirmación: `data.js` NO es fuente productiva

`grep -rn import src/ | grep -i mock` → **0 resultados**. `data.js` vive solo en
`docs/design-handoff-full/` como referencia. El dashboard nunca lo importa.

## 8. Confirmación: `/api/dashboard` sigue siendo la fuente real

`DashboardShell` hace `fetch('/api/dashboard?account=...')` y pasa el `DashboardPayload`
por `buildDashboardVM`. Verificado con payload real (sin credenciales): `connected=false`,
KPIs en `$—`/`—`, pacing `null`, banners de configuración. **Cero datos inventados.**

## 9. Archivos modificados / creados

**Modificados:** `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`,
`src/app/page.tsx`, `src/components/{DashboardShell,DashboardHeader,AlertsPanel,PacingChart,EmptyState}.tsx`.

**Creados:** `src/lib/dashboard/{design-types.ts,viewmodel.ts}`,
`src/components/{StatusBanners,FilterBar,ExecStrip,ClientExecutiveSummary,KpiGrid,AccountSummary,PerformanceTables,FooterRule}.tsx`,
`public/assets/logo_gato_dumas.png`, `docs/design-handoff-full/**` (ZIP), este documento.

**Eliminados (provisionales Fase 1):** `src/components/{AccountSelector,AccountSummaryTable,KpiCards,LastUpdateCard,CampaignTable,AdsetTable,AdsTable}.tsx`.

**Intactos (backend, sin tocar):** `scripts/*`, `src/lib/meta/*`, `src/lib/sheets/*`,
`src/lib/config/*`, `src/lib/dashboard/{contract,metrics,alerts,pacing,formatters}.ts`,
`src/app/api/*`. RESULT_PRIORITY sin cambios. Schemas de Sheets sin cambios.
