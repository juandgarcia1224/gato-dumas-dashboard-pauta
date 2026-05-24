# Referencia visual — Gato Dumas · Centro de Seguimiento Digital

Este ZIP complementa el handoff anterior. Contiene la **referencia visual fiel** que el README del handoff menciona.

## Archivo de entrada principal

**`Dashboard.html`** — Es la referencia visual canónica. Ábrelo en un navegador moderno (Chrome/Firefox/Safari) para ver el diseño aplicado: tipografía, colores, estados, modos.

## Contenido del ZIP

| Archivo | Rol |
|---|---|
| `Dashboard.html` | **Referencia visual principal.** Carga React + Babel desde unpkg y monta el dashboard. |
| `styles.css` | Estilos completos. Las CSS custom properties del `:root` son los tokens canónicos (idénticos a `DESIGN_TOKENS.json`). |
| `data.js` | Datos mock — todos los valores son placeholders explícitos (`—`, `$—`, `Sin datos cargados`, `Ejemplo visual`). |
| `tweaks-panel.jsx` | Panel auxiliar para alternar Modo (Interno/Cliente), Tema (Claro/Oscuro) y Densidad en vivo. No es parte de la implementación final — sirve solo para mostrar las variantes en la referencia. |
| `components-1.jsx` | Componentes: TopBar, FilterBar, ExecStrip, KpiGrid, AccountsBlock, PacingBlock. |
| `components-2.jsx` | Componentes: AlertsPanel, PerfTables (tabs Campañas/Conjuntos/Anuncios), FooterRule. |
| `app.jsx` | Composición principal — orden de secciones, defaults, integración del Tweaks panel. |
| `assets/logo_gato_dumas.png` | Logotipo oficial del Instituto Gato Dumas. Usar este archivo, no redibujar. |

## Notas para Claude Code

1. La referencia es **HTML + React + Babel en navegador**. La implementación final va en **Next.js + TypeScript + Tailwind**, pero el resultado visual debe ser idéntico.
2. Las clases CSS en `styles.css` y los nombres de tokens en `:root` están alineados 1:1 con `handoff/DESIGN_TOKENS.json`.
3. Los componentes React aquí son JSX vanilla con `window.GD = { ... }` para compartir entre archivos. En la implementación final usar imports normales.
4. Todo el JavaScript de gráfica del pacing está inline en `components-1.jsx` (`PacingBlock` → SVG plano de ~30 líneas). **No reemplazar por librería externa**.
5. `tweaks-panel.jsx` no se porta a la implementación final. El toggle Interno/Cliente vive en el `DashboardHeader` (ver `COMPONENT_MAP.md`).
6. El logo PNG está cuadrado con padding interno; aplicar `height: 56px; width: auto` y dejar que el aspecto se preserve.

## Verificación rápida

Al abrir `Dashboard.html` en navegador debes ver:

- Header con logo del Instituto Gato Dumas, título "Gato Dumas", subtítulo "Centro de Seguimiento Digital" y kicker "Pauta digital · Meta Ads".
- Banner amarillento "Mockup visual · No hay datos reales conectados".
- FilterBar con segmented controls (Rango / Nivel) y chips (Cuenta).
- Tira ejecutiva con cabecera negra y 3 celdas (Qué funciona / Atención / Próximo paso).
- 9 KPI cards en grid 4×3 (en desktop) — todos los valores son `—` o `$—`.
- Comparativo Gato Colombia / Gato Bucaramanga con meter de pacing.
- Gráfica de pacing con línea teal (gasto real) y línea punteada gris (gasto esperado).
- Panel de alertas con barra lateral de color por severidad.
- Tabs Campañas / Conjuntos / Anuncios con tablas operativas.
- Bloque negro inferior "Resumen ejecutivo para cliente".

Si todo lo anterior se ve, la referencia está cargando correctamente.

## Reglas de oro (recordatorio)

- **NO** cambiar la dirección visual.
- **NO** sustituir Raleway/Oswald ni la paleta institucional.
- **NO** inventar datos.
- **NO** reordenar secciones.

El handoff escrito (los 5 documentos en `handoff/`) es la fuente de verdad. Este ZIP solo facilita ver cómo se materializa.
