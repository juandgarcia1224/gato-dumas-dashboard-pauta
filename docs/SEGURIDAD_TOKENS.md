# SEGURIDAD — Tokens y credenciales

Modelo de operación: **Google fijo · token de Meta temporal por corrida.**

## Principios

- **Google Sheets** queda configurado de forma persistente en `.env.local`.
- **El token de Meta NO se guarda.** Se renueva, y se entrega solo al momento de actualizar datos.
- El token vive únicamente durante la ejecución del comando:
  - no se guarda en archivos (`.env.local` lo deja vacío),
  - no se imprime en consola,
  - no se escribe en Google Sheets,
  - no se registra en `07_Update_Log`,
  - no se commitea.
- `.gitignore` excluye `.env`, `.env.local`, `*.key`, `*.pem`, `service-account*.json`, `credentials*.json`.

## ⚠️ Nunca pegues el token en:
ChatGPT, Claude, WhatsApp, Notion, correo, ni ningún documento o chat.
El token solo se pega en **tu terminal**, al correr el comando de actualización.

## Qué va en `.env.local` (persistente)

| Variable | Sensibilidad | Notas |
|---|---|---|
| `GOOGLE_SHEET_ID` | 🟢 Baja | Sheet PROD: `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 🟠 Media | del JSON del service account |
| `GOOGLE_PRIVATE_KEY` | 🔴 Alta | clave privada (entre comillas, con `\n`) |
| `META_AD_ACCOUNT_GATO_COLOMBIA` | 🟢 Baja | `act_299121374587072` |
| `META_AD_ACCOUNT_GATO_BUCARAMANGA` | 🟢 Baja | `act_248616958293893` |
| `META_ACCESS_TOKEN` | 🔴 Alta | **vacío** — se entrega por corrida, no se guarda |

## Cómo se entrega el token (solo al actualizar)

**Forma A — oficial (variable temporal en el comando):**
```bash
META_ACCESS_TOKEN="EAAB...elTokenDelDia..." npm run meta:update -- --range this_month --updatedBy Juan
```
La variable existe solo para ese proceso; al terminar, desaparece.

**Forma B — interactiva (pide el token y no lo muestra):**
```bash
npm run meta:update:manual -- --range this_month --updatedBy Paola
# → "Token de Meta:"  (pegas el token; no se ve en pantalla)
```

> Si en algún terminal el ocultado de la Forma B se ve inestable, usa la **Forma A** (es la oficial).

### Higiene del historial de shell
La Forma A deja el token en el historial del shell de esa sesión. Recomendado:
- anteponer un espacio al comando (con `HISTCONTROL=ignorespace`), o
- usar la **Forma B**, o
- limpiar con `history -c` tras la corrida.

## Token de Meta

- Genéralo en [Graph API Explorer](https://developers.facebook.com/tools/explorer/) con permiso `ads_read`.
- Caduca pronto (1–2h, o ~60 días si se extiende). Por eso **no se guarda**.
- Para automatización futura sin intervención, evaluar un **System User token** del Business Manager (revocable).

## Service account de Google

- La clave JSON es secreta: fuera del repo.
- El Sheet PROD debe estar **compartido como Editor** con el `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
- Owner del Sheet: `cookmindsagency@gmail.com`.

## Verificación

- `npm run validate:env` valida la **base** (Google + cuentas) y **pasa aunque falte el token** (es lo esperado).
- `/api/health` solo expone flags booleanos, nunca valores de secretos.
