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

## 2. Token de Meta — TEMPORAL (no se guarda)

El token de Meta (`ads_read`) **no va en `.env.local`**: se entrega por corrida
al actualizar (ver [`OPERACION_ACTUALIZACION.md`](OPERACION_ACTUALIZACION.md)).
Deja `META_ACCESS_TOKEN=` vacío. Genera el token en
[Graph API Explorer](https://developers.facebook.com/tools/explorer/) cuando vayas a sincronizar.

> No lo pegues en ChatGPT/Claude/WhatsApp/Notion. Ver [`SEGURIDAD_TOKENS.md`](SEGURIDAD_TOKENS.md).

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
5. `GOOGLE_SHEET_ID` ya viene prellenado con el Sheet PROD
   `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k` (DB_Dashboard_Gato_Dumas_Meta_Ads_PROD, owner cookmindsagency@gmail.com).
6. **Comparte el Sheet PROD con el email del service account** con permiso de *Editor*.

Ejemplo de `GOOGLE_PRIVATE_KEY` en `.env.local`:
```
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
```

## 4. Validar

```bash
npm run validate:env
```
Valida la base (Google + cuentas). **Pasa aunque falte el token** (es temporal). Si hay ❌ en Google o cuentas, revisa esa variable.

## 5. Preparar las hojas

```bash
npm run sheets:setup
```
Crea las 8 hojas (`00_Config` … `07_Update_Log`) con sus encabezados y siembra
`00_Config` con las dos cuentas. `01_MediaPlan` queda lista para llenar a mano.

## 6. Primera carga de datos (con token temporal)

```bash
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --range this_month --updatedBy Juan
# o, interactivo (no muestra el token):
npm run meta:update:manual -- --range this_month --updatedBy Juan
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
