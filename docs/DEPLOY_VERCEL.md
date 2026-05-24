# Despliegue en Vercel — Dashboard Gato Dumas

> ⚠️ **Aún NO desplegar.** Este documento deja la ruta lista; el deploy se hace
> solo con confirmación final de Juan.

## Cómo funciona en Vercel
- Vercel sirve el **dashboard Next.js**, que **lee Google Sheets** (la base de datos viva).
- Vercel **NO** llama a Meta en vivo. La carga de datos (`meta:update`) se corre
  **local/manual** con token temporal; el dashboard en Vercel refleja lo último que
  haya quedado en el Sheet.
- Por eso Vercel **no necesita** el token de Meta.

## Variables de entorno en Vercel (Project → Settings → Environment Variables)

| Variable | Valor | Notas |
|---|---|---|
| `GOOGLE_SHEET_ID` | `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k` | Sheet PROD |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com` | identificador |
| `GOOGLE_PRIVATE_KEY` | *(la clave del JSON seguro)* | ver nota abajo |
| `META_AD_ACCOUNT_GATO_COLOMBIA` | `act_299121374587072` | no secreto |
| `META_AD_ACCOUNT_GATO_BUCARAMANGA` | `act_248616958293893` | no secreto |
| `NEXT_PUBLIC_CLIENT_NAME` | `Gato Dumas` | |
| `NEXT_PUBLIC_TIMEZONE` | `America/Bogota` | |

**NO agregar `META_ACCESS_TOKEN`** como variable permanente. El token es temporal y
se usa solo en local al correr `meta:update`.

### `GOOGLE_PRIVATE_KEY` en Vercel — saltos de línea
La clave tiene saltos de línea. Dos formas válidas:
1. **Pegar con `\n` escapados** (como en `.env.local`): el código ya hace
   `replace(/\\n/g, "\n")` en `src/lib/config/env.ts`, así que funciona igual.
2. Pegar la clave con saltos reales (Vercel acepta multilínea). Cualquiera de las dos sirve.

> Tomar el valor desde el JSON seguro local (`~/.secrets/cookminds/gato-dumas-dashboard/gato-dumas-dashboard-writer.json`),
> **nunca** desde el repo (no está ahí). No pegar el JSON completo; solo el campo `private_key`.

## Reglas de seguridad para el deploy
- **No** subir `.env.local` ni el JSON de la service account (están en `.gitignore` / `.secrets/`).
- Configurar las variables **solo** en el panel de Vercel (no en archivos del repo).
- El Sheet debe seguir compartido como **Editor** con el service account.
- `/api/health` solo expone flags booleanos, nunca valores.

## Pasos de deploy (cuando Juan confirme)
1. Importar el repo privado `gato-dumas-dashboard` en Vercel.
2. Framework: **Next.js** (autodetectado). Build: `next build` (por defecto).
3. Cargar las variables de la tabla de arriba (Production + Preview).
4. Deploy. Verificar `/api/health` (200) y el dashboard.
5. Confirmar que el dashboard muestra la data ya cargada en Sheets.

## Actualización de datos en producción
- Mientras no exista un **System User token estable**, la actualización es manual/local:
  ```bash
  npm run meta:update:manual -- --range this_month --updatedBy Juan
  ```
  Eso escribe en el Sheet; Vercel reflejará el cambio en la siguiente carga del dashboard.
- (Futuro) Con un System User token revocable, se podría automatizar vía cron, pero
  **no** se guarda el token en Vercel sin esa decisión explícita.

## Pendiente conocido
- **Gato Bucaramanga** seguirá mostrando "Sin plan mensual" hasta cargar su
  `planned_budget` real en `01_MediaPlan` (ver `MEDIAPLAN_GATO_DUMAS.md`).
