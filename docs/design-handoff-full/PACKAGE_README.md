# Gato Dumas — Centro de Seguimiento Digital
## Paquete completo de diseño · Handoff para Claude Code

> Este ZIP contiene **todo el paquete de diseño**: el mockup HTML/React de referencia, el handoff técnico documentado, los assets de marca y el material original (manual de marca, logo). Pensado para que Claude Code lo implemente sobre un proyecto Next.js existente **sin reinterpretarlo**.

---

## 🚀 Para empezar (Claude Code)

1. Abrí `Dashboard.html` en navegador → confirmás cómo se ve el diseño final.
2. Leé los 5 documentos en `handoff/` en este orden:
   1. `handoff/DESIGN_IMPLEMENTATION_HANDOFF.md`
   2. `handoff/DESIGN_TOKENS.json`
   3. `handoff/COMPONENT_MAP.md`
   4. `handoff/RESPONSIVE_RULES.md`
   5. `handoff/UI_STATES.md`
3. Seguí las instrucciones de `handoff/INSTRUCCIONES_CLAUDE_CODE.md` (prompt ya listo para copiar y pegar).

---

## 📁 Estructura del paquete

```
gato-dumas-dashboard/
│
├── PACKAGE_README.md              ← este archivo
│
├── Dashboard.html                 ← ★ referencia visual principal (abrir en navegador)
├── styles.css                     ← ★ estilos completos + tokens en :root
├── data.js                        ← ★ mock data con placeholders explícitos
├── app.jsx                        ← composición React
├── components-1.jsx               ← TopBar, FilterBar, ExecStrip, KpiGrid, Accounts, Pacing
├── components-2.jsx               ← AlertsPanel, PerfTables, FooterRule
├── tweaks-panel.jsx               ← panel auxiliar (toggle Interno/Cliente, tema, densidad)
│
├── assets/
│   └── logo_gato_dumas.png        ← ★ logotipo oficial — NO redibujar
│
├── handoff/                       ← ★ HANDOFF TÉCNICO (5 documentos + README + prompt)
│   ├── README.md
│   ├── DESIGN_IMPLEMENTATION_HANDOFF.md
│   ├── DESIGN_TOKENS.json
│   ├── COMPONENT_MAP.md
│   ├── RESPONSIVE_RULES.md
│   ├── UI_STATES.md
│   └── INSTRUCCIONES_CLAUDE_CODE.md
│
├── visual-reference/              ← copia auto-contenida de la referencia visual
│   ├── NOTE.md
│   ├── Dashboard.html
│   ├── styles.css
│   ├── data.js
│   ├── app.jsx
│   ├── components-1.jsx
│   ├── components-2.jsx
│   ├── tweaks-panel.jsx
│   └── assets/logo_gato_dumas.png
│
├── screenshots/                   ← captura del mockup en navegador
│   └── dashboard-preview.png
│
└── uploads/                       ← material original entregado por el equipo
    ├── Copia de Logogd-1_1 (1).png      (logo original)
    ├── Copia de manual de marca (1) (3).pdf
    ├── Copia de Manual de marca (2).pdf
    ├── manual_marca.pdf                  (renombrado para parsing)
    └── manual_marca_v2.pdf               (renombrado para parsing)
```

---

## 🗺️ Mapa de archivos clave

| Pregunta | Archivo |
|---|---|
| **¿Cuál es el archivo principal de referencia visual?** | `Dashboard.html` (raíz). También disponible en `visual-reference/Dashboard.html`. |
| **¿Qué archivos contienen componentes React?** | `app.jsx`, `components-1.jsx`, `components-2.jsx`, `tweaks-panel.jsx` (todos en la raíz; copia en `visual-reference/`). |
| **¿Qué archivo contiene estilos principales?** | `styles.css` (raíz). Contiene también los design tokens como CSS custom properties en `:root`. |
| **¿Qué archivo contiene data de ejemplo?** | `data.js` (raíz). Todos los valores son placeholders explícitos: `—`, `$—`, `Sin datos cargados`, `Ejemplo visual`. |
| **¿Qué carpeta contiene assets/logos?** | `assets/` — `logo_gato_dumas.png` es el oficial. Original sin renombrar en `uploads/Copia de Logogd-1_1 (1).png`. |
| **¿Qué carpeta contiene el handoff técnico?** | `handoff/` — 5 documentos + README + bloque de instrucciones directas para Claude Code. |

---

## 🎨 Identidad visual (resumen ejecutivo)

Origen: **Manual de Marca de Instituto Gato Dumas** (incluido en `uploads/`).

| Token | Valor |
|---|---|
| Color institucional 1 (acento principal) | `#28808D` (RGB 40·128·141) |
| Color institucional 2 (gris cálido) | `#798184` (RGB 121·129·132) |
| Fondo página | `#F4F1EB` (Editorial Cream) |
| Superficie | `#FFFFFF` |
| Texto principal | `#15181B` |
| Tipografía UI | **Raleway** (400, 500, 600, 700, 800) |
| Tipografía display numérico | **Oswald** (300, 400, 500, 600) |
| Tipografía sellos / código | **JetBrains Mono** (400, 500) |
| Familia de status | success `#3F7D5C` · warning `#B8862B` · danger `#B23A48` · info `#28808D` |

