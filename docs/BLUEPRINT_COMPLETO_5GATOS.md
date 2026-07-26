# Blueprint completo del dashboard 5 Gatos Bucaramanga

> Documento técnico exhaustivo. Cubre TODO: arquitectura, config, decisiones,
> flujos, endpoints, integraciones, seguridad, operación y cómo replicar
> el proyecto desde cero si fuera necesario. NO omite nada.
>
> **Audiencia:** cualquier dev, IA o miembro del equipo que necesite
> entender/mantener/reproducir el sistema.

---

## Índice

1. Overview
2. Stack técnico completo
3. Estructura del repositorio
4. Variables de entorno (todas)
5. Integraciones externas (Meta, Google, Vercel)
6. Modelo de datos y flujos
7. Rutas Next.js (páginas + APIs)
8. Componentes UI
9. Autenticación y autorización
10. Cron y sincronización
11. Cache y rate limiting
12. Sheets y Excel del cliente (detalle)
13. Business Portfolio Meta (detalle)
14. Diseño visual
15. Testing
16. Deployment
17. Cómo replicar el proyecto desde cero
18. Operación diaria
19. Debugging común
20. Decisiones arquitectónicas históricas
21. Pendientes y limitaciones conocidas

---

## 1. Overview

**Nombre del producto:** Dashboard 5 Gatos Bucaramanga.
**Cliente:** 5 Gatos (socios dueños de la sede Gato Dumas Bucaramanga).
**Agencia:** CookMinds (Juan García).
**URL producción:** https://gato-dumas-dashboard.vercel.app/5gatos
**Repositorio GitHub:** https://github.com/juandgarcia1224/gato-dumas-dashboard-pauta
**Ruta local (Mac de Juan):** `/Users/mac/gato-dumas-dashboard`
**Rama activa:** `main`
**Fecha primera versión producción:** 2026-07-07.
**Fecha última auditoría:** 2026-07-21 (todo verde).

**Propósito:** dar al cliente autonomía para consultar la inversión de pauta
Meta Ads de su sede, sin depender de correos manuales mensuales de la agencia.
Solo lectura de datos, nunca modifica campañas.

---

## 2. Stack técnico completo

### Frontend
- **Framework:** Next.js 15.1.6 (App Router, Server Components por default)
- **UI Library:** React 19
- **Lenguaje:** TypeScript 5.7.3
- **Estilo:** Tailwind CSS 3.4.17
- **Iconos:** lucide-react 0.456.0 + SVG inline (no siempre importados)
- **Fuentes:** stack de sistema (`-apple-system, BlinkMacSystemFont, "Segoe UI", ...`)

### Backend / Data
- **Runtime:** Node.js 22+ (Vercel serverless)
- **Meta Ads API:** v22.0 (Marketing API)
- **Google APIs:** `googleapis` 144.0.0 (Sheets v4 + Drive v3)
- **Excel parsing:** `xlsx` (SheetJS) — para el Excel del cliente que es `.xlsx` nativo
- **Auth:** `next-auth` v5 (beta) — Google provider + allowlist

### Herramientas dev
- **Test runner:** `node:test` vía `tsx --test`
- **Linter:** ESLint (config next)
- **Env loader (scripts):** `dotenv` 16.4.7
- **Ejecutor scripts:** `tsx` 4.19.2
- **Postprocesado CSS:** PostCSS + Autoprefixer

### Hosting y CI/CD
- **Hosting:** Vercel (plan Hobby)
- **Cuenta Vercel:** `juandgarcia1224s-projects`
- **Nombre proyecto Vercel:** `gato-dumas-dashboard`
- **Región serverless:** Washington DC (default Vercel)
- **Deploys:** manuales vía `vercel --prod` (NO conectado a GitHub Actions)

---

## 3. Estructura del repositorio

