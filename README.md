# Dashboard Gato Dumas — Centro de Seguimiento Digital

Dashboard de pauta digital para **Gato Dumas** (cliente piloto de CookMinds).
**Fase 1: Meta Ads + Google Sheets.** TikTok queda para Fase 2 (arquitectura ya modular).

> ⚠️ **Diseño provisional.** La UI actual es funcional pero NO es el diseño final.
> El sistema visual se construirá con **Cloud Design** sobre el contrato de datos
> documentado en [`docs/DESIGN_CONTRACT.md`](docs/DESIGN_CONTRACT.md).

---

## ¿Qué hace?

1. Se conecta a Meta Ads con un **token temporal** (variable de entorno).
2. Descarga datos **reales** de las **dos cuentas** de Gato Dumas:
   - **Gato Colombia** (`act_299121374587072`) — Bogotá / Barranquilla.
   - **Gato Bucaramanga** (`act_248616958293893`) — Cinco Gatos.
3. Transforma e interpreta resultados (mensajes, leads, etc.).
4. Escribe en **Google Sheets** (base de datos viva).
5. Calcula **pacing**, genera **alertas** y registra cada corrida en un **log**.
6. Muestra un **dashboard web** que lee desde Sheets, con filtro por cuenta.

### Regla crítica de datos
**Nunca se inventan datos.** Si falta token, cuenta, sheet o datos, la UI muestra
estados claros (no mock): *token no configurado*, *sin datos para este rango*, etc.

---

## Arranque rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables (copia y completa)
cp .env.example .env.local
#   → token de Meta, GOOGLE_SHEET_ID y credenciales del service account

# 3. Validar configuración
npm run validate:env

# 4. Preparar las hojas del Google Sheet (crea/valida 00..07)
npm run sheets:setup

# 5. Descargar datos reales de Meta y escribirlos en Sheets
npm run meta:update -- --range this_month --updatedBy Juan

# 6. Levantar el dashboard
npm run dev      # http://localhost:3000
```

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dashboard en desarrollo (localhost:3000). |
| `npm run build` / `npm run start` | Build y arranque de producción. |
| `npm run validate:env` | Verifica que las variables de entorno estén completas. |
| `npm run sheets:setup` | Crea/valida las 8 hojas y siembra `00_Config`. |
| `npm run meta:update -- --range this_month --updatedBy Juan` | Actualiza datos de Meta. |
| `npm run meta:update -- --range last_7d --updatedBy Paola` | Últimos 7 días. |
| `npm run meta:update -- --dateStart 2026-05-01 --dateStop 2026-05-24 --updatedBy Juan` | Rango custom. |

Rangos válidos: `today`, `yesterday`, `last_7d`, `this_month` (default), o `--dateStart/--dateStop`.

---

## Variables que debe llenar Juan (`.env.local`)

| Variable | Descripción |
|---|---|
| `META_ACCESS_TOKEN` | Token temporal de Meta con permiso `ads_read`. |
| `META_AD_ACCOUNT_GATO_COLOMBIA` | Ya prellenado: `act_299121374587072`. |
| `META_AD_ACCOUNT_GATO_BUCARAMANGA` | Ya prellenado: `act_248616958293893`. |
| `GOOGLE_SHEET_ID` | ID del Google Sheet base de datos. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email del service account. |
| `GOOGLE_PRIVATE_KEY` | Clave privada del service account (con `\n`). |

Detalle paso a paso en [`docs/SETUP.md`](docs/SETUP.md) y seguridad en
[`docs/SEGURIDAD_TOKENS.md`](docs/SEGURIDAD_TOKENS.md).

---

## Arquitectura

```
src/
  app/                      Next.js App Router
    page.tsx                Ruta única (vista interna)
    api/dashboard/route.ts  Lee Sheets → DashboardPayload (contrato de datos)
    api/health/route.ts     Estado de configuración (sin secretos)
  components/               UI base provisional (reemplazable por Cloud Design)
  lib/
    meta/                   Cliente Graph API, insights, transformación, tipos
    sheets/                 Auth, schema (fuente de columnas), writer, reader
    dashboard/              metrics, alerts, pacing, formatters, contract
    config/                 clients (cuentas), env (variables y validación)
scripts/                    validate-env, setup-sheets, update-meta
docs/                       Documentación y contrato para Cloud Design
```

Flujo: `Meta API → transform → Google Sheets → /api/dashboard → UI`.

---

## Documentación

- [`docs/SETUP.md`](docs/SETUP.md) — instalación y credenciales paso a paso.
- [`docs/DATA_SCHEMA.md`](docs/DATA_SCHEMA.md) — todas las hojas y columnas.
- [`docs/DESIGN_CONTRACT.md`](docs/DESIGN_CONTRACT.md) — **para Cloud Design**.
- [`docs/OPERACION_ACTUALIZACION.md`](docs/OPERACION_ACTUALIZACION.md) — operación diaria.
- [`docs/SEGURIDAD_TOKENS.md`](docs/SEGURIDAD_TOKENS.md) — manejo de tokens/credenciales.
- [`docs/FUTURO_TIKTOK.md`](docs/FUTURO_TIKTOK.md) — plan de Fase 2.
