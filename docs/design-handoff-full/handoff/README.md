# Paquete de Handoff — Gato Dumas · Centro de Seguimiento Digital

Documentación de implementación lista para entregar a Claude Code (u otro agente / desarrollador).

## Orden de lectura

1. **`DESIGN_IMPLEMENTATION_HANDOFF.md`** — Visión general, arquitectura visual, orden exacto de secciones, layout por breakpoint, datos, estados, y la lista cerrada de _qué NO hacer_.
2. **`DESIGN_TOKENS.json`** — Tokens canónicos. Fuente de verdad para color, tipografía, espaciado, radios, sombras, badges, tablas, cards y placeholders.
3. **`COMPONENT_MAP.md`** — Mapa sección visual → componente React, con props, tipos TypeScript y notas de implementación.
4. **`RESPONSIVE_RULES.md`** — Reglas exactas por breakpoint (desktop / tablet / mobile), qué se apila, qué se oculta y por qué.
5. **`UI_STATES.md`** — Catálogo de estados (loading, vacío, error, alertas, etc.) con texto exacto, colores y comportamientos.
6. **`INSTRUCCIONES_CLAUDE_CODE.md`** — Prompt directo, ya listo para copiar y pegar en Claude Code.

## Archivos de referencia (en la raíz del proyecto)

| Archivo | Rol |
|---|---|
| `Dashboard.html` | Mockup HTML/React. Abrir en navegador para ver el diseño aplicado. |
| `styles.css` | Estilos completos del mockup. Las CSS custom properties del `:root` reflejan los tokens. |
| `data.js` | Mock de datos (placeholders explícitos). |
| `components-1.jsx`, `components-2.jsx`, `app.jsx` | Composición React de referencia. |
| `assets/logo_gato_dumas.png` | Logotipo oficial — usar este archivo, no redibujar. |

## Reglas de oro

- No inventar datos. Todo lo no disponible queda como `—` o `$—`.
- No cambiar la tipografía (Raleway + Oswald), ni la paleta (teal `#28808D` + warm gray `#798184` + cream `#F4F1EB`).
- No reordenar secciones.
- Mismo código sirve para modo Interno y modo Cliente — cambian sólo reglas CSS por `data-mode`.

## Contacto

Dudas o ajustes sobre el handoff: revisar `INSTRUCCIONES_CLAUDE_CODE.md` § PASO 16 — toda decisión no cubierta debe quedar registrada en `docs/DECISIONS.md` del proyecto destino.