```
/Users/mac/gato-dumas-dashboard/
├── .env.example                        ← plantilla de variables de entorno
├── .env.local                          ← valores reales (gitignored)
├── package.json                        ← deps + scripts npm
├── tsconfig.json                       ← config TypeScript
├── tailwind.config.ts                  ← paleta lab + admin
├── postcss.config.mjs                  ← PostCSS
├── next.config.mjs                     ← config Next (strict mode)
├── vercel.json                         ← cron diario 6:00 AM Bogotá
├── AUDITORIA_META_GATO_DUMAS.md        ← doc externo (untracked)
│
├── docs/                               ← documentación del proyecto
│   ├── ADSET_MAPPING_5GATOS.md         ← cómo funciona el mapeo adset↔curso
│   ├── BLUEPRINT_COMPLETO_5GATOS.md    ← este documento
│   ├── BUSINESS_MANAGER_SETUP.md       ← cómo se creó el token permanente
│   ├── CAMPAIGN_MAPPING_GATO_DUMAS.md  ← legacy (nivel campaña)
│   ├── CHECKLIST_PRODUCCION_5GATOS.md  ← checklist operativo
│   ├── CONTEXTO_CEREBRO_5GATOS.md      ← contexto ejecutivo para cerebro
│   ├── DATA_SCHEMA.md                  ← estructura de datos
│   ├── DEPLOY_5GATOS.md                ← cómo desplegar
│   ├── DEPLOY_VERCEL.md                ← guía Vercel genérica
│   ├── DESIGN_CONTRACT.md              ← contrato visual (legacy)
│   ├── DESIGN_INTEGRATION_NOTES.md
│   ├── FUTURO_TIKTOK.md                ← plan futuro TikTok
│   ├── HISTORICO_Y_RANGOS.md
│   ├── LOGIN_SETUP.md                  ← cómo se creó OAuth Google
│   ├── MEDIAPLAN_GATO_DUMAS.md
│   ├── OPERACION_ACTUALIZACION.md      ← cómo correr updates manuales
│   ├── OPERACION_DASHBOARD_GATO_DUMAS.md
│   ├── PENDIENTES_PROXIMOS_BLOQUES.md
│   ├── PRIMERA_CARGA.md                ← primera carga histórica
│   ├── PROGRAMACION_GATO_BGA_INTEGRACION.md  ← integración Excel cliente
│   ├── RUTINA_SEMANAL_PAOLA.md
│   ├── SEGURIDAD_TOKENS.md             ← policy de tokens
│   ├── SETUP.md                        ← setup inicial
│   └── design-handoff-full/            ← assets diseño
│
├── scripts/                            ← scripts operativos (tsx)
│   ├── load-env.ts                     ← helper carga .env.local
│   ├── probar-programacion.ts          ← smoke test Excel cliente (untracked)
│   ├── recompute-pacing.ts             ← recalcular pacing histórico
│   ├── setup-mapping-sheet.ts          ← crear/verificar Sheet mapeo
│   ├── setup-sheets.ts                 ← setup Sheet PROD
│   ├── update-meta-manual.ts           ← update Meta con prompt de token
│   ├── update-meta.ts                  ← update Meta con token env
│   └── validate-env.ts                 ← validar env completo
│
├── public/                             ← assets estáticos
│   └── assets/
│       └── logo_gato_dumas.png
│
└── src/
    ├── middleware.ts                   ← auth + allowlist en /5gatos
    ├── auth.ts                         ← config next-auth v5
    │
    ├── app/
    │   ├── layout.tsx                  ← root layout HTML
    │   ├── page.tsx                    ← ruta / (Cloud Design Colombia)
    │   ├── login/page.tsx              ← login con Google
    │   ├── login-denegado/page.tsx     ← pantalla acceso denegado
    │   │
    │   ├── 5gatos/                     ← dashboard cliente 5 Gatos
    │   │   ├── page.tsx                ← página principal
    │   │   └── loading.tsx             ← skeleton
    │   │
    │   └── api/
    │       ├── health/route.ts         ← health check
    │       ├── dashboard/route.ts      ← API vista interna
    │       ├── auth/[...nextauth]/route.ts  ← handler next-auth
    │       ├── cron/
    │       │   └── refresh-5gatos/route.ts  ← cron diario
    │       └── 5gatos/
    │           ├── ads/route.ts        ← lazy load ads del acordeón
    │           ├── adsets/route.ts     ← ads del adset
    │           └── export/route.ts     ← export XLSX
    │
    ├── components/                     ← componentes vista interna Cloud Design
    │   ├── AccountSummary.tsx
    │   ├── AlertsPanel.tsx             ← legacy vista interna
    │   ├── ClientExecutiveSummary.tsx
    │   ├── DashboardHeader.tsx
    │   ├── DashboardShell.tsx
    │   ├── EmptyState.tsx
    │   ├── ExecStrip.tsx
    │   ├── FilterBar.tsx
    │   ├── FooterRule.tsx
    │   ├── KpiGrid.tsx
    │   ├── PacingChart.tsx
    │   ├── PerformanceTables.tsx
    │   ├── StatusBanners.tsx
    │   ├── UnclassifiedPanel.tsx
    │   │
    │   └── fivegatos/                  ← componentes vista 5 Gatos
    │       ├── AdCard.tsx              ← card grande de anuncio
    │       ├── AdCardCompact.tsx       ← card compacta (acordeón)
    │       ├── AlertsPanel.tsx         ← desmontado del page
    │       ├── Breadcrumb.tsx          ← legacy drill-down por URL
    │       ├── CampaignBlock.tsx       ← bloque de campaña activa
    │       ├── CampaignsView.tsx       ← contenedor de bloques
    │       ├── CourseChip.tsx          ← chip curso con contexto
    │       ├── CoursesView.tsx         ← desglose por Curso/Programa
    │       ├── FinCursoChip.tsx        ← chip fecha fin
    │       ├── Kpi.tsx                 ← card individual KPI
    │       ├── KpiCards.tsx            ← grid de 4 KPIs
    │       ├── MonthSelect.tsx         ← selector de mes
    │       ├── PautaInfoChip.tsx       ← chip fecha inicio + frecuencia
    │       ├── PresupuestoCard.tsx     ← tarjeta presupuesto
    │       ├── SeveridadPill.tsx       ← pill semáforo
    │       ├── StatusBadge.tsx         ← badge de estado
    │       ├── ctaLabel.ts             ← labels de CTA en español
    │       └── labelMes.ts             ← formateador de mes
    │
    └── lib/
        ├── version.ts                  ← version string
        │
        ├── config/
        │   ├── clients.ts              ← ACCOUNT_GROUPS (colombia, buc)
        │   └── env.ts                  ← lectura de env vars
        │
        ├── dashboard/                  ← vista interna Cloud Design
        │   ├── aggregate.ts
        │   ├── alerts.ts               ← legacy alerts
        │   ├── contract.ts
        │   ├── design-types.ts
        │   ├── formatters.ts
        │   ├── metrics.ts
        │   ├── pacing.ts
        │   ├── programacion-cross.ts   ← cruce Excel cliente con adsets
        │   ├── range.ts
        │   ├── sede.ts
        │   └── viewmodel.ts
        │
        ├── fivegatos/                  ← lógica del dashboard 5 Gatos
        │   ├── constants.ts            ← BENCHMARK_CPL, fmt*, helpers
        │   ├── data.ts                 ← getCampanasActivas + tipos
        │   ├── presupuesto.ts          ← cálculo planeado vs consumido
        │   └── __tests__/
        │       ├── pauta-info.test.ts
        │       └── presupuesto.test.ts
        │
        ├── login/
        │   └── fonts.ts                ← IBM Plex Sans/Mono (solo login)
        │
        ├── mapping/                    ← mapeo adset ↔ curso
        │   ├── courses.ts              ← loadMapping + match
        │   ├── types.ts                ← tipos MappingRule
        │   ├── fallback.json           ← reglas de respaldo local
        │   └── __tests__/
        │       └── courses.test.ts
        │
        ├── meta/                       ← cliente Meta Ads API
        │   ├── ads.ts                  ← GET /adsets/{id}/ads + insights
        │   ├── adsets.ts               ← GET /act/adsets + insights
        │   ├── campaigns.ts            ← GET /act/campaigns metadata
        │   ├── client.ts               ← fetcher base
        │   ├── insights.ts             ← insights por rango
        │   ├── transform.ts            ← Meta → viewmodel
        │   └── types.ts
        │
        └── sheets/                     ← cliente Google Sheets
            ├── client.ts               ← JWT auth service account
            ├── reader.ts               ← readTab, readTabs
            ├── writer.ts               ← upsert filas
            ├── schema.ts               ← tabs y headers
            ├── programacion-gato-bga.ts  ← lector Excel cliente
            └── programacion-gato-bga.test.ts
```

