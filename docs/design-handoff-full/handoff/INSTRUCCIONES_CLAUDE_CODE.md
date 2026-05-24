# INSTRUCCIONES DIRECTAS PARA CLAUDE CODE
## Gato Dumas — Centro de Seguimiento Digital · Implementación

> Copia y pega este bloque entero en Claude Code. Está escrito como una orden ejecutable. No re-interpretes los archivos: léelos y reprodúcelos.

---

```
ROL
Sos Claude Code. Vas a implementar un dashboard en Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS 3 según un paquete de diseño cerrado. NO improvisar visualmente. NO sustituir tipografías ni colores. NO conectar a fuentes reales en esta fase.

OBJETIVO
Reproducir, con fidelidad pixel a pixel, el dashboard "Gato Dumas — Centro de Seguimiento Digital" entregado en este proyecto.

PASO 0 — LEER ANTES DE TOCAR CÓDIGO
Abrí y leé íntegramente, en este orden:
  1. handoff/DESIGN_IMPLEMENTATION_HANDOFF.md
  2. handoff/DESIGN_TOKENS.json
  3. handoff/COMPONENT_MAP.md
  4. handoff/RESPONSIVE_RULES.md
  5. handoff/UI_STATES.md
  6. Dashboard.html
  7. styles.css
  8. data.js
  9. components-1.jsx
 10. components-2.jsx
 11. app.jsx

Cuando termines, hacé un resumen interno de 10 líneas con: paleta, tipografía, breakpoints, secciones y modos. Si algo no se entiende, NO inventes — preguntá.

PASO 1 — SCAFFOLD
Creá un proyecto Next.js con:
  npx create-next-app@14 gato-dumas-dashboard --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"

Instalá:
  npm i lucide-react clsx

PASO 2 — TOKENS
  - Copiá handoff/DESIGN_TOKENS.json a src/styles/tokens.json.
  - Generá src/styles/tokens.css con CSS custom properties idénticas a las del :root de styles.css (mismas variables, mismos nombres: --background, --paper, --surface, --primary, --secondary, --text-primary, --text-secondary, --text-muted, --border, --border-strong, --success, --warning, --danger, --info, etc.). Incluí también el bloque [data-theme="dark"].
  - Extendé tailwind.config.ts:
      colors:      desde tokens (background, paper, surface, primary, secondary, success, warning, danger, info, ink, muted).
      fontFamily:  sans: ['var(--font-raleway)'], display: ['var(--font-oswald)'], mono: ['var(--font-mono)'].
      borderRadius: { sm:'4px', md:'8px', lg:'14px', pill:'100px' }
      boxShadow:    { card: tokens.shadows.card, raised: tokens.shadows.raised, panel: tokens.shadows.panel }
  - Cargá fuentes con next/font/google: Raleway (400, 500, 600, 700, 800), Oswald (300, 400, 500, 600), JetBrains_Mono (400, 500). Exponelas como variables CSS y aplicalas en <html className={...}>.

PASO 3 — ARQUITECTURA DE ARCHIVOS
Estructura obligatoria:
  src/
    app/
      layout.tsx           ← fuentes, tokens, <html data-mode data-theme>
      page.tsx             ← composición del dashboard
      providers.tsx        ← context de modo/theme/density con cookies
    components/dashboard/
      DashboardShell.tsx
      DashboardHeader.tsx
      MockupBanner.tsx
      FilterBar.tsx
      ExecStrip.tsx
      ClientExecutiveSummary.tsx
      KpiGrid.tsx
      MetricCard.tsx
      AccountSummary.tsx
      AccountCard.tsx
      PacingChart.tsx
      PacingPanel.tsx
      PacingLineChart.tsx
      AlertsPanel.tsx
      AlertRow.tsx
      PerformanceTables.tsx
      CampaignTable.tsx
      AdsetTable.tsx
      AdsTable.tsx
      FooterRule.tsx
      ui/
        StatusBadge.tsx
        SeverityBadge.tsx
        AlertCell.tsx
        EntityCell.tsx
        EmptyState.tsx
        Trend.tsx
        Meter.tsx
        ExampleStamp.tsx
        SegmentedControl.tsx
        AccountChip.tsx
        MetaPill.tsx
        Section.tsx
        Skeleton.tsx
        Spinner.tsx
    data/
      mock.ts              ← portar data.js a TS con los tipos de COMPONENT_MAP §11
    types/
      dashboard.ts         ← tipos canónicos de COMPONENT_MAP §11
    styles/
      tokens.css
      globals.css

PASO 4 — COMPOSICIÓN DE LA PÁGINA
src/app/page.tsx debe renderizar, en este orden estricto:
  <DashboardShell>
    <DashboardHeader … />
    <MockupBanner visible={!process.env.NEXT_PUBLIC_DATA_CONNECTED} />
    <FilterBar … />
    <ExecStrip data={mock.exec} />
    <KpiGrid items={mock.kpis} />
    <AccountSummary accounts={mock.accounts} />
    <PacingChart data={mock.pacingExample} />
    <AlertsPanel alerts={mock.alerts} />
    <div className="internal-only">
      <SectionHeading title="Análisis por nivel" sub="Vista operativa…" />
      <PerformanceTables />
    </div>
    <ClientExecutiveSummary data={mock.exec} />
    <FooterRule />
  </DashboardShell>

PASO 5 — REGLAS DE MODO
  - El modo (interno|cliente) vive en una cookie 'gd_mode'. Default: 'interno'.
  - Setear <html data-mode={mode}> en layout.tsx.
  - Las ocultaciones se hacen por CSS, NO por JSX (ver COMPONENT_MAP §10 y RESPONSIVE_RULES). Usar las clases: 'internal-only', 'tech', 'level', 'tech-only'.
  - Exponer un toggle Interno/Cliente desde un menú en el header o un dropdown sencillo en la esquina superior derecha. NO crear ruta separada /cliente.

PASO 6 — TAILWIND, NO ESTILOS INLINE
  - Todas las clases vienen de Tailwind + custom utilities en globals.css cuando hagan falta.
  - PROHIBIDO usar style={{…}} excepto para variables CSS dinámicas (ej. width de un meter).
  - Las clases auxiliares 'internal-only', 'tech', 'level' se declaran en globals.css con la lógica de modo.

PASO 7 — ICONOS
  - Usar lucide-react para todo icono. Tamaños canónicos: 14, 16, 18, 22.
  - PROHIBIDO usar emojis.
  - Stroke 1.5px, color heredado.

PASO 8 — CHART
  - PacingLineChart: SVG inline, sin librerías. Estructura idéntica a la del mockup (eje Y 0/25/50/75/100, expected dashed gris, real teal sólido + área teal 8%, marker vertical HOY).
  - Recibe arrays de 0–100 ya normalizados. NO hacer cálculos en el componente.

PASO 9 — DATOS
  - SOLO mock. Importar desde src/data/mock.ts.
  - Toda métrica que no esté disponible queda como '$—' o '—'. NO inventes números.
  - El bloque pacingExample puede llevar curva ilustrativa, pero el componente debe renderizar <ExampleStamp>Ejemplo visual</ExampleStamp>.

PASO 10 — ACCESIBILIDAD
  - Toda tabla con <caption className="sr-only"> describiendo el contenido.
  - SegmentedControl con role="radiogroup".
  - Badges decorativos con aria-label.
  - Contraste WCAG AA en texto pequeño (las combinaciones del manual ya lo cumplen).
  - Estados loading con aria-busy="true".

PASO 11 — RESPONSIVE
  Aplicar exactamente las reglas de handoff/RESPONSIVE_RULES.md.
  Breakpoints Tailwind (custom):
    sm: 480px, md: 760px, lg: 1180px, xl: 1480px.
  En <760px las 3 tablas se renderizan como CardList (no <table>). Crear src/components/dashboard/CardList.tsx que comparte la misma data y se decide por una media query con useMediaQuery o por clases hidden md:block / md:hidden.

PASO 12 — ESTADOS
  Implementar TODOS los estados de handoff/UI_STATES.md. En particular:
    - Loading: skeletons en cada componente (no spinner global).
    - Empty/no-data: EmptyState con texto exacto.
    - Error/token/sheet: variantes de EmptyState + banners.
    - Estados de severidad: crit / warn / info / ok con barra lateral 3px en AlertRow y MetricCard.alert.

PASO 13 — DETALLES NO NEGOCIABLES
  - Tipografía:
      Raleway en TODO texto de UI (labels, body, headings).
      Oswald SOLO en números display (MetricCard.value, Stat.v, td.num, PacingPanel.Stat.v).
      JetBrains Mono SOLO en sellos tipográficos (ExampleStamp) y ejes del chart.
  - Color:
      Fondo página: #F4F1EB. Superficie: #FFFFFF. Acento: #28808D. Texto: #15181B.
      Cabeceras de tabla: bg #ECE8E0, fg #6E7378.
      Bloque ejecutivo del cliente al pie: bg #15181B, fg #FBF9F5.
  - Espaciado:
      max-width contenedor 1480px.
      padding lateral 36px desktop / 24px tablet / 18px mobile.
      gap entre secciones 24px.
      gap entre cards 20px.
  - Bordes:
      Todo redondeo 8px. Pills 100px. Inputs 4px.
      Bordes hairline 1px solid rgba(21,24,27,0.10).
      Sombras planas (token shadows.card). NUNCA sombras pronunciadas.
  - Logo:
      Usar /public/assets/logo_gato_dumas.png (copiar desde assets/logo_gato_dumas.png). NO redibujar.

PASO 14 — QUÉ NO HACER (lista cerrada)
  ✗ No reordenar secciones.
  ✗ No reemplazar Raleway/Oswald por Inter, Roboto, system-ui, etc.
  ✗ No introducir gradientes coloridos, glassmorphism, sombras pronunciadas.
  ✗ No usar emojis.
  ✗ No conectar API real.
  ✗ No agregar páginas o rutas adicionales.
  ✗ No introducir librerías de chart (Recharts, Chart.js, Visx, etc.).
  ✗ No introducir libs de tabla (TanStack, AG Grid). Tabla nativa + utilidades.
  ✗ No reemplazar la paleta institucional.
  ✗ No mover el toggle Interno/Cliente fuera del header.
  ✗ No crear dos páginas distintas para modo interno y cliente.
  ✗ No inventar copy. Si falta texto, dejar placeholder explícito y comentar // TODO copy.

PASO 15 — VALIDACIÓN
Antes de declarar terminado, validá que:
  [ ] Tipografías cargan (Raleway visible en body, Oswald en .num).
  [ ] Tokens CSS expuestos en :root + [data-theme="dark"].
  [ ] Todas las secciones del Paso 4 renderizan en el orden indicado.
  [ ] Al cambiar a modo cliente:
        - Desaparecen tablas operativas, KPIs tech, recos de alertas, filtro de Nivel.
        - El layout NO se rompe.
  [ ] Al cambiar a dark, la paleta vira correctamente (texto claro sobre fondo oscuro).
  [ ] En 1440px hay 4 columnas de KPI; en 1024px, 3; en 768px, 1.
  [ ] La tabla en <760px se transforma en card list.
  [ ] No hay ningún número fabricado fuera de pacingExample (marcado como "Ejemplo visual").
  [ ] Lighthouse Accessibility ≥ 95.
  [ ] No hay errores en consola.
  [ ] El header siempre muestra logo + título Gato Dumas + subtítulo "Centro de Seguimiento Digital" + kicker "Pauta digital · Meta Ads".

PASO 16 — ENTREGA
  - Commit inicial: "feat(dashboard): implementación inicial fiel al handoff".
  - Adjuntar capturas: 1480 / 1024 / 375 px en modo interno y cliente, tema claro y oscuro.
  - Si tuviste que tomar alguna decisión no cubierta por el handoff, listala en docs/DECISIONS.md con la razón.

FIN.
```

---

## Verificación rápida para el equipo (humano)

Cuando Claude Code termine, revisar contra esta checklist visual:

1. ¿El logo aparece como imagen (no SVG redibujado)?
2. ¿Hay 4 columnas de KPI en desktop? ¿Todas con valor `—` o `$—`?
3. ¿El bloque ejecutivo inferior tiene fondo casi negro?
4. ¿Las alertas críticas tienen barra lateral roja de 3px?
5. ¿La tipografía de los números grandes es Oswald?
6. ¿Hay banner de "Mockup visual" en la parte superior?
7. ¿El toggle Interno/Cliente cambia visibilidad sin recargar?
8. ¿En modo cliente desaparecen las tablas operativas y las recomendaciones de alertas?
9. ¿El tema oscuro funciona sin cambiar de página?
10. ¿En mobile la tabla se transforma en lista de tarjetas?

Si las 10 son ✓, la entrega es fiel al diseño.
