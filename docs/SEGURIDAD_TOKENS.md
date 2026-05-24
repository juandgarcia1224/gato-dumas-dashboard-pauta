# SEGURIDAD — Tokens y credenciales

Reglas de manejo de secretos para este proyecto.

## Principios

- **Nunca** guardar tokens reales en el código.
- **Nunca** commitear `.env.local` ni claves de service account.
- Los secretos viven **solo** como variables de entorno locales.
- `.gitignore` ya excluye: `.env`, `.env.local`, `*.key`, `*.pem`, `service-account*.json`, `credentials*.json`.

## Secretos del proyecto

| Secreto | Dónde | Sensibilidad |
|---|---|---|
| `META_ACCESS_TOKEN` | `.env.local` | 🔴 Alta — da acceso a las cuentas de Meta. |
| `GOOGLE_PRIVATE_KEY` | `.env.local` | 🔴 Alta — clave privada del service account. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `.env.local` | 🟠 Media. |
| `GOOGLE_SHEET_ID` | `.env.local` | 🟢 Baja. |
| `META_AD_ACCOUNT_*` | `.env.local` / `.env.example` | 🟢 Baja — los IDs no son secretos. |

> Los IDs `act_...` no son secretos, por eso vienen prellenados en `.env.example`.
> El **token** sí lo es y siempre va vacío en la plantilla.

## Token de Meta

- **Temporal (dev):** token de usuario del Graph API Explorer. Caduca rápido (1–2h o ~60 días extendido). Útil para pruebas.
- **Recurrente (recomendado):** **System User token** del Business Manager con `ads_read`. No caduca con la sesión de un humano y es revocable.

### Si el token caduca
Meta responde `(#190) ... token ... expired`. Genera uno nuevo y reemplaza
`META_ACCESS_TOKEN` en `.env.local`. No hace falta tocar código.

### Buenas prácticas
- Usa el **mínimo permiso** necesario (`ads_read`; `ads_management` solo si necesitas estados fiables).
- Revoca tokens temporales cuando termines de probar.
- No pegues tokens en chats, capturas, ni en el repo.
- Si un token se filtró: revócalo en Business Settings y genera otro.

## Service account de Google

- La clave JSON es un secreto: guárdala fuera del repo.
- Comparte el Sheet con el email del service account (permiso de Editor), no des acceso público al Sheet.
- Si rotas la clave, actualiza `GOOGLE_PRIVATE_KEY` en `.env.local`.

## Producción / despliegue (futuro)

- Configurar las variables en el gestor de secretos del hosting (no en archivos).
- No exponer `/api/health` con datos sensibles: hoy solo devuelve **flags booleanos** de configuración, nunca los valores.