---

## 4. Variables de entorno (todas)

### Ubicaciones
- **Local:** `/Users/mac/gato-dumas-dashboard/.env.local` (gitignored)
- **Producción:** Vercel Dashboard → Settings → Environment Variables
- **Plantilla pública:** `.env.example` en el repo

### Lista completa

| Variable | Requerida | Dónde se usa | Tipo |
|---|---|---|---|
| `META_ACCESS_TOKEN` | Ruta `/` interna | Token de la vista Cloud Design (cuenta Colombia) | Secret |
| `META_ACCESS_TOKEN_5GATOS` | Ruta `/5gatos` | **Token permanente System User** (nunca expira) | Secret |
| `META_API_VERSION` | Sí | Versión Meta Marketing API | `v22.0` |
| `META_AD_ACCOUNT_GATO_COLOMBIA` | Vista interna | `act_299121374587072` | Public |
| `META_AD_ACCOUNT_GATO_BUCARAMANGA` | `/5gatos` | `act_248616958293893` | Public |
| `GOOGLE_SHEET_ID` | Sí | Sheet PROD (snapshots del cron) | `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k` |
| `GOOGLE_SHEET_MAPEO_5GATOS_ID` | Sí | Sheet mapeo adset↔curso | `1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs` |
| `GOOGLE_SHEET_PROGRAMACION_GATO_BGA_ID` | Opcional | Excel cliente | `1cX7gHcuogtsZuKRYdm3XKB-5wNcgL406` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Sí | Service Account (Sheets/Drive) | `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Sí | Private key del service account (PEM, `\n` literales) | Secret |
| `AUTH_SECRET` | Sí | Firma de JWT next-auth (genera: `openssl rand -base64 32`) | Secret |
| `AUTH_GOOGLE_ID` | Sí | OAuth Client ID de Google | Secret |
| `AUTH_GOOGLE_SECRET` | Sí | OAuth Client Secret de Google | Secret |
| `AUTH_ALLOWED_EMAILS` | Sí | CSV de correos autorizados | Public-ish |
| `CRON_SECRET` | Sí | Bearer del cron (genera: `openssl rand -base64 32`) | Secret |
| `NEXT_PUBLIC_CLIENT_NAME` | Opcional | `Gato Dumas` | Public |
| `NEXT_PUBLIC_TIMEZONE` | Opcional | `America/Bogota` | Public |
| `NEXT_PUBLIC_BENCHMARK_CPL_5GATOS` | Opcional | Meta CPL en COP (default 25000) | Public |

### Valores actuales de `AUTH_ALLOWED_EMAILS` (6 correos)

```
juandgarcia1224@gmail.com,ramaya@gatodumas.com,gatodumasbucaramanga@gmail.com,linazgm73@gmail.com,plopezb94@gmail.com,adrianaduarte.loi@gmail.com
```

---

## 5. Integraciones externas

### 5.1 Meta Ads (Facebook Business)

**Endpoint base:** `https://graph.facebook.com/v22.0`

**Recursos consumidos:**
- `GET /{ad_account_id}` — metadata cuenta
- `GET /{ad_account_id}/campaigns` — listado + metadata
- `GET /{ad_account_id}/insights?level=campaign` — métricas agregadas
- `GET /{ad_account_id}/adsets` — listado adsets
- `GET /{ad_account_id}/insights?level=adset` — métricas por adset (mes)
- `GET /{ad_account_id}/insights?level=adset&date_preset=maximum` — lifetime
- `GET /{adset_id}/ads` — ads de un adset (con creative)
- `GET /{adset_id}/insights?level=ad` — métricas por ad
- `GET /debug_token` — validar salud del token

