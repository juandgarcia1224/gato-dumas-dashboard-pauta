# SETUP — Instalación y credenciales

Guía paso a paso para dejar el dashboard funcionando con datos reales.

## 0. Requisitos

- Node.js 18+ (probado en Node 22/24).
- Acceso a las dos cuentas publicitarias de Gato Dumas en Meta Business.
- Un Google Sheet vacío y un **service account** de Google Cloud.

## 1. Instalar

```bash
cd gato-dumas-dashboard
npm install
cp .env.example .env.local
```

## 2. Token de Meta

Necesitas un token con permiso de lectura de anuncios (`ads_read`).

**Opción rápida (token temporal):**
1. Entra a [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Selecciona tu app y genera un token de usuario con `ads_read` (y `ads_management` si vas a leer estados).
3. Copia el token a `META_ACCESS_TOKEN` en `.env.local`.

> Los tokens de usuario caducan (1–2h, o ~60 días si lo extiendes). Para uso
> recurrente, lo ideal es un **System User token** del Business Manager.
> Ver [`SEGURIDAD_TOKENS.md`](SEGURIDAD_TOKENS.md).

Las cuentas ya vienen prellenadas en `.env.example`:
```
META_AD_ACCOUNT_GATO_COLOMBIA=act_299121374587072
META_AD_ACCOUNT_GATO_BUCARAMANGA=act_248616958293893
```

## 3. Google Sheets + Service Account

1. En [Google Cloud Console](https://console.cloud.google.com/) crea (o usa) un proyecto.
2. Habilita **Google Sheets API**.
3. Crea un **Service Account** → genera una **clave JSON**.
4. Del JSON copia a `.env.local`:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (entre comillas, conservando los `\n`).
5. Crea un Google Sheet nuevo. Copia su ID (parte de la URL entre `/d/` y `/edit`) a `GOOGLE_SHEET_ID`.
6. **Comparte el Sheet con el email del service account** con permiso de *Editor*.

Ejemplo de `GOOGLE_PRIVATE_KEY` en `.env.local`:
```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

## 4. Validar

```bash
npm run validate:env
```
Debe mostrar ✅ en Meta y Sheets. Si hay ❌, revisa la variable indicada.

## 5. Preparar las hojas

```bash
npm run sheets:setup
```
Crea las 8 hojas (`00_Config` … `07_Update_Log`) con sus encabezados y siembra
`00_Config` con las dos cuentas. `01_MediaPlan` queda lista para llenar a mano.

## 6. Primera carga de datos

```bash
npm run meta:update -- --range this_month --updatedBy Juan
```

## 7. Dashboard

```bash
npm run dev
# http://localhost:3000
```

## Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `GOOGLE_PRIVATE_KEY` inválida | `\n` mal pegados | Mantén el valor entre comillas con `\n` literales. |
| `The caller does not have permission` | Sheet no compartido | Comparte el Sheet con el email del service account. |
| Meta `(#190) token expired` | Token caducó | Genera uno nuevo (ver SEGURIDAD_TOKENS.md). |
| Dashboard dice "Sin datos" | No se ha corrido `meta:update` | Ejecuta la actualización. |
