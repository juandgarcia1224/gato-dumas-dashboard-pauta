# Operación — Dashboard Gato Dumas

Guía operativa del **Centro de Seguimiento Digital** de Gato Dumas (CookMinds).
Pensada para Juan / Paola. Pauta digital · Meta Ads.

---

## 1. Qué es el dashboard
Panel web que muestra el desempeño de la pauta de Meta Ads de Gato Dumas, leyendo
desde un Google Sheet que funciona como base de datos. Separa:
- **Consolidado** (Colombia + Bucaramanga),
- **Gato Colombia** (Bogotá + Barranquilla),
- **Gato Bucaramanga** (Cinco Gatos).

Flujo: `Meta Ads → Google Sheets → dashboard`. El dashboard **lee de Sheets**;
no llama a Meta en vivo.

## 2. Sheet oficial (PROD)
- **Nombre:** `DB_Dashboard_Gato_Dumas_Meta_Ads_PROD`
- **ID:** `1Mbh7nkLQttvZOGzMZtQpsMlk3sGeG3R854KjyTomF-k`
- **Ruta:** CookMinds / Clientes / Gato Dumas / Dashboard Pauta · Owner `cookmindsagency@gmail.com`
- **Service account (Editor):** `gato-dumas-dashboard-writer@cookminds-dashboards.iam.gserviceaccount.com`
- Hojas: `00_Config`, `01_MediaPlan`, `02_Meta_Campaigns_Raw`, `03_Meta_Adsets_Raw`, `04_Meta_Ads_Raw`, `05_Daily_Pacing`, `06_Alerts`, `07_Update_Log`.

## 3. Actualizar Meta (token temporal)
El token de Meta **no se guarda**; se entrega por corrida (ver `SEGURIDAD_TOKENS.md`).
```bash
# Forma B (interactiva, oculta el token):
npm run meta:update:manual -- --range this_month --updatedBy Juan
# Forma A (token inline):
META_ACCESS_TOKEN="<TOKEN>" npm run meta:update -- --range this_month --updatedBy Juan
```
Rangos: `today | yesterday | last_7d | this_month` o `--dateStart/--dateStop`.

## 4. Recalcular pacing SIN token
Tras editar `01_MediaPlan` (presupuestos), refresca el pacing sin tocar Meta:
```bash
npm run pacing:recompute -- 2026-05
```
Lee `01_MediaPlan` + el gasto ya cargado y reescribe `05_Daily_Pacing`.

## 5–7. Ámbitos
- **Consolidado:** suma Colombia + Bucaramanga. KPIs, alertas y tablas combinadas. El pacing solo considera cuentas **con plan** y avisa si alguna queda excluida.
- **Gato Colombia:** cuenta `act_299121374587072` (Bogotá + Barranquilla). KPIs/alertas/pacing/tablas solo de Colombia.
- **Gato Bucaramanga:** cuenta `act_248616958293893` (Cinco Gatos). Independiente. KPIs/alertas/tablas propias.

## 8. Qué significa "Sin plan mensual"
La cuenta no tiene `planned_budget` en `01_MediaPlan` para el mes → el dashboard
**no puede** calcular pacing ni % consumido y lo deja explícito (no inventa cifras).
Hoy aplica a **Gato Bucaramanga** (presupuesto mensual pendiente de confirmar).

## 9. Qué debe llenar Paola/Juan en `01_MediaPlan`
Ver guía detallada en [`MEDIAPLAN_GATO_DUMAS.md`](MEDIAPLAN_GATO_DUMAS.md). Mínimo:
`month` (`YYYY-MM`), `platform` (`Meta`), `account_group` (`gato_colombia`/`gato_bucaramanga`),
`planned_budget` (número plano en COP). Pendiente: **presupuesto mensual Meta de Bucaramanga**.

## 10. Si el token vence
Meta responde `(#190) ... token expired`. Genera otro en
[Graph API Explorer](https://developers.facebook.com/tools/explorer/) (`ads_read`) y
vuelve a correr el comando. No lo guardes en archivos ni lo pegues en chats.

## 11. Si Google Sheets falla
- `The caller does not have permission` → comparte el Sheet como Editor con el service account.
- `Google Sheets API ... is disabled` → habilita la API en `console.cloud.google.com/apis/library/sheets.googleapis.com?project=cookminds-dashboards`.
- Credenciales: viven en `.env.local` (no se commitea) y la key en `~/.secrets/cookminds/gato-dumas-dashboard/`.

## 12. Qué NO tocar
- No editar a mano `02/03/04` (RAW de Meta) ni `05_Daily_Pacing`/`06_Alerts`/`07_Update_Log` (se calculan/escriben solos).
- No cambiar encabezados de las hojas.
- No subir `.env.local` ni la key JSON a ningún lado.
- No usar el presupuesto **anual** de Bucaramanga como si fuera mensual.

## Comandos rápidos
```bash
npm run validate:env          # valida Google + cuentas (token opcional)
npm run sheets:setup          # crea/valida hojas (idempotente)
npm run pacing:recompute -- 2026-05   # refresca pacing sin token
npm run dev                   # dashboard local (http://localhost:3000)
npm run build                 # build de producción
```