**Business Portfolio:**
- Nombre: `Gato Dumas Bucaramanga`
- ID: `915796593203003`
- **NO verificado** (cliente sin NIT)
- Consecuencia: rate limit "Acceso Limitado" (más agresivo)

**App Meta:**
- Nombre: `Dashboard 5 Gatos`
- App ID: `1039929148547583`
- Modo: `En desarrollo` (nunca se pasa a Live, no hace falta)
- Producto agregado: `Marketing API`
- App Review: NO requerido para nuestros permisos y uso propio

**System User:**
- Nombre: `dashboard-5gatos`
- ID: `61592010805228`
- Rol: `Empleado` (no Admin — mínimo privilegio)
- Ad account asignada: `act_248616958293893` con rol `Analista` (solo lectura)
- Rol en la app `Dashboard 5 Gatos`: `Administrador` (obligatorio para generar tokens)

**Token:**
- Tipo: `SYSTEM_USER` (permanente, `expires_at: 0`)
- Scopes: `ads_read`, `read_insights`, `ads_management`, `public_profile`
- Requirió aprobación de segundo admin del portfolio (política Meta 2026)
- Aprobación se hizo el 2026-07-14
- Vive en Vercel como `META_ACCESS_TOKEN_5GATOS`

**Rate limits:**
- Con app en Acceso Limitado: throttling agresivo (no publicado, ~200 llamadas/hora)
- Mitigación implementada: cache Next.js `unstable_cache` con TTL 5 horas
- Retry con backoff exponencial (2s/4s, máx 3 intentos) en `adsets.ts`

### 5.2 Google Cloud

**Proyectos GCP involucrados (dos, por decisión histórica):**

**A. `5gatos-dashboard-auth`** — OAuth Login
- Cuenta owner: `cookmindsagency@gmail.com`
- Uso: OAuth Client ID para login Google del dashboard
- APIs habilitadas: OAuth 2.0
- Consent Screen: `In production` (published)
- Redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://gato-dumas-dashboard.vercel.app/api/auth/callback/google`

**B. `cookminds-dashboards`** — Service Account (Sheets/Drive)
- Número del proyecto: `284881347761`
- Cuenta owner: Juan (contabilidad CookMinds)
- Uso: Service Account para leer/escribir Sheets y leer Excel
- APIs habilitadas: `Google Sheets API`, `Google Drive API`
- Service Account: `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com`
- Roles del SA: sin roles IAM del proyecto (usa scopes OAuth por JWT)

### 5.3 Vercel

**Cuenta:** `juandgarcia1224s-projects`
**Proyecto:** `gato-dumas-dashboard`
**Project ID:** `prj_JDcco4FuOCIZq0i39DtvwmkvQwWb`
**Dominio:** `gato-dumas-dashboard.vercel.app`
**Plan:** Hobby
**Regiones:** default (Washington DC)
**GitHub connect:** NO (deploys manuales por CLI)

**Env vars:** todas las de la sección 4, cargadas en los 3 entornos (Production, Preview, Development).

**Crons:**
- Path: `/api/cron/refresh-5gatos`
- Schedule: `0 11 * * *` (11:00 UTC = 6:00 AM Bogotá, todos los días)
- Solo corre en Production
- Protegido por header `Authorization: Bearer $CRON_SECRET`

---

## 6. Modelo de datos y flujos

### Nivel de agregación
```
Business Portfolio (Gato Dumas Bucaramanga)
  └── Ad Account (act_248616958293893)
      └── Campaign (ej. "Programas | BUC | Mayo 2026")
          └── Ad Set (ej. "BUC_CC_Chocolatería_Advantage")
              └── Ad (creative individual con thumbnail + CTA)
```

### Flujo de datos al abrir /5gatos

```
1. Usuario entra a /5gatos
2. Middleware valida sesión + allowlist
3. Server Component ejecuta getCampanasActivas(month)
4. Función hace en paralelo (todo cacheado 5h):
   ├─ Meta: /campaigns metadata (con start_time)
   ├─ Meta: /adsets con insights lifetime
   ├─ Meta: /adsets con insights del mes
   ├─ Sheet: reglas de mapeo curso↔adset
   └─ Excel cliente: cursos vigentes con fechas
5. Agrupa adsets por campaña → CampanaActiva[]
6. Filtra ACTIVE (al menos 1 adset activo)
7. Renderiza CampaignsView + CoursesView + KpiCards
```

### Flujo del cron diario

```
Vercel Cron (6 AM Bogotá)
  └── POST /api/cron/refresh-5gatos con Bearer $CRON_SECRET
      ├── Fetch últimos 90 días de Meta (level=adset)
      ├── Upsert en Sheet PROD hoja "13_5Gatos_Adsets_Snapshot"
      ├── Log corrida en hoja "12_5Gatos_Cron_Log"
      └── Circuit breaker: si 3 fallas seguidas → alerta en log
```

### Tipos principales (`src/lib/fivegatos/data.ts`)