**Detalle completo en `handoff/DESIGN_TOKENS.json` (fuente de verdad).**

---

## 📐 Arquitectura visual (resumen)

Orden de secciones (vertical, una sola pantalla con scroll):

1. **TopBar** — logo + título + última actualización + estado de conexión + botón "Actualizar datos"
2. **MockupBanner** — aviso de que no hay datos reales conectados
3. **FilterBar** — Rango / Cuenta / Nivel
4. **ExecStrip** — Resumen ejecutivo top (cabecera negra + 3 celdas: funciona / atención / próximo paso)
5. **KpiGrid** — 9 cards en grid 4 columnas
6. **AccountSummary** — Gato Colombia vs Gato Bucaramanga
7. **PacingChart** — gasto esperado vs gasto real (SVG inline)
8. **AlertsPanel** — lista de alertas con barra lateral por severidad
9. **PerformanceTables** — tabs Campañas / Conjuntos / Anuncios (oculto en modo cliente)
10. **ClientExecutiveSummary** — versión presentable en fondo oscuro
11. **FooterRule** — pie sutil

**Detalle exacto + breakpoints en `handoff/DESIGN_IMPLEMENTATION_HANDOFF.md` y `handoff/RESPONSIVE_RULES.md`.**

---

## 👥 Vista interna vs vista cliente

Una sola página, dos modos. El cambio se hace por atributo `data-mode` en `<html>` + reglas CSS:

| Elemento | En modo cliente |
|---|---|
| Tablas operativas (`.internal-only`) | Ocultas |
| Filtro "Nivel" | Oculto |
| KPIs `tech` (Frecuencia, CTR) | Ocultos |
| Recomendaciones en alertas | Ocultas |
| Tab "Conjuntos" en tablas | Oculta |
| Alertas (qué + cuenta + métrica) | **Visibles** (transparencia con cliente) |

**Reglas exactas en `handoff/COMPONENT_MAP.md` § 10.**

---

## 🧱 Reglas de oro (no negociables)

1. **No** sustituir Raleway/Oswald.
2. **No** alterar la paleta institucional.
3. **No** reordenar secciones.
4. **No** inventar datos. Todo lo no disponible queda como `—` o `$—`.
5. **No** introducir gradientes coloridos, glassmorphism o sombras pronunciadas.
6. **No** redibujar el logo en SVG. Usar `assets/logo_gato_dumas.png`.
7. **No** introducir librerías de chart ni de tabla. El SVG del pacing y las tablas nativas bastan.
8. **No** crear rutas separadas para modo interno y cliente.

**Lista completa en `handoff/DESIGN_IMPLEMENTATION_HANDOFF.md` § 9 y `handoff/INSTRUCCIONES_CLAUDE_CODE.md` Paso 14.**

---

## ⚙️ Stack objetivo (implementación final)

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS 3**
- **lucide-react** para iconos (sin emojis)
- **next/font/google** para Raleway + Oswald + JetBrains Mono
- **Sin** librerías de chart / tabla / componentes UI externos

Comando inicial sugerido (más detalle en `handoff/INSTRUCCIONES_CLAUDE_CODE.md`):

```bash
npx create-next-app@14 gato-dumas-dashboard --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"
cd gato-dumas-dashboard
npm i lucide-react clsx
```

---

## 📦 Versión

| | |
|---|---|
| Versión del diseño | `0.1.0` |
| Estado | Listo para implementación inicial |
| Datos reales | **NO conectados** — todos los valores son placeholders explícitos |
| Modo dual (interno/cliente) | ✓ Definido en handoff |
| Tema claro/oscuro | ✓ Definido en handoff |
| Responsive | ✓ Desktop / Tablet / Mobile (incluye conversión tabla → cards) |

---

## ❓ Preguntas frecuentes

**¿Por qué hay archivos duplicados entre la raíz y `visual-reference/`?**
La raíz es el "proyecto vivo" para abrir y editar. `visual-reference/` es un snapshot auto-contenido para Claude Code, idéntico en contenido pero pensado como referencia inmutable.

**¿Puedo borrar `uploads/`?**
Sí, una vez implementado. Son los archivos originales (manual de marca, logo) por trazabilidad.

**¿Puedo borrar `tweaks-panel.jsx`?**
En la implementación final, sí. Es un panel auxiliar que sólo sirve en la referencia HTML para alternar modos en vivo. La implementación Next.js usa cookie + `data-mode`.

**¿Por dónde empieza Claude Code?**
Por `handoff/INSTRUCCIONES_CLAUDE_CODE.md`. Es un prompt listo para copiar y pegar.

---

## 📞 Contacto

Diseñado por **CookMinds** para **Instituto Gato Dumas**. Si Claude Code encuentra ambigüedad en el handoff, debe registrarla en `docs/DECISIONS.md` del proyecto destino y consultar antes de improvisar.