- `AdsetStats` — un adset con todas sus métricas y presupuesto en ambos modos
- `AdStats` — un ad individual con creative
- `CampanaActiva` — campaña con sus adsets ya cruzados con curso
- `CampanasActivasData` — respuesta completa del getCampanasActivas
- `KpiBlock` — 4 KPIs del mes
- `PresupuestoModos` — planeado/consumido en modo mes y lifetime
- `CursoInfo` — data del curso desde el Excel cliente
- `GroupSummaryRow` — fila de resumen por curso o programa

---

## 7. Rutas Next.js

### Páginas
- `/` — vista interna Cloud Design Colombia (`src/app/page.tsx`)
- `/5gatos` — dashboard cliente 5 Gatos (`src/app/5gatos/page.tsx`)
- `/login` — login con Google (`src/app/login/page.tsx`)
- `/login-denegado` — acceso denegado (`src/app/login-denegado/page.tsx`)

### API Routes
- `GET /api/health` — health check (no auth)
- `POST /api/cron/refresh-5gatos` — cron (Bearer auth)
- `GET|POST /api/auth/[...nextauth]` — handler next-auth v5
- `GET /api/dashboard` — API vista interna
- `GET /api/5gatos/adsets` — adsets JSON (auth)
- `GET /api/5gatos/ads?adsetId=X&month=YYYY-MM` — lazy load acordeón (auth)
- `GET /api/5gatos/export?month=YYYY-MM` — genera XLSX de 4 hojas (auth)

### Protegidas por middleware
Solo `/5gatos/:path*` y `/api/5gatos/:path*` requieren sesión + allowlist.
`/` interna, `/login`, `/login-denegado`, `/api/health`, `/api/cron/*` son públicas.

---

## 8. Componentes UI (dashboard 5 Gatos)

Todos bajo `src/components/fivegatos/`:

- **`KpiCards.tsx`** — grid 4 KPIs: Inversión de pauta, Consumido hasta hoy, Leads, CPL
- **`Kpi.tsx`** — card individual con label + valor + delta
- **`MonthSelect.tsx`** — selector de mes (client)
- **`CampaignsView.tsx`** — lista de bloques de campaña (con opt-in "Ver pausadas")
- **`CampaignBlock.tsx`** — bloque completo de una campaña con presupuesto + KPIs + tabla adsets acordeón
- **`PresupuestoCard.tsx`** — tarjeta de presupuesto con barra semáforo
- **`AdCardCompact.tsx`** — card compacta de ad (thumbnail + CTA + métricas)
- **`AdCard.tsx`** — card grande de ad (legacy)
- **`CoursesView.tsx`** — dos tablas gemelas Curso/Programa con acordeón
- **`CourseChip.tsx`** — chip contexto de curso
- **`FinCursoChip.tsx`** — chip fecha fin del curso (rojo/ámbar/verde según fecha)
- **`PautaInfoChip.tsx`** — chip fecha inicio + días corridos + frecuencia (3 variantes)
- **`SeveridadPill.tsx`** — pill verde/ámbar/rojo por CPL
- **`StatusBadge.tsx`** — badge ACTIVE/PAUSED/etc
- **`AlertsPanel.tsx`** — desmontado del page (queda por si vuelve)
- **`Breadcrumb.tsx`** — legacy del drill-down por URL
- **`labelMes.ts`** — pure function "2026-07" → "Julio 2026"
- **`ctaLabel.ts`** — labels de CTA en español

### Server vs Client Components
- Página `/5gatos/page.tsx` es Server Component (`export const dynamic = "force-dynamic"`)
- `CampaignsView`, `CampaignBlock`, `MonthSelect`, `CoursesView` son Client Components (`"use client"`)
- Motivo: necesitan estado local para el acordeón y el navigator para el select

---

## 9. Autenticación y autorización

### Stack
- **Librería:** `next-auth` v5 (beta)
- **Provider:** Google
- **Estrategia de sesión:** JWT (default v5)
- **Storage:** cookies HttpOnly (default Vercel)

### Archivos clave
- `src/auth.ts` — configuración: provider, allowlist en callback `signIn`
- `src/app/api/auth/[...nextauth]/route.ts` — handler
- `src/middleware.ts` — barrera segunda: sesión + allowlist en rutas protegidas
- `src/app/login/page.tsx` — botón Sign in with Google
- `src/app/login-denegado/page.tsx` — mensaje amable

### Flujo login
1. Usuario abre `/5gatos` sin sesión → middleware redirige a `/login`
2. `/login` muestra botón "Iniciar con Google"
3. Click → OAuth Google (redirect URI configurada)
4. Google devuelve callback → `/api/auth/callback/google`
5. next-auth valida token
6. Callback `signIn` en `src/auth.ts` verifica email contra `AUTH_ALLOWED_EMAILS`
7. Si no está: redirige a `/login-denegado`
8. Si sí: crea sesión JWT + cookie, redirect a `/5gatos`

### Manejo de la allowlist
- Env `AUTH_ALLOWED_EMAILS` = CSV de correos, case-insensitive
- Cambiarla no requiere redeploy (se lee en cada request), pero para mejor efecto sí es recomendable redeploy
- La app está en "Publishing status: In production" en Google Cloud, por eso los test users no aplican — cualquier cuenta Google puede iniciar el flujo, pero solo los de la allowlist entran

---

## 10. Cron y sincronización

### `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/refresh-5gatos", "schedule": "0 11 * * *" }
  ]
}
```

- Schedule cron: `0 11 * * *` = 11:00 UTC = 6:00 AM Bogotá diario
- Solo corre en Production (Vercel Hobby no permite crons en Preview)
- Header enviado por Vercel: `Authorization: Bearer $CRON_SECRET`

### `/api/cron/refresh-5gatos/route.ts`
- Valida Bearer contra `CRON_SECRET`
- Trae últimos 90 días de Meta agrupado por adset con lifetime
- Aplica mapeo curso↔adset
- Upsert en Sheet PROD:
  - Hoja `13_5Gatos_Adsets_Snapshot` — snapshot upsert por `month+adset_id`
  - Hoja `12_5Gatos_Cron_Log` — log de cada corrida con status
- Circuit breaker: si 3 fallas seguidas, responde 500 con mensaje accionable

### Cache en vivo (por request)
- `unstable_cache` de Next.js
- TTL: `5 * 60 * 60` segundos = **5 horas**
- Se invalida por tag `["5gatos-data"]`
- Motivo: rate limit de Meta con app no verificada

---

## 11. Cache y rate limiting

### Estrategia
1. **Cache Next.js 5h** — evita golpear Meta en cada request
2. **Retry con backoff** — 2s, 4s, max 3 intentos en `adsets.ts`
3. **Batch de campos** — pide fields+ids en una sola request cuando puede
4. **Circuit breaker en cron** — para tras 3 fallas seguidas

### Códigos de error Meta manejados
- `code 4` — Application request limit reached (rate limit)
- `code 17` — User request limit reached
- `code 32` — Page/User rate limit
- `code 613` — Custom rate limit
- `code 190` — Token inválido/expirado

Ante `code 4/17/32/613` → retry con backoff. Ante `code 190` → falla y muestra
mensaje amable al cliente.

---

## 12. Sheets y Excel del cliente

### Sheet 1: PROD (snapshots)
- **Nombre:** `DB_Dashboard_Gato_Dumas_Meta_Ads_PROD`
- **ID:** `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k`
- **Dueño:** `cookmindsagency@gmail.com`
- **Ruta Drive:** CookMinds / Clientes / Gato Dumas / Dashboard Pauta
- **Hojas usadas por 5 Gatos:**
  - `13_5Gatos_Adsets_Snapshot` — snapshot diario del cron
  - `12_5Gatos_Cron_Log` — log de corridas
  - `11_5Gatos_Snapshot` — legacy nivel campaña (histórico intacto)

### Sheet 2: Mapeo curso↔adset (Ruzmery lo edita)
- **Nombre:** `Mapeo_Cursos_5Gatos_Bucaramanga`
- **ID:** `1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs`
- **URL:** https://docs.google.com/spreadsheets/d/1FOpmuIioSFHWATE6ixRcG5abg9CefjtYaYYj3V6PIhs/edit
- **Dueño:** `cookmindsagency@gmail.com`
- **Compartido con:** service account (Editor), juandgarcia1224@gmail.com, ramaya@gatodumas.com

**Hoja `Mapeo` (headers fila 1):**
```
pattern_regex | adset_id_exacto | tipo | nombre_normalizado | activo | notas | legacy_campaign
```
- `pattern_regex` — regex case-insensitive sobre `adset_name`
- `adset_id_exacto` — match literal por ID de adset (prioridad sobre regex)
- `tipo` — "Curso" o "Programa"
- `nombre_normalizado` — nombre canónico que se muestra al cliente
- `activo` — TRUE/FALSE
- `notas` — texto libre
- `legacy_campaign` — TRUE = regla vieja nivel campaña (matcher la ignora)

**Hoja `Sin_Clasificar` (auto-poblada por el dashboard):**
```
fecha_iso | adset_id | adset_name | campaign_id | campaign_name | account_id | status | notas
```

**Hoja `README`** — documentación para Ruzmery.

### Excel 3: Programación oficial del cliente
- **Nombre:** `PROGRAMAC CURSOS CORTOS Y DIP 2026 BGA.xlsx`
- **ID Drive:** `1cX7gHcuogtsZuKRYdm3XKB-5wNcgL406`
- **URL:** https://docs.google.com/spreadsheets/d/1cX7gHcuogtsZuKRYdm3XKB-5wNcgL406/edit
- **Formato:** `.xlsx` nativo (Excel binario, NO Google Sheet)
- **Dueña:** `ramaya@gatodumas.com`
- **Compartido con:** service account (Lector)
- **Cómo se lee:** Drive API `files.get?alt=media` → parse con SheetJS
- **Columnas típicas:** Programa/Curso, Sigla, Fecha inicio, Fecha fin, Precio, Estado (POR ABRIR / INICIO / FINALIZO / DETENIDO / CANCELADO / SUSPENDIDO), Inscritos, Valor Groupon

**Pendiente:** Ruzmery/cliente agregará hoja "Presupuesto Pauta Programas" con
tabla programa × mes para que el dashboard también sume ese presupuesto (Meta
solo reporta budget de cursos).

---

## 13. Business Portfolio Meta (detalle)

Ya cubierto en 5.1, pero puntualizando:

**Pasos que se ejecutaron para tenerlo listo:**
1. Crear Business Portfolio `Gato Dumas Bucaramanga` (o usar el existente)
2. Agregar la ad account `act_248616958293893` al portfolio
3. Crear App `Dashboard 5 Gatos` en `developers.facebook.com` vinculada al portfolio
4. Agregar producto `Marketing API` a la app
5. Crear System User `dashboard-5gatos` con rol Empleado
6. Asignar la ad account al System User con rol Analista
7. Asignar el System User a la app con rol Administrador
8. Solicitar generación de token → Meta pide aprobación de 2do admin
9. Segundo admin del portfolio (persona real de 5 Gatos con cuenta Facebook) aprueba
10. Copiar token permanente y guardar en Vercel como `META_ACCESS_TOKEN_5GATOS`

Docs con el paso a paso completo: `docs/BUSINESS_MANAGER_SETUP.md`.

---

## 14. Diseño visual

### Paleta actual (admin sobrio)
- **Fondo base:** `#fafafa`
- **Superficies:** `#ffffff`
- **Tinta principal:** `#111827` (near-black con leve tinte)
- **Tinta muted:** `#6b7280`
- **Acento:** `#1f2937` (grafito oscuro, estilo Linear/Vercel)
- **Bordes:** `#e5e7eb`
- **Hover:** `#f3f4f6`
- **Semantic:** verde `#059669`, ámbar `#d97706`, rojo `#dc2626`
- **Semantic soft:** `#ecfdf5`, `#fef3c7`, `#fee2e2`

### Tipografía
- **Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, ...`
- Sin fuentes CDN. Solo sistema.
- Números tabulares (`font-variant-numeric: tabular-nums`) en cifras
- Sin `text-transform: uppercase` en headings (solo etiquetas pequeñas con `tracking-wide`)

### Radius y sombras
- Radius: `6px` en cards/inputs, `4px` en chips, `8px` en cards grandes
- Sombra: `0 1px 2px rgba(0,0,0,0.05)` en cards principales, ninguna en tablas

### Paleta legacy (Brand House "The Lab") — no usada en `/5gatos`
Los tokens `--lab-*` siguen en `src/app/globals.css` para no romper `/login`
si algún día se refactoriza. NO se usan en el dashboard 5 Gatos.

---

## 15. Testing

### Tests unitarios (node:test vía tsx)
- `src/lib/mapping/__tests__/courses.test.ts` — matcher curso↔adset (5 tests)
- `src/lib/fivegatos/__tests__/presupuesto.test.ts` — cálculo presupuesto (13 tests)
- `src/lib/fivegatos/__tests__/pauta-info.test.ts` — fmt frecuencia + fecha (7 tests)
- `src/lib/sheets/programacion-gato-bga.test.ts` — parser Excel cliente (40 tests)

**Total: 65 tests, todos verdes al día de hoy.**

### Correrlos
```bash
cd /Users/mac/gato-dumas-dashboard
npm run test:mapping
npm run test:presupuesto
npm run test:pauta
# Programación: tsx --test src/lib/sheets/programacion-gato-bga.test.ts
```

### Sin tests E2E ni de integración
Se probó todo manualmente contra Meta REAL antes de cada deploy.

---

## 16. Deployment

### Cadena de deploy actual
1. Cambios en `main` (o feature branch)
2. Ejecutar `vercel --prod --yes` desde local
3. Vercel builda + despliega
4. Health check: `curl https://gato-dumas-dashboard.vercel.app/api/health`

### NO hay GitHub Actions ni auto-deploy en push
Es intencional: control manual de cuándo se sube a producción.

### Rollback
```bash
vercel rollback <deployment-url>
# o desde dashboard Vercel: Deployments → clic en versión anterior → "Promote to production"
```

### Guía completa: `docs/DEPLOY_5GATOS.md`

---

## 17. Cómo replicar el proyecto desde cero

Si algún día se quisiera reconstruir todo para otro cliente similar:

### Paso 1: Business Meta
- Portfolio + Ad Account + App + Marketing API + System User + token permanente
- Guía: `docs/BUSINESS_MANAGER_SETUP.md`

### Paso 2: Google Cloud
- Proyecto GCP para OAuth Login (Consent Screen + OAuth Client Web)
- Proyecto GCP para Service Account (Sheets API + Drive API habilitadas)
- Descargar JSON key del Service Account
- Guía: `docs/LOGIN_SETUP.md`

### Paso 3: Sheets/Excel
- Crear Sheet PROD para snapshots
- Crear Sheet Mapeo curso↔adset y compartirlo con SA
- Recibir Excel oficial del cliente y compartirlo con SA (como Lector)

### Paso 4: Repo
```bash
git clone https://github.com/juandgarcia1224/gato-dumas-dashboard-pauta.git
cd gato-dumas-dashboard-pauta
npm install
cp .env.example .env.local
# Llenar .env.local con todos los valores
npm run validate:env
npm run dev
# Verificar http://localhost:3000/5gatos
```

### Paso 5: Vercel
- `vercel link` para conectar el proyecto
- Cargar todas las env vars en Prod + Preview + Dev
- `vercel --prod`
- Configurar dominio si aplica

### Paso 6: Cron
- Ya está en `vercel.json`
- Vercel lo detecta automáticamente al primer deploy en Prod

### Paso 7: Testing final
- Health check verde
- Login funcional
- Datos vivos cargando

---

## 18. Operación diaria

### Para el cliente (5 Gatos)
- Entrar a https://gato-dumas-dashboard.vercel.app/5gatos
- Login con Google (correo autorizado)
- Ver KPIs, drill-down en campañas, tabla por curso
- Descargar Excel cuando quiera

### Para Ruzmery
- **Editar mapeo curso↔adset:** en el Sheet `Mapeo_Cursos_5Gatos_Bucaramanga`
- **Actualizar cursos/precios/estado/fechas:** en el Excel oficial (dueña ella)
- Los cambios se reflejan en máximo 5 horas (cache)

### Para Juan (CookMinds)
- **Agregar correo a allowlist:** editar `AUTH_ALLOWED_EMAILS` en Vercel
- **Rotar token Meta:** guía en `docs/BUSINESS_MANAGER_SETUP.md`
- **Ver logs:** `vercel logs https://gato-dumas-dashboard.vercel.app`
- **Health check:** `curl https://gato-dumas-dashboard.vercel.app/api/health`
- **Deploy:** `vercel --prod --yes` desde `/Users/mac/gato-dumas-dashboard`

---

## 19. Debugging común

### "Estamos actualizando los datos" en pantalla
Posibles causas:
1. Token Meta expirado → verificar con `curl` + `debug_token`
2. Rate limit Meta (code 4) → esperar 15-30 min o subir cache
3. Sheet mapeo no accesible → verificar SA con permisos
4. Excel cliente no accesible → verificar Drive API habilitada + SA compartido

Diagnóstico:
```bash
vercel logs https://gato-dumas-dashboard.vercel.app --json | grep error
```

### Login falla con `redirect_uri_mismatch`
Revisar en Google Cloud Console → OAuth Client → Authorized redirect URIs:
- `http://localhost:3000/api/auth/callback/google`
- `https://gato-dumas-dashboard.vercel.app/api/auth/callback/google`

### "DECODER routines::unsupported" en Sheets
Private key en Vercel mal formateada (comillas dobles envolventes o `\n` mal
escapados). Re-subir desde el dashboard Vercel manualmente, pegando el valor
sin las comillas envolventes.

### Adsets no aparecen en la tabla
Verificar `effective_status`. Solo se muestran ACTIVE. Meta reporta PAUSED
si la campaña padre está pausada aunque el adset esté ACTIVE.

---

## 20. Decisiones arquitectónicas históricas

### Por qué solo lectura
El cliente puede consultar pero nunca modificar. Reduce riesgo y complejidad.
Meta permite permisos read-only aparte de write; usamos read-only.

### Por qué el diseño cambió 3 veces
1. Fable inventó paleta con rojo Dumas (rechazado por Juan)
2. Migración a Brand House oficial "The Lab" (rechazado por cliente por confuso)
3. Rediseño final admin sobrio Linear/Vercel style (aceptado)

Lección: para dashboards operativos, sobrio > editorial. Ver mockups que
quedaron como artifacts.

### Por qué se retiró el AlertsPanel
El cliente lo consideró confuso. Prefirió ver datos crudos y decidir él.
El código sigue en el repo (`AlertsPanel.tsx`, `programacion-cross.ts`) por
si algún día se decide volver.

### Por qué cache 5 horas
Meta rate limits estrictos con app en Acceso Limitado. Con 10 min se disparó
al cambiar mes 2-3 veces seguidas. 5h es aceptable para el uso del cliente
(no necesita datos al segundo).

### Por qué dos proyectos GCP separados
El OAuth Login está en `5gatos-dashboard-auth` (bajo cookmindsagency) para
independencia total. Los Service Accounts de Sheets están en
`cookminds-dashboards` (proyecto de contabilidad) porque ya existían.
Ambos flujos coexisten sin problemas.

### Por qué no chat IA
Decidido por Juan: no gastar en API. Sería el pendiente si en el futuro se
quiere agregar consulta libre tipo "cuánto he gastado en el curso de galletas".

---

## 21. Pendientes y limitaciones conocidas

### Pendientes activos
1. **Hoja "Presupuesto Pauta Programas" dentro del Excel del cliente**
   - Ruzmery/cliente la agregará. Cuando esté, se conecta al dashboard.
2. **Chat IA flotante** — cancelado.
3. **2 de 3 campañas ACTIVE sin budget en Meta** — se resuelve con #1 o
   cuando el cliente configure budgets directo en Meta.

### Limitaciones aceptadas
- **App Meta en Acceso Limitado** — rate limit estricto (mitigado con cache)
- **Vercel Hobby** — cron solo diario (no cada 3h como el requerimiento original)
- **Cliente sin NIT** — no se puede subir a Advanced Access de Meta
- **Solo Meta Ads** — no incluye TikTok, Google Ads, etc.
- **Sin push notifications** — el cliente debe entrar activamente

### Roadmap potencial (no comprometido)
- Migrar a Vercel Pro → cron cada 3h + más regiones
- Verificación empresarial cuando el cliente saque NIT → App Review + Advanced Access
- Agregar TikTok Ads (ver `docs/FUTURO_TIKTOK.md`)
- Chat IA cuando se justifique el costo
- Notificaciones semanales por email con snapshot

---

## Fin del blueprint

**Versión:** 1.0
**Fecha:** 2026-07-26
**Autor:** CookMinds (Juan García) + Claude
**Mantenimiento:** actualizar cuando se agreguen features grandes o cambien
integraciones/credenciales.
